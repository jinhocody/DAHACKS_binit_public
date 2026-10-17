import { AccessoryShop } from "@/components/mascot/AccessoryShop";
import { ActivityBanner } from "@/components/mascot/ActivityBanner";
import { HomeMascot } from "@/components/mascot/HomeMascot";
import { LevelBadge } from "@/components/mascot/LevelBadge";
import { Button } from "@/components/ui/Button";
import { ScanIcon } from "@/components/pixel/ScanIcon";

export default function Home() {
  return (
    <div className="flex min-h-[70vh] flex-col gap-6">
      <Button href="/scan" size="lg" className="w-full shadow-md">
        <ScanIcon size={32} /> Scan Item
      </Button>

      <ActivityBanner />

      <section
        id="character"
        aria-label="Pet plant character"
        className="relative flex min-h-[60vh] flex-1 border-2 border-transparent bg-white/15"
      >
        {/* Happy plant wearing the shop outfit, or the sad rainy plant while points are below 0. */}
        <HomeMascot />
        <LevelBadge className="absolute top-2 right-2 z-10" />
      </section>

      <AccessoryShop />
    </div>
  );
}
