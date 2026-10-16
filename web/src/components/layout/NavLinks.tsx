"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/scan", label: "Scan", emoji: "📸" },
  { href: "/history", label: "History", emoji: "🕘" },
  { href: "/rewards", label: "Rewards", emoji: "🏆" },
] as const;

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop / tablet inline nav (in the header). */
export function DesktopNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-100 text-emerald-900"
                  : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-900"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Mobile bottom tab bar items. */
export function MobileNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="grid grid-cols-4">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                active ? "text-emerald-700" : "text-gray-500 hover:text-emerald-700"
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-8 w-12 items-center justify-center rounded-full text-lg ${
                  active ? "bg-emerald-100" : ""
                }`}
              >
                {item.emoji}
              </span>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Active-aware wrappers (read the pathname on the client). */
export function ActiveDesktopNavLinks() {
  return <DesktopNavLinks pathname={usePathname()} />;
}

export function ActiveMobileNavLinks() {
  return <MobileNavLinks pathname={usePathname()} />;
}
