import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { WasteCategory } from "@/lib/scan-types";

export const metadata: Metadata = {
  title: "History",
  description: "Your past Snap scans — coming soon.",
};

const PREVIEW: { item: string; category: WasteCategory; when: string }[] = [
  { item: "Plastic water bottle", category: "recycling", when: "Today" },
  { item: "Banana peel", category: "compost", when: "Yesterday" },
  { item: "AA batteries", category: "special", when: "2 days ago" },
];

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
          Coming soon
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-emerald-950">Scan history</h1>
        <p className="mt-2 max-w-xl text-gray-600">
          Soon you&apos;ll see every item you&apos;ve scanned, which bin it went in, and how your sorting
          habits add up over time.
        </p>
      </header>

      <Card className="relative overflow-hidden">
        <p className="text-sm font-semibold text-gray-500">Preview</p>
        <ul aria-hidden="true" className="mt-3 divide-y divide-gray-100 opacity-60 select-none">
          {PREVIEW.map((row) => (
            <li key={row.item} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium text-gray-900">{row.item}</p>
                <p className="text-xs text-gray-500">{row.when}</p>
              </div>
              <CategoryBadge category={row.category} />
            </li>
          ))}
        </ul>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-white to-transparent" />
      </Card>

      <Card className="flex flex-col items-center gap-3 text-center">
        <PixelIcon name="clock" size={48} light="#bae6fd" className="text-emerald-900" />
        <p className="text-gray-700">No scans saved yet. Try your first one now!</p>
        <Button href="/scan">Scan an item</Button>
      </Card>
    </div>
  );
}
