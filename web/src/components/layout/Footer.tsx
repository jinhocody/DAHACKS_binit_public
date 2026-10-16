export function Footer() {
  return (
    <footer>
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-1 px-4 py-6 text-center text-sm text-stone-700 sm:flex-row sm:px-6 sm:text-left">
        <p>
          <span className="font-semibold text-emerald-800">SortSnap</span> · Built at DA Hacks 🌍
        </p>
        <p>Rules vary by city — always check local guidelines.</p>
      </div>
    </footer>
  );
}

export default Footer;
