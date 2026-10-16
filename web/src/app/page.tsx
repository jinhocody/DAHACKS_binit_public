import { AccessoryShop } from "@/components/mascot/AccessoryShop";
import { HomeMascot } from "@/components/mascot/HomeMascot";
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
        {/* Happy plant wearing the shop outfit, or the sad rainy plant while points are below 0. */}
        <HomeMascot />
      </section>

      <AccessoryShop />
    </div>
  );
}
