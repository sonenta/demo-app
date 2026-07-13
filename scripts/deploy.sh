#!/usr/bin/env bash
# deploy.sh — build the React demo locally and rsync dist/ to sonenta-web.
#
# Native deploy pattern (parité avec website/client-admin/scripts/deploy.sh):
#   Box   : sonenta@sonenta-web
#   Root  : /data/clients/sonenta/sonenta.com/demos/react
#   Layout: FLAT DOCROOT (case B) — nginx vhost sonenta.com already has a
#           location block `/demos/react/` with try_files $uri $uri/
#           /demos/react/index.html (SPA fallback, wired by website task α).
#           We rsync dist/ straight into $DEPLOY_ROOT with --delete; the
#           live sub-app is replaced file-by-file. We OWN this subtree fully
#           (no excludes needed). Sub-second mix-window during rsync is
#           acceptable for this demo SPA.
#
# nginx + certbot live on the box; no config changes are made from here
# (website peer owns the vhost). Build runs HERE, rsync to the box; no
# Docker, no GitHub Actions. There is no backend API key baked in — the
# Vite build inlines only VITE_* vars (optionally loaded from
# deploy/.env.production.local).
#
# Preflights (run before anything else):
#   1. SSH reachability of DEPLOY_SSH_HOST
#   2. Git repo + branch=main + clean tree + in sync with origin/main
#
# Usage:
#   ./scripts/deploy.sh                 # build + rsync to flat docroot
#   ./scripts/deploy.sh --pull          # if HEAD is behind origin/main, ff-only pull
#   ./scripts/deploy.sh --force-dirty   # deploy even with uncommitted changes (warn)
#   ./scripts/deploy.sh --dry-run       # show what would happen, do nothing
#
# Optional env (sane defaults below):
#   DEPLOY_SSH_HOST   (default: sonenta@sonenta-web)
#   DEPLOY_ROOT       (default: /data/clients/sonenta/sonenta.com/demos/react)
#
# A deploy/.env.production.local file (gitignored) is loaded if present, in
# case future build-time VITE_* env vars ever show up.

set -euo pipefail

# ---- args ----------------------------------------------------------------
DRY_RUN=0
DO_PULL=0
FORCE_DIRTY=0
for arg in "$@"; do
    case "$arg" in
        --dry-run)      DRY_RUN=1 ;;
        --pull)         DO_PULL=1 ;;
        --force-dirty)  FORCE_DIRTY=1 ;;
        -h|--help)
            sed -n '2,40p' "$0"; exit 0 ;;
        *) echo "deploy: unknown arg '$arg'" >&2; exit 2 ;;
    esac
done

run() {
    if [[ $DRY_RUN -eq 1 ]]; then
        echo "+ $*"
    else
        eval "$@"
    fi
}

# ---- locate repo ---------------------------------------------------------
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$REPO_DIR"

if [[ ! -f package.json ]] || ! grep -q '"@sonenta/demo-app"' package.json; then
    echo "deploy: not in demo-app repo root (cwd=$REPO_DIR)" >&2
    exit 2
fi

# ---- preflight 1 — SSH reachability --------------------------------------
: "${DEPLOY_SSH_HOST:=sonenta@sonenta-web}"

echo "==> preflight: ssh $DEPLOY_SSH_HOST"
# BatchMode=yes: never prompt (auth must come from agent/key, not interactive).
# ConnectTimeout=5: fail fast on DNS/network issues.
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$DEPLOY_SSH_HOST" 'true' 2>/dev/null; then
    echo "deploy: SSH $DEPLOY_SSH_HOST injoignable. Vérifie ta clé / l'agent SSH avant de relancer." >&2
    exit 2
fi

# ---- preflight 2 — git state ---------------------------------------------
echo "==> preflight: git"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "deploy: not a git repository" >&2
    exit 2
fi

GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$GIT_BRANCH" != "main" ]]; then
    echo "deploy: current branch is '$GIT_BRANCH', expected 'main'." >&2
    echo "        Run \`git switch main\` and try again." >&2
    exit 2
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
    if [[ $FORCE_DIRTY -eq 1 ]]; then
        echo "deploy: WARNING — working tree is DIRTY but --force-dirty was passed." >&2
        echo "        Uncommitted changes will NOT be in git history." >&2
    else
        echo "deploy: working tree is dirty (uncommitted changes)." >&2
        echo "        Commit/stash them, or re-run with --force-dirty to ignore." >&2
        exit 2
    fi
fi

# fetch quietly; failure here is fatal so we surface offline/origin issues
if ! git fetch --quiet origin main; then
    echo "deploy: \`git fetch origin main\` failed — check your network/origin." >&2
    exit 2
fi

LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse origin/main)
AHEAD=$(git rev-list --count origin/main..HEAD)
BEHIND=$(git rev-list --count HEAD..origin/main)

if [[ "$LOCAL_SHA" == "$REMOTE_SHA" ]]; then
    : # up to date
elif [[ $BEHIND -gt 0 && $AHEAD -eq 0 ]]; then
    if [[ $DO_PULL -eq 1 ]]; then
        echo "    HEAD is $BEHIND commit(s) behind origin/main — pulling (ff-only)…"
        run "git pull --ff-only origin main"
    else
        echo "deploy: HEAD is $BEHIND commit(s) behind origin/main." >&2
        echo "        Run \`git pull origin main\` or re-run with --pull." >&2
        exit 2
    fi
elif [[ $AHEAD -gt 0 && $BEHIND -eq 0 ]]; then
    echo "    HEAD is $AHEAD commit(s) ahead of origin/main — deploying local commits."
else
    echo "    HEAD has diverged from origin/main ($AHEAD ahead, $BEHIND behind) — deploying local HEAD anyway."
fi

GIT_SHA=$(git rev-parse --short=12 HEAD)
echo "    Déploiement depuis commit $GIT_SHA branch main"

# ---- load operator env (gitignored, optional) ----------------------------
ENV_FILE="$REPO_DIR/deploy/.env.production.local"
if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a; . "$ENV_FILE"; set +a
fi

# ---- defaults ------------------------------------------------------------
: "${DEPLOY_ROOT:=/data/clients/sonenta/sonenta.com/demos/react}"

# ---- pick package manager ------------------------------------------------
# Repo ships package-lock.json → npm ci.
if [[ -f pnpm-lock.yaml ]]; then
    if ! command -v pnpm >/dev/null 2>&1; then
        echo "deploy: pnpm not on PATH (repo uses pnpm-lock.yaml)" >&2; exit 2
    fi
    INSTALL=(pnpm install --frozen-lockfile)
    BUILD=(pnpm run build)
elif [[ -f package-lock.json ]]; then
    INSTALL=(npm ci)
    BUILD=(npm run build)
else
    echo "deploy: no lockfile (need package-lock.json or pnpm-lock.yaml)" >&2; exit 2
fi

# ---- build (FROM A CLEAN CHECKOUT OF $GIT_SHA, NEVER FROM THE WORKING TREE) --
#
# We build in a throwaway `git worktree` pinned to HEAD, not in the repo you are
# standing in. This is not fussiness — it is the difference between "what I
# reviewed" and "what ships".
#
# Building from the working tree means the artifact is NOT addressable by a
# commit: you can only say what you THINK is live. On 2026-07-13 this repo's
# tree happened to hold another agent's uncommitted sign-in form, and a deploy
# would have put it on the public marketing page rendering raw, unpublished key
# names — with a green build, a clean rsync and a 200 from the site. Nothing in
# the pipeline would have said a word. The old --force-dirty guard was a
# WARNING, not a gate, and a warning only works until someone reaches for the
# flag (demo-app-vue's last prod deploy used it).
#
# Now stray code cannot ship even if you pass --force-dirty: the flag lets you
# deploy with a dirty tree, but what gets BUILT is still exactly $GIT_SHA.
BUILD_DIR=$(mktemp -d "${TMPDIR:-/tmp}/demo-app-deploy.XXXXXX")
cleanup_worktree() {
    git worktree remove --force "$BUILD_DIR" 2>/dev/null || rm -rf "$BUILD_DIR"
}
trap cleanup_worktree EXIT

echo "==> clean checkout of $GIT_SHA → $BUILD_DIR"
run "git worktree add --detach --quiet '$BUILD_DIR' '$GIT_SHA'"

# Build-time secrets are gitignored, so they are NOT in the clean checkout —
# carry them across explicitly. Without this the build silently inlines
# `undefined` for VITE_SONENTA_TOKEN and every visitor gets
# `Authorization: ApiKey undefined` (which is exactly what production shipped
# until 2026-07-13, unnoticed, because the CDN still served the bundles).
for envf in .env.production.local .env.local .env.production; do
    if [[ -f "$REPO_DIR/$envf" ]]; then
        echo "    carrying $envf into the clean checkout"
        run "cp '$REPO_DIR/$envf' '$BUILD_DIR/$envf'"
    fi
done

echo "==> install (in clean checkout)"
run "cd '$BUILD_DIR' && ${INSTALL[*]}"

echo "==> build (sha=$GIT_SHA, branch=$GIT_BRANCH)"
run "cd '$BUILD_DIR' && ${BUILD[*]}"

if [[ $DRY_RUN -eq 0 ]] && { [[ ! -d "$BUILD_DIR/dist" ]] || [[ ! -f "$BUILD_DIR/dist/index.html" ]]; }; then
    echo "deploy: dist/ missing or empty after build" >&2; exit 1
fi

# Stamp the bundle with the source commit so `curl /demos/react/version.txt`
# confirms what's actually live.
TS=$(date -u +%Y%m%d-%H%M%SZ)
run "printf '%s\n%s\n%s\n' '$GIT_SHA' '$GIT_BRANCH' '$TS' > '$BUILD_DIR/dist/version.txt'"

# ---- push ----------------------------------------------------------------
echo "==> rsync → $DEPLOY_SSH_HOST:$DEPLOY_ROOT/"
# Flat docroot owned entirely by this peer: rsync straight into $DEPLOY_ROOT,
# --delete to drop stale files from the previous build. `dist/` (note the
# trailing slash) copies the CONTENTS of dist, not the dist/ directory.
# No excludes — this subtree is ours.
run "rsync -avz --delete --human-readable '$BUILD_DIR/dist/' '$DEPLOY_SSH_HOST:$DEPLOY_ROOT/'"

echo
echo "Deployed."
echo "  URL    : https://sonenta.com/demos/react/"
echo "  Commit : $GIT_SHA ($GIT_BRANCH)"
echo "  Target : $DEPLOY_SSH_HOST:$DEPLOY_ROOT"
echo "  Stamp  : $TS (curl https://sonenta.com/demos/react/version.txt to verify)"
