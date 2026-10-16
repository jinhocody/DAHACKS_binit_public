import type { WasteCategory } from "@/lib/scan-types";

export interface CategoryStyle {
  label: string;
  emoji: string;
  /** Pill classes (bg + text + ring). */
  pill: string;
  /** Solid accent used for bars/buttons. */
  accent: string;
  /** Generic bin used when the user overrides the category manually. */
  genericBin: string;
}

export const CATEGORY_STYLES: Record<WasteCategory, CategoryStyle> = {
  recycling: {
    label: "Recycling",
    emoji: "♻️",
    pill: "bg-blue-100 text-blue-800 ring-blue-300",
    accent: "bg-blue-600",
    genericBin: "Blue recycling cart",
  },
  compost: {
    label: "Compost",
    emoji: "🌱",
    pill: "bg-green-100 text-green-800 ring-green-300",
    accent: "bg-green-600",
    genericBin: "Green organics cart",
  },
  landfill: {
    label: "Landfill",
    emoji: "🗑️",
    pill: "bg-gray-200 text-gray-800 ring-gray-300",
    accent: "bg-gray-600",
    genericBin: "Black/gray garbage cart",
  },
  hazardous: {
    label: "Hazardous",
    emoji: "⚠️",
    pill: "bg-orange-100 text-orange-800 ring-orange-300",
    accent: "bg-orange-500",
    genericBin: "Household hazardous waste drop-off",
  },
  "e-waste": {
    label: "E-waste",
    emoji: "🔌",
    pill: "bg-purple-100 text-purple-800 ring-purple-300",
    accent: "bg-purple-600",
    genericBin: "E-waste drop-off / collection event",
  },
};
