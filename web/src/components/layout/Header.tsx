import Link from "next/link";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { Suspense } from "react";
import {
  ActiveDesktopNavLinks,
  ActiveMobileNavLinks,
  DesktopNavLinks,
  MobileNavLinks,
} from "./NavLinks";

/**
 * Top header (brand + inline nav on >= sm) plus a fixed bottom tab bar on mobile.
 * Nav links read the pathname on the client; Suspense keeps the layout prerenderable
 * under cacheComponents (fallback = same links without the active state).
 */
export function Header() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-emerald-900">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center border-2 border-emerald-900 bg-emerald-200 text-emerald-900"
            >
              <PixelIcon name="sprout" size={22} />
            </span>
            SortSnap
          </Link>
          <nav aria-label="Main" className="hidden sm:block">
            <Suspense fallback={<DesktopNavLinks pathname={null} />}>
              <ActiveDesktopNavLinks />
            </Suspense>
          </nav>
        </div>
      </header>

      <nav
        aria-label="Main mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <Suspense fallback={<MobileNavLinks pathname={null} />}>
          <ActiveMobileNavLinks />
        </Suspense>
      </nav>
    </>
  );
}

export default Header;
