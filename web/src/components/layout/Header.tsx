import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { HeaderClouds } from "./HeaderClouds";
import {
  ActiveDesktopNavLinks,
  ActiveMobileNavLinks,
  DesktopNavLinks,
  MobileNavLinks,
} from "./NavLinks";

/**
 * Top header: pixel sky with a cloud bank, brand centered on mobile, brand + inline nav on >= sm, plus a fixed bottom tab bar on mobile.
 * Nav links read the pathname on the client; Suspense keeps the layout prerenderable
 * under cacheComponents (fallback = same links without the active state).
 */
export function Header() {
  return (
    <>
      <header className="header-sky sticky top-0 z-40 isolate">
        <HeaderClouds />
        <div className="mx-auto flex h-20 w-full max-w-4xl items-center justify-center px-4 pb-5 sm:h-24 sm:justify-between sm:px-6">
          <Link href="/" aria-label="Binit home" className="flex items-center">
            {/* Pixel art: served as-is (no re-encoding) so the edges stay crisp. */}
            <Image
              src="/brand/binit-logo.png"
              alt="Binit"
              width={469}
              height={168}
              preload
              unoptimized
              className="h-12 w-auto sm:h-14"
            />
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
