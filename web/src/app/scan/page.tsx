import type { Metadata } from "next";
import { Scanner } from "@/components/scan/Scanner";

export const metadata: Metadata = {
  title: "Scan an item",
  description: "Snap a photo of your trash and find out which bin it goes in.",
};

export default function ScanPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl min-w-0 flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Scan an item</h1>
        <p className="mt-1 text-sm opacity-75">
          Take a photo of something you want to toss. We&apos;ll tell you which bin it belongs in and how
          to prep it (Cupertino rules). Verify it in the bin to earn points.
        </p>
      </header>
      <Scanner />
    </div>
  );
}
