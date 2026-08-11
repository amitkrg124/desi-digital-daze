import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import bg from "@/assets/kirana-street.jpeg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "अमित जनरल स्टोर — 2000s किराना यादें" },
      {
        name: "description",
        content:
          "चवन्नी की टॉफ़ी, उधार की कॉपी और रेडियो पर बजते 90s-2000s के गाने — मोहल्ले की किराना दुकान की एक सिनेमैटिक याद।",
      },
      { property: "og:title", content: "अमित जनरल स्टोर — 2000s किराना यादें" },
      {
        property: "og:description",
        content: "उधार आज नहीं, कल मिलेगा। एक किराना दुकान, चार आने की यादें और पूरा प्लेलिस्ट।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KiranaPage,
});

const PLAYLIST_ID = "PLrc1-2uc6G7j--pBF0vbBxHvfI0gJhzdQ";

const QUOTES = [
  { hi: "उधार आज नहीं, कल मिलेगा।", en: "the eternal sign behind every counter" },
  { hi: "भैया, एक रुपये की पारले-जी और चवन्नी की टॉफ़ी।", en: "the exact-change order" },
  { hi: "शैम्पू का पाउच, तेल की पुड़िया — सब मिलता है यहाँ।", en: "sachet economy, 2003" },
  { hi: "छुट्टे नहीं हैं… टॉफ़ी ले लो।", en: "toffee as legal tender" },
  { hi: "मम्मी ने भेजा है, कॉपी में लिख लीजिए।", en: "the udhaar khata, page 47" },
  { hi: "रेडियो पर विविध भारती और दुकान के बाहर की बेंच।", en: "evening soundtrack" },
  { hi: "बर्फ़ वाली गोली, चूरन और पाँच का चिप्स।", en: "school ke baad ka budget" },
];

const SHELF = [
  { hi: "पारले-जी", note: "₹2 का पैकेट" },
  { hi: "चूरन", note: "काली मिर्च वाला" },
  { hi: "फ़ोन-पे नहीं", note: "सिर्फ़ नगद / उधार" },
  { hi: "STD / PCO", note: "रात 11 बजे आधा रेट" },
];

const POPULAR = [
  { hi: "90's हिट्स", note: "102 गाने" },
  { hi: "यादें", note: "78 गाने" },
  { hi: "रेडियो स्पेशल", note: "56 गाने" },
  { hi: "कुमार सानू", note: "62 गाने" },
];

const NAV = ["होम", "दुकान", "यादें", "प्लेलिस्ट", "उधार खाता"];

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  setShuffle: (on: boolean) => void;
  setLoop: (on: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVideoData: () => { title: string; author: string };
  seekTo: (s: number, allow: boolean) => void;
};

function fmt(s: number) {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function KiranaPage() {
  const [quote, setQuote] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState(false);
  const [track, setTrack] = useState({ title: "प्लेलिस्ट लोड हो रही है…", artist: "विविध भारती" });
  const [time, setTime] = useState({ cur: 0, dur: 0 });
  const [rings, setRings] = useState<{ id: number; x: number; y: number }[]>([]);
  const playerRef = useRef<YTPlayer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const t = setInterval(() => setQuote((q) => (q + 1) % QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // YouTube IFrame API
  useEffect(() => {
    let raf: number;
    const init = () => {
      const YT = (window as unknown as { YT?: any }).YT;
      if (!YT?.Player) return;
      playerRef.current = new YT.Player("yt-host", {
        height: "1",
        width: "1",
        playerVars: {
          listType: "playlist",
          list: PLAYLIST_ID,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            setReady(true);
            const d = playerRef.current?.getVideoData();
            if (d?.title) setTrack({ title: d.title, artist: d.author || "बॉलीवुड सदाबहार" });
          },

          onStateChange: (e: { data: number }) => {
            setPlaying(e.data === 1);
            const d = playerRef.current?.getVideoData();
            if (d?.title)
              setTrack({ title: d.title, artist: d.author || "बॉलीवुड सदाबहार" });
          },
        },
      });
    };

    if ((window as unknown as { YT?: any }).YT?.Player) {
      init();
    } else {
      (window as unknown as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady =
        init;
      if (!document.getElementById("yt-api")) {
        const s = document.createElement("script");
        s.id = "yt-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(s);
      }
    }

    const tick = () => {
      const p = playerRef.current;
      if (p?.getDuration) setTime({ cur: p.getCurrentTime() || 0, dur: p.getDuration() || 0 });
      raf = window.setTimeout(tick, 500) as unknown as number;
    };
    tick();
    return () => clearTimeout(raf);
  }, []);

  const bell = useCallback((x: number, y: number) => {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      const ctx = audioCtxRef.current ?? new Ctx();
      audioCtxRef.current = ctx;
      const now = ctx.currentTime;
      [880, 1320, 1760].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.16 / (i + 1), now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.7);
      });
    }
    const id = Date.now() + Math.random();
    setRings((r) => [...r, { id, x, y }]);
    setTimeout(() => setRings((r) => r.filter((it) => it.id !== id)), 900);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "g") bell(window.innerWidth / 2, window.innerHeight / 2);
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bell, playing]);

  const toggle = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  };

  const progress = time.dur ? (time.cur / time.dur) * 100 : 0;

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      onClick={(e) => bell(e.clientX, e.clientY)}
    >
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg.url})`, animation: "flicker 7s ease-in-out infinite" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, oklch(0.14 0.04 28 / 0.96) 0%, oklch(0.16 0.05 25 / 0.82) 38%, oklch(0.18 0.05 30 / 0.28) 70%, oklch(0.15 0.04 25 / 0.55) 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -inset-10 opacity-[0.16] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.6'/></svg>\")",
          animation: "grain-shift 6s steps(3) infinite",
        }}
        aria-hidden
      />

      <img
        src={bg.url}
        alt="साँझ के वक़्त मोहल्ले की गली में अमित जनरल स्टोर, वीडियो सीडी का बोर्ड और लाल PCO फ़ोन"
        className="sr-only"
      />

      {/* Bell ripples */}
      {rings.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none fixed z-50 h-16 w-16 rounded-full border border-primary/70"
          style={{
            left: r.x - 32,
            top: r.y - 32,
            animation: "ring-pop 0.9s ease-out forwards",
          }}
          aria-hidden
        />
      ))}

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Nav */}
        <header className="flex flex-wrap items-center gap-x-8 gap-y-4 px-6 py-6 md:px-12">
          <div className="leading-none">
            <h2 className="font-display text-2xl tracking-wide text-glow">अमित जनरल स्टोर</h2>
            <p className="mt-1 text-[11px] tracking-[0.25em] text-muted-foreground">
              किराना • 2003
            </p>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
            {NAV.map((n, i) => (
              <a
                key={n}
                href="#"
                onClick={(e) => e.preventDefault()}
                className={`relative pb-1 transition-colors hover:text-foreground ${
                  i === 0 ? "text-foreground" : ""
                }`}
              >
                {n}
                <span
                  className={`absolute -bottom-0.5 left-0 h-[2px] bg-primary transition-all duration-300 ${
                    i === 0 ? "w-6" : "w-0"
                  }`}
                />
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <label className="hidden items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-2 text-sm backdrop-blur sm:flex">
              <Search className="size-4 text-muted-foreground" />
              <input
                placeholder="सामान, यादें खोजें"
                className="w-40 bg-transparent outline-none placeholder:text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              />
            </label>
            <button
              className="rounded-full border border-border bg-card/40 p-2 backdrop-blur transition-transform hover:scale-110"
              aria-label="दुकान की घंटी बजाएँ"
            >
              <Bell className="size-4" />
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="flex flex-1 flex-col justify-center px-6 pb-44 pt-6 md:px-12">
          <div className="max-w-2xl">
            <h1 className="font-display text-5xl leading-[1.15] text-glow sm:text-6xl md:text-7xl">
              चवन्नी की टॉफ़ी,
              <br />
              पूरे मोहल्ले की याद
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              2000 के दशक की किराना दुकान — उधार की कॉपी, शैम्पू के पाउच और रेडियो पर बजते सदाबहार
              गाने।
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggle();
                }}
                className="group inline-flex items-center gap-3 rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground shadow-[0_14px_40px_-12px_oklch(0.58_0.19_25/0.9)] transition-all hover:-translate-y-0.5 hover:brightness-110"
              >
                <span className="grid size-6 place-items-center rounded-full bg-primary-foreground/20">
                  {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                </span>
                {playing ? "रेडियो बंद करें" : "रेडियो चालू करें"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  bell(e.clientX, e.clientY);
                }}
                className="inline-flex items-center gap-3 rounded-full border border-border bg-card/30 px-7 py-3.5 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-card/60"
              >
                <Bell className="size-4" />
                घंटी बजाएँ <span className="text-xs text-muted-foreground">(G)</span>
              </button>
            </div>

            {/* Rotating quote */}
            <div
              key={quote}
              className="mt-10 border-l-2 border-primary/70 pl-4"
              style={{ animation: "quote-in 0.6s ease-out" }}
            >
              <p className="font-display text-xl italic">“{QUOTES[quote]?.hi}”</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {QUOTES[quote]?.en}
              </p>

            </div>

            {/* Shelf labels */}
            <div className="mt-10">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                आज की दुकान
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {SHELF.map((s) => (
                  <div
                    key={s.hi}
                    className="rounded-lg border border-border bg-card/40 px-4 py-2 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/60"
                  >
                    <p className="font-display text-base">{s.hi}</p>
                    <p className="text-[11px] text-muted-foreground">{s.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular circles */}
            <div className="mt-10">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                अभी लोकप्रिय
              </p>
              <div className="mt-4 flex flex-wrap gap-7">
                {POPULAR.map((p, i) => (
                  <button
                    key={p.hi}
                    onClick={(e) => {
                      e.stopPropagation();
                      playerRef.current?.playVideo();
                    }}
                    className="group w-24 text-center"
                  >
                    <span
                      className="mx-auto grid size-20 place-items-center rounded-full border border-border transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary group-hover:shadow-[0_12px_30px_-10px_oklch(0.58_0.19_25/0.8)]"
                      style={{
                        background: `radial-gradient(circle at 30% 25%, oklch(${0.42 + i * 0.05} 0.11 ${20 + i * 22}), oklch(0.2 0.05 30))`,
                      }}
                    >
                      <ListMusic className="size-6 opacity-80" />
                    </span>
                    <span className="mt-3 block font-display text-sm">{p.hi}</span>
                    <span className="block text-[11px] text-muted-foreground">{p.note}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Hidden YouTube host */}
      <div className="pointer-events-none fixed -left-[9999px] top-0 size-px opacity-0">
        <div id="yt-host" />
      </div>

      {/* Player */}
      <div
        className="fixed inset-x-3 bottom-3 z-40 md:inset-x-6 md:bottom-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass rounded-2xl px-4 py-3 shadow-[0_20px_60px_-20px_oklch(0_0_0/0.8)] md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/25 font-display text-lg">
                ♪
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{track.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ready ? track.artist : "प्लेयर तैयार हो रहा है…"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                aria-label="शफ़ल"
                onClick={() => {
                  const n = !shuffle;
                  setShuffle(n);
                  playerRef.current?.setShuffle(n);
                }}
                className={`transition-colors hover:text-foreground ${shuffle ? "text-primary" : "text-muted-foreground"}`}
              >
                <Shuffle className="size-4" />
              </button>
              <button
                aria-label="पिछला गाना"
                onClick={() => playerRef.current?.previousVideo()}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <SkipBack className="size-5" />
              </button>
              <button
                aria-label={playing ? "रोकें" : "चलाएँ"}
                onClick={toggle}
                className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_oklch(0.58_0.19_25/0.9)] transition-transform hover:scale-105"
              >
                {playing ? (
                  <Pause className="size-5" />
                ) : (
                  <Play className="size-5 translate-x-[1px]" />
                )}
              </button>
              <button
                aria-label="अगला गाना"
                onClick={() => playerRef.current?.nextVideo()}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <SkipForward className="size-5" />
              </button>
              <button
                aria-label="दोहराएँ"
                onClick={() => {
                  const n = !loop;
                  setLoop(n);
                  playerRef.current?.setLoop(n);
                }}
                className={`transition-colors hover:text-foreground ${loop ? "text-primary" : "text-muted-foreground"}`}
              >
                <Repeat className="size-4" />
              </button>
            </div>

            <div className="flex flex-1 items-center gap-3">
              <span className="w-10 text-right text-[11px] text-muted-foreground">
                {fmt(time.cur)}
              </span>
              <div
                className="group h-1.5 flex-1 cursor-pointer rounded-full bg-foreground/15"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - r.left) / r.width;
                  if (time.dur) playerRef.current?.seekTo(pct * time.dur, true);
                }}
              >
                <div
                  className="relative h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                >
                  <span className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
              <span className="w-10 text-[11px] text-muted-foreground">{fmt(time.dur)}</span>
              <Volume2 className="hidden size-4 text-muted-foreground md:block" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
