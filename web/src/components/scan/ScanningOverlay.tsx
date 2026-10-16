// Overlay shown on top of a photo while the AI checks it: a glowing bar sweeping up and down.
export function ScanningOverlay({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] bg-emerald-950/15">
      <div
        className="absolute inset-x-0 top-0 h-1 animate-scan-bar bg-emerald-400 shadow-[0_0_16px_4px_rgba(52,211,153,0.8)] motion-reduce:animate-none"
        aria-hidden
      />
      <span
        role="status"
        className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-gray-800"
      >
        {label}
      </span>
    </div>
  );
}
