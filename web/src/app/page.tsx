import { WASTE_CATEGORIES } from "@/lib/scan-types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CATEGORY_STYLES, CategoryBadge } from "@/components/ui/CategoryBadge";

const STEPS = [
  {
    emoji: "📸",
    title: "Snap",
    body: "Take a photo of the item you're about to throw away.",
  },
  {
    emoji: "🤖",
    title: "Identify",
    body: "Our AI recognizes the item and its material in seconds.",
  },
  {
    emoji: "✅",
    title: "Dispose right",
    body: "Get the right bin plus quick prep tips, like rinse or remove the cap.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-teal-50 px-6 py-12 text-center shadow-sm sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-teal-200/40"
        />
        <p className="relative mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
          <span aria-hidden="true">🌿</span> AI recycling helper
        </p>
        <h1 className="relative text-4xl font-extrabold leading-tight tracking-tight text-balance text-emerald-950 sm:text-5xl">
          Snap your trash. Know the bin.
        </h1>
        <p className="relative mx-auto mt-4 max-w-xl text-base text-gray-600 text-pretty sm:text-lg">
          Not sure if it&apos;s recycling, compost or landfill? Take a photo and SortSnap tells you
          exactly where it goes — and how to prep it.
        </p>
        <div className="relative mt-8 flex justify-center">
          <Button
            href="/scan"
            size="lg"
            className="w-full max-w-xs shadow-md sm:w-auto"
          >
            <span aria-hidden="true">📸</span> Scan an item
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-2xl font-bold tracking-tight text-emerald-950">
          How it works
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Card className="h-full">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl"
                  >
                    {step.emoji}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Step {i + 1}
                    </p>
                    <h3 className="text-lg font-bold text-emerald-950">{step.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">{step.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Category legend */}
      <section aria-labelledby="bin-guide">
        <h2 id="bin-guide" className="text-2xl font-bold tracking-tight text-emerald-950">
          The five bins
        </h2>
        <p className="mt-1 text-sm text-gray-600">Every scan lands in one of these categories.</p>
        <Card className="mt-5 p-0 sm:p-0">
          <ul className="divide-y divide-emerald-50">
            {WASTE_CATEGORIES.map((category) => (
              <li
                key={category}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="sm:w-36 sm:shrink-0">
                  <CategoryBadge category={category} />
                </div>
                <p className="text-sm leading-6 text-gray-700">{CATEGORY_STYLES[category].description}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Closing CTA */}
      <section className="flex flex-col items-center gap-4 text-center">
        <p className="text-lg font-semibold text-emerald-950">Got something in your hand right now?</p>
        <Button href="/scan" size="lg" className="w-full max-w-xs sm:w-auto">
          Start scanning
        </Button>
      </section>
    </div>
  );
}
