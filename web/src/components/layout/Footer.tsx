import { PixelIcon } from "@/components/pixel/PixelIcon";

export function Footer() {
  return (
    <footer className="border-t border-emerald-100 bg-white/60">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-1 px-4 py-6 text-center text-sm text-gray-500 sm:flex-row sm:px-6 sm:text-left">
        <p>
          <span className="font-semibold text-emerald-800">Snap</span> · Built at DA Hacks{" "}
          <PixelIcon name="sprout" size={16} className="-mt-0.5 align-middle text-emerald-800" />
        </p>
        <p>Rules vary by city — always check local guidelines.</p>
      </div>
    </footer>
  );
}

export default Footer;
