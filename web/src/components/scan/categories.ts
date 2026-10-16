import type { WasteCategory } from "@/lib/scan-types";
import { BINS } from "@/lib/sorting-config";

export interface CategoryStyle {
  label: string;
  emoji: string;
  /** Pill classes (bg + text + ring). */
  pill: string;
  /** Solid accent used for bars/buttons. */
  accent: string;
  /** Bin from the sorting config; null when there is no curbside bin. */
  genericBin: string | null;
}

export const CATEGORY_STYLES: Record<WasteCategory, CategoryStyle> = {
  recycling: {
    label: "Recycling",
    emoji: "♻️",
    pill: "bg-blue-100 text-blue-800 ring-blue-300",
    accent: "bg-blue-600",
    genericBin: BINS.recycling,
  },
  compost: {
    label: "Compost",
    emoji: "🌱",
    pill: "bg-green-100 text-green-800 ring-green-300",
    accent: "bg-green-600",
    genericBin: BINS.compost,
  },
  trash: {
    label: "Trash",
    emoji: "🗑️",
    pill: "bg-gray-200 text-gray-800 ring-gray-300",
    accent: "bg-gray-600",
    genericBin: BINS.trash,
  },
  special: {
    label: "Special",
    emoji: "⚠️",
    pill: "bg-orange-100 text-orange-800 ring-orange-300",
    accent: "bg-orange-500",
    genericBin: BINS.special,
  },
  uncertain: {
    label: "Not sure",
    emoji: "❓",
    pill: "bg-amber-100 text-amber-900 ring-amber-300",
    accent: "bg-amber-500",
    genericBin: BINS.uncertain,
  },
};
