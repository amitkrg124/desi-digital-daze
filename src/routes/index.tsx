import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Pause, Play, SkipBack, SkipForward } from "lucide-react";
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
  "उधार आज नहीं, कल मिलेगा।",
  "छुट्टे नहीं हैं… टॉफ़ी ले लो।",
  "मम्मी ने भेजा है, कॉपी में लिख लीजिए।",
  "एक रुपये की पारले-जी और चवन्नी की टॉफ़ी।",
];

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVideoData: () => { title: string; author: string; video_id: string };
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
  const [clock, setClock] = useState("");
  const [track, setTrack] = useState({
    title: "प्लेलिस्ट लोड हो रही है…",
    artist: "विविध भारती",
    thumb: "",
  });
  const [time, setTime] = useState({ cur: 0, dur: 0 });
  const [rings, setRings] = useState<{ id: number; x: number; y: number }[]>([]);
  const playerRef = useRef<YTPlayer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const t = setInterval(() => setQuote((q) => (q + 1) % QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const tickClock = () =>
      setClock(
        new Date()
          .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
          .toLowerCase(),
      );
    tickClock();
    const t = setInterval(tickClock, 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let raf: number;
    const readTrack = () => {
      const d = playerRef.current?.getVideoData();
      if (d?.title)
        setTrack({
          title: d.title,
          artist: d.author || "बॉलीवुड सदाबहार",
          thumb: d.video_id ? `https://i.ytimg.com/vi/${d.video_id}/mqdefault.jpg` : "",
        });
    };
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
            readTrack();
          },
          onStateChange: (e: { data: number }) => {
            setPlaying(e.data === 1);
            readTrack();
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

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  }, [playing]);

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
  }, [bell, toggle]);

  const progress = time.dur ? (time.cur / time.dur) * 100 : 0;

  return (
    <main
      className="relative h-[100svh] w-full overflow-hidden"
      onClick={(e) => bell(e.clientX, e.clientY)}
    >
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={bg.url}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ animation: "flicker 7s ease-in-out infinite" }}
        aria-hidden
      >
        <source src="/animated-bgv.mp4" type="video/mp4" />
      </video>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.14 0.04 28 / 0.72) 0%, oklch(0.16 0.05 25 / 0.35) 35%, oklch(0.14 0.04 25 / 0.78) 100%)",
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
          style={{ left: r.x - 32, top: r.y - 32, animation: "ring-pop 0.9s ease-out forwards" }}
          aria-hidden
        />
      ))}

      <div className="relative z-10 flex h-full flex-col">
        {/* Top bar */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 text-sm sm:grid-cols-3 sm:px-10 sm:py-6">
          <p className="min-w-0 truncate tracking-[0.18em] text-foreground/80">{clock}</p>
          <p className="hidden items-center justify-center gap-2 text-foreground/70 sm:flex">
            <span className="size-2 shrink-0 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
            किराना • 2003
          </p>
          <a
            href={`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-foreground/80 transition-colors hover:text-foreground"
          >
            YT Music <ArrowUpRight className="size-4" />
          </a>
        </header>

        {/* Center */}
        <section className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <h1 className="font-display text-[15vw] font-extrabold leading-[0.92] text-glow sm:text-[11vw] lg:text-[9vw]">
            अमित जनरल
            <br />
            स्टोर
          </h1>
          <p
            key={quote}
            className="mt-5 max-w-md text-sm text-foreground/70 sm:text-base"
            style={{ animation: "quote-in 0.6s ease-out" }}
          >
            “{QUOTES[quote]}”
          </p>
        </section>

        {/* Player — saloon-style pill */}
        <div
          className="flex justify-center px-4 pb-8 sm:pb-12"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass w-full max-w-2xl rounded-[2rem] px-3 py-3 shadow-[0_24px_70px_-24px_oklch(0_0_0/0.85)] sm:px-4">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:gap-4">
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/25 font-display text-lg sm:size-16">
                {track.thumb ? (
                  <img src={track.thumb} alt="" className="size-full object-cover" />
                ) : (
                  "♪"
                )}
              </span>

              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold sm:text-base">{track.title}</p>
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    {ready ? track.artist : "प्लेयर तैयार हो रहा है…"}
                  </p>
                  <div
                    className="group mt-2.5 h-1 cursor-pointer rounded-full bg-foreground/20"
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      const pct = (e.clientX - r.left) / r.width;
                      if (time.dur) playerRef.current?.seekTo(pct * time.dur, true);
                    }}
                  >
                    <div
                      className="relative h-full rounded-full bg-foreground/80 transition-[width] duration-500"
                      style={{ width: `${progress}%` }}
                    >
                      <span className="absolute -right-1 top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-foreground" />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {fmt(time.cur)} / {fmt(time.dur)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <button
                    aria-label="पिछला गाना"
                    onClick={() => playerRef.current?.previousVideo()}
                    className="text-foreground/70 transition-colors hover:text-foreground"
                  >
                    <SkipBack className="size-4 sm:size-5" />
                  </button>
                  <button
                    aria-label={playing ? "रोकें" : "चलाएँ"}
                    onClick={toggle}
                    className="grid size-11 place-items-center rounded-full bg-foreground text-background transition-transform hover:scale-105 sm:size-14"
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
                    className="text-foreground/70 transition-colors hover:text-foreground"
                  >
                    <SkipForward className="size-4 sm:size-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden YouTube host */}
      <div className="pointer-events-none fixed -left-[9999px] top-0 size-px opacity-0">
        <div id="yt-host" />
      </div>
    </main>
  );
}
