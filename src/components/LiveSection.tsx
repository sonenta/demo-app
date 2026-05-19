import { MissingKeysPanel } from "./MissingKeysPanel";
import { TriggerCard } from "./TriggerCard";

export function LiveSection() {
  return (
    <section id="live" className="border-y border-ink-800 bg-ink-900/40 mt-12">
      <div className="mx-auto max-w-6xl px-6 py-16 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-start">
        <MissingKeysPanel />
        <TriggerCard />
      </div>
    </section>
  );
}
