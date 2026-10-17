## Why we built this

Every one of us has stood in front of three bins holding a greasy pizza box, completely unsure. Then we looked up Cupertino's rules and found out the pizza box goes in compost, but those "compostable" plastic forks? Trash. We had been doing it wrong the whole time.

Rules are different in every city, and nobody reads the PDF at the trash can. So we made Binit: point your camera at something, and it tells you which Cupertino bin it goes in and why. And to make people actually keep doing it, your points grow a little pixel plant.

## How it works

Take a photo of the item and Binit tells you the bin (blue recycling, green compost or gray trash), the reason, and how to prep it, like "rinse it first" or "take the lid off." Batteries and electronics get flagged as special, with a link to the city's hazardous waste page.

To earn points you have to prove it. You snap the bin, then your item inside the bin, and the AI checks both. Get it right and you earn points (+5 for recycling, +2 for compost or trash). Put it in the wrong bin and you lose one.

If the AI isn't sure, it says so and sends you to the city guide instead of guessing. We cared about that a lot. A confident wrong answer is worse than no answer when it ruins a whole recycling load.

## The plant

This is the part we had the most fun with. Your plant levels up at 10 and 20 points (there's confetti), and you can spend points on accessories: three watering cans, three pots, and three hats. Stop sorting for a few days or keep using the wrong bin, and if your points drop below zero a rain cloud shows up over it until you earn your way back.

## Keeping it fair

Since points are involved, people will try to cheat. You only earn points after proving it: you snap the bin and then your item inside it, and the AI checks both. Each scan gets a signed ticket from our server, so nobody can fake a scan or change its result. A 7-day streak gets you a +2 bonus, and every 3 days of doing nothing costs you 2.


## Built with

Next.js 16, React 19, TypeScript and Tailwind CSS v4, hosted on Vercel. Scans use OpenAI, with Google Gemini as a backup if OpenAI fails. The camera runs in the browser, and photos are processed in memory and never stored. Points and your plant are saved in your browser.

## Running it locally

You'll need Node.js 20.9+ and an OpenAI or Gemini API key.

```bash
git clone https://github.com/jinhocody/DAHACKS_recyclescanner_public.git
cd DAHACKS_recyclescanner_public/web
npm ci
```

Make a file called `web/.env.local`:

```bash
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key   # backup, or use it on its own
```

Then:

```bash
npm run dev
```

and open http://localhost:3000. With no key, you'll get labeled "simulated" results so you can still click around (they don't earn points).

Optional settings: `OPENAI_MODEL` and `GEMINI_MODEL` change the models, `AI_PROVIDER=gemini` uses Gemini only, and `SCAN_TICKET_SECRET` sets the key used to sign scan tickets.

## Where things are

- `web/src/lib/sorting-config.ts`: bins, points, penalties and levels, all in one place
- `web/src/lib/gemini.ts`: the AI prompt with Cupertino's rules
- `web/src/app/api/scan` and `api/verify`: the two server routes
- `web/src/components/mascot`: the plant, shop and animations

Want it for a different city? Change the rules in those first two files. Nothing else needs to change.

## What's not done yet

Points live in your browser, so they don't follow you to another device. We'd like to add accounts next, then more cities, and maybe work with Recology on real rewards. Also, juice and soy milk boxes aren't clearly covered by the city's guide, so for now Binit just says "not sure." We also want to stop the same photo from being reused, add a time limit for verifying, and cap points per day.

## Team

- **A Zin Kyaw**
- **Cody Hong**
- **Ella Hong**
