import type { WasteCategory } from "@/lib/scan-types";

export interface CategoryStyle {
  /** Human-readable name, e.g. "Recycling" */
  label: string;
  /** Emoji icon for the category */
  emoji: string;
  /** One-line description of what belongs in this bin */
  description: string;
  /** Typical bin name */
  bin: string;
  /** Tailwind classes for the pill badge (bg + text + ring) */
  badge: string;
  /** Tailwind classes for a soft tinted surface (e.g. result card background) */
  surface: string;
  /** Tailwind text color class for accents */
  text: string;
  /** Tailwind background class for a solid accent (dot, bar) */
  solid: string;
  /** Raw hex color, for inline styles / charts */
  hex: string;
}

export const CATEGORY_STYLES: Record<WasteCategory, CategoryStyle> = {
  recycling: {
    label: "Recycling",
    emoji: "♻️",
    description: "Clean paper, cardboard, metal cans, glass and rigid plastics.",
    bin: "Recycling bin",
    badge: "bg-blue-100 text-blue-800 ring-blue-200",
    surface: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    solid: "bg-blue-600",
    hex: "#2563eb",
  },
  compost: {
    label: "Compost",
    emoji: "🌱",
    description: "Food scraps, yard waste and certified compostable items.",
    bin: "Compost bin",
    badge: "bg-green-100 text-green-800 ring-green-200",
    surface: "bg-green-50 border-green-200",
    text: "text-green-700",
    solid: "bg-green-600",
    hex: "#16a34a",
  },
  trash: {
    label: "Trash",
    emoji: "🗑️",
    description: "Chip bags, plastic film, diapers and \"compostable\" plastics.",
    bin: "Trash (landfill) bin",
    badge: "bg-gray-200 text-gray-800 ring-gray-300",
    surface: "bg-gray-50 border-gray-200",
    text: "text-gray-700",
    solid: "bg-gray-600",
    hex: "#4b5563",
  },
  special: {
    label: "Special",
    emoji: "⚠️",
    description: "Batteries, electronics, paint, chemicals and medicine — never a regular bin.",
    bin: "No bin (special handling)",
    badge: "bg-orange-100 text-orange-900 ring-orange-200",
    surface: "bg-orange-50 border-orange-200",
    text: "text-orange-700",
    solid: "bg-orange-600",
    hex: "#ea580c",
  },
  uncertain: {
    label: "Not sure",
    emoji: "❓",
    description: "The AI couldn't decide confidently — check the city guide.",
    bin: "No bin (check the guide)",
    badge: "bg-amber-100 text-amber-900 ring-amber-200",
    surface: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    solid: "bg-amber-500",
    hex: "#f59e0b",
  },
};

export interface CategoryBadgeProps {
  category: WasteCategory;
  /** "md" (default) or "lg" for result screens */
  size?: "md" | "lg";
  className?: string;
}

export function CategoryBadge({ category, size = "md", className = "" }: CategoryBadgeProps) {
  const style = CATEGORY_STYLES[category];
  const sizeClass = size === "lg" ? "px-4 py-1.5 text-base" : "px-3 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${style.badge} ${sizeClass} ${className}`}
    >
      <span aria-hidden="true">{style.emoji}</span>
      {style.label}
    </span>
  );
}

export default CategoryBadge;
