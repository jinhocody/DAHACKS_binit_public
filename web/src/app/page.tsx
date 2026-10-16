import { AccessoryShop } from "@/components/mascot/AccessoryShop";
import { HomeMascot } from "@/components/mascot/HomeMascot";
import { Button } from "@/components/ui/Button";
import { PixelIcon } from "@/components/pixel/PixelIcon";

export default function Home() {
  return (
    <div className="flex min-h-[70vh] flex-col gap-6">
      <Button href="/scan" size="lg" className="w-full shadow-md">
        <PixelIcon name="camera" size={24} light="transparent" /> Scan Item
      </Button>

      <section
        id="character"
        aria-label="Pet plant character"
        className="flex min-h-[60vh] flex-1 border-2 border-emerald-900/40 bg-white/15"
      >
        {/* Happy plant wearing the shop outfit, or the sad rainy plant while points are below 0. */}
        <HomeMascot />
      </section>

      <AccessoryShop />
    </div>
  );
}
