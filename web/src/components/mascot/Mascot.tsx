"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPointsTotal } from "@/components/scan/points-store";
import { BASE_PIVOT, origin, spoutPosition, type Outfit } from "./looks";
import { useShop } from "./outfit-store";
import { SpriteLayers } from "./SpriteLayers";
import "./mascot.css";

type Action = "idle" | "hop" | "jump" | "spin" | "wiggle" | "walk" | "wave" | "water" | "dance" | "look";

const ACTION_MS: Record<Exclude<Action, "idle" | "walk" | "look">, number> = {
  hop: 900,
  jump: 1000,
  spin: 1000,
  wiggle: 800,
  wave: 1400,
  water: 2200,
  dance: 2600,
};

// Weighted so walking happens often and watering is a treat.
const RANDOM_ACTIONS: Action[] = ["walk", "walk", "walk", "hop", "hop", "wiggle", "wave", "wave", "look", "water"];

const LAST_SEEN_KEY = "sortsnap:mascot:lastSeenPoints";
const WALK_PX_PER_SECOND = 70;

interface Heart {
  id: number;
  dx: string;
  delay: string;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The animated pet plant. Wears the outfit equipped in the shop unless one is passed in. */
export function Mascot({ outfit: outfitProp }: { outfit?: Outfit }) {
  const { equipped } = useShop();
  const outfit = outfitProp ?? equipped;
  const outfitKey = `${outfit.can}/${outfit.pot}/${outfit.head}`;

  const [action, setAction] = useState<Action>("idle");
  const [facing, setFacing] = useState<"right" | "left">("right");
  const [x, setX] = useState(0);
  const [walkMs, setWalkMs] = useState(0);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [bubble, setBubble] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const walkerRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const busyRef = useRef(false);
  const tokenRef = useRef(0);
  const heartIdRef = useRef(0);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timersRef.current.delete(t);
      fn();
    }, ms);
    timersRef.current.add(t);
  }, []);

  /** Starts an action; a newer action (e.g. a tap) cancels the end of an older one. */
  const play = useCallback(
    (next: Action, ms: number) => {
      const token = ++tokenRef.current;
      busyRef.current = true;
      setAction(next);
      later(() => {
        if (tokenRef.current !== token) return;
        busyRef.current = false;
        setAction("idle");
      }, ms);
    },
    [later],
  );

  const burstHearts = useCallback(
    (count: number) => {
      const fresh = Array.from({ length: count }, (_, i) => ({
        id: ++heartIdRef.current,
        dx: `${Math.round((Math.random() - 0.5) * 220)}%`,
        delay: `${i * 90}ms`,
      }));
      setHearts((h) => [...h, ...fresh]);
      const ids = new Set(fresh.map((h) => h.id));
      later(() => setHearts((h) => h.filter((heart) => !ids.has(heart.id))), 1300 + count * 90);
    },
    [later],
  );

  const walk = useCallback(() => {
    const stage = stageRef.current;
    const walker = walkerRef.current;
    if (!stage || !walker) return;
    // The art fills about 2/3 of the sprite box, so let it get that close to the edges.
    const range = Math.max(0, (stage.clientWidth - walker.offsetWidth * 0.7) / 2);
    if (range < 20) {
      play("hop", ACTION_MS.hop);
      return;
    }
    let target = (Math.random() * 2 - 1) * range;
    if (Math.abs(target - xRef.current) < range * 0.35) target = -Math.sign(xRef.current || 1) * range * 0.7;
    const ms = Math.max(900, (Math.abs(target - xRef.current) / WALK_PX_PER_SECOND) * 1000);
    setFacing(target > xRef.current ? "right" : "left");
    setWalkMs(ms);
    xRef.current = target;
    setX(target);
    play("walk", ms);
  }, [play]);

  const lookAround = useCallback(() => {
    const token = ++tokenRef.current;
    busyRef.current = true;
    setAction("look");
    setFacing((f) => (f === "right" ? "left" : "right"));
    later(() => tokenRef.current === token && setFacing((f) => (f === "right" ? "left" : "right")), 900);
    later(() => {
      if (tokenRef.current !== token) return;
      busyRef.current = false;
      setAction("idle");
    }, 1500);
  }, [later]);

  const runRandom = useCallback(() => {
    const next = RANDOM_ACTIONS[Math.floor(Math.random() * RANDOM_ACTIONS.length)];
    if (next === "walk") walk();
    else if (next === "look") lookAround();
    else if (next !== "idle") play(next, ACTION_MS[next as keyof typeof ACTION_MS]);
  }, [walk, lookAround, play]);

  // Idle brain: every 3–7 s pick something to do, unless busy, hidden or reduced motion.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(
        () => {
          if (!document.hidden && !busyRef.current) runRandom();
          schedule();
        },
        3000 + Math.random() * 4000,
      );
    };
    schedule();
    return () => clearTimeout(t);
  }, [runRandom]);

  // Celebrate points earned since the last visit to the home page.
  useEffect(() => {
    const t = setTimeout(() => {
      const total = getPointsTotal();
      let lastSeen: number | null = null;
      try {
        const raw = localStorage.getItem(LAST_SEEN_KEY);
        lastSeen = raw === null ? null : Number(raw);
        localStorage.setItem(LAST_SEEN_KEY, String(total));
      } catch {
        return;
      }
      if (lastSeen === null || !Number.isFinite(lastSeen) || total <= lastSeen) return;
      setBubble(`+${total - lastSeen} points!`);
      play("dance", ACTION_MS.dance);
      burstHearts(6);
      later(() => setBubble(null), 3200);
    }, 600);
    return () => clearTimeout(t);
  }, [play, burstHearts, later]);

  // A little hop whenever the outfit changes. The saved outfit loads right after hydration,
  // so changes in the first moment after mount are not the user's doing and get no hop.
  const outfitKeyRef = useRef(outfitKey);
  const mountedAtRef = useRef(0);
  useEffect(() => {
    mountedAtRef.current = performance.now();
  }, []);
  useEffect(() => {
    if (outfitKeyRef.current === outfitKey) return;
    outfitKeyRef.current = outfitKey;
    if (performance.now() - mountedAtRef.current < 500) return;
    later(() => play("hop", ACTION_MS.hop), 0);
  }, [outfitKey, later, play]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  function onPet() {
    burstHearts(5);
    play(Math.random() < 0.35 ? "spin" : "jump", ACTION_MS.jump);
  }

  return (
    <div ref={stageRef} className="mascot-stage">
      <div
        ref={walkerRef}
        className="mascot-walker"
        data-action={action}
        style={{ transform: `translateX(${x}px)`, transitionDuration: `${walkMs}ms` }}
      >
        <div className="mascot-shadow" aria-hidden="true" />
        <button
          type="button"
          className="mascot-actor"
          style={{ transformOrigin: origin(BASE_PIVOT) }}
          onClick={onPet}
          aria-label="Pet the plant"
        >
          <div className="mascot-flip" data-facing={facing}>
            <div className="mascot-sprite" style={{ transformOrigin: origin(BASE_PIVOT) }}>
              <SpriteLayers outfit={outfit} />
              {action === "water" &&
                [0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="mascot-drop"
                    style={{
                      ...spoutPosition(),
                      ["--delay" as string]: `${300 + i * 180}ms`,
                      ["--dx" as string]: `${(i % 2) * 1.6 - 0.8}%`,
                    }}
                  />
                ))}
            </div>
          </div>
        </button>

        {hearts.map((h) => (
          <svg
            key={h.id}
            className="mascot-heart"
            style={{ ["--dx" as string]: h.dx, ["--delay" as string]: h.delay }}
            viewBox="0 0 7 6"
            shapeRendering="crispEdges"
            aria-hidden="true"
          >
            <path fill="#f472b6" d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z" />
            <path fill="#fbcfe8" d="M1 1h1v1H1z" />
          </svg>
        ))}

        {bubble && (
          <p className="mascot-bubble" role="status">
            🌱 {bubble}
          </p>
        )}
      </div>
    </div>
  );
}
