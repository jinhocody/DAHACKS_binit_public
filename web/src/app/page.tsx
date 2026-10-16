import { Mascot } from "@/components/mascot/Mascot";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex min-h-[70vh] flex-col gap-6">
      <Button href="/scan" size="lg" className="w-full shadow-md">
        <span aria-hidden="true">📸</span> Scan Item
      </Button>

      <section
        id="character"
        aria-label="Pet plant character"
        className="flex min-h-[60vh] flex-1 rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50/40"
      >
        {/* Accessory looks ("flower", "straw", "gold") will be picked by the accessory rules later. */}
        <Mascot look="base" />
      </section>
    </div>
  );
}
