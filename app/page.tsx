"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

type Step = "ask" | "planning" | "submitted";

const NO_MESSAGES = [
  "Are you sure? 🥺",
  "That doesn't seem right, try again.",
  "My lawyer advised me to ask one more time.",
  "Plot twist: there is no No.",
  "Your finger slipped. Try again. 💕",
  "Error 404: No not found.",
];

const DATE_IDEAS = [
  { emoji: "🍝", label: "Dinner Date" },
  { emoji: "☕", label: "Coffee Date" },
  { emoji: "🍨", label: "Ice Cream Mission" },
  { emoji: "🎳", label: "Bowling Night" },
  { emoji: "🎨", label: "Something Creative" },
  { emoji: "🌅", label: "Sunset Walk" },
  { emoji: "🎬", label: "Movie Night" },
  { emoji: "🍲", label: "Meen sapda polama" },
  { emoji: "✨", label: "Surprise Me" },
  { emoji: "📝", label: "I Have My Own Idea" },
];


// ── Custom Pickers ──────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEK_DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function DatePicker({ value, onChange, min }: { value: string; onChange: (v: string) => void; min?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array.from({ length: firstDow + daysInMonth }, (_, i) =>
    i < firstDow ? null : i - firstDow + 1
  );

  function toStr(d: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl border-2 border-purple-200 bg-white/80 px-4 py-3 text-sm text-left flex items-center gap-2 hover:border-purple-300 focus:outline-none focus:border-purple-400 transition-colors">
        <span>📅</span>
        <span className={value ? "text-gray-700 font-medium" : "text-gray-400"}>
          {displayValue || "Pick a date"}
        </span>
      </button>
      {open && (
        <div className="absolute z-[60] mt-2 rounded-2xl bg-white shadow-2xl border border-purple-100 p-4 w-72 left-0">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth}
              className="w-8 h-8 rounded-full hover:bg-purple-50 text-purple-500 flex items-center justify-center text-xl font-bold transition-colors">‹</button>
            <span className="font-semibold text-purple-700 text-sm">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth}
              className="w-8 h-8 rounded-full hover:bg-purple-50 text-purple-500 flex items-center justify-center text-xl font-bold transition-colors">›</button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {WEEK_DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-purple-300 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((d, i) => d === null ? <div key={i} /> : (
              <button key={i} type="button"
                disabled={![13, 14, 20, 21].includes(d)}
                onClick={() => { onChange(toStr(d)); setOpen(false); }}
                className={`w-8 h-8 mx-auto rounded-full text-xs font-medium transition-all flex items-center justify-center
                  ${value === toStr(d)
                    ? "bg-gradient-to-br from-rose-400 to-purple-500 text-white shadow-md"
                    : !([13, 14, 20, 21].includes(d))
                      ? "text-gray-300 cursor-not-allowed"
                      : "hover:bg-purple-50 text-gray-700 hover:text-purple-700 cursor-pointer"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hour, setHour] = useState("7");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState<"AM"|"PM">("PM");

  function emit(h: string, m: string, ap: "AM"|"PM") {
    let h24 = parseInt(h);
    if (ap === "PM" && h24 !== 12) h24 += 12;
    if (ap === "AM" && h24 === 12) h24 = 0;
    onChange(`${String(h24).padStart(2,"0")}:${m}`);
  }

  useEffect(() => { emit(hour, minute, ampm); }, []); // eslint-disable-line

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = ["00","05","10","15","20","25","30","35","40","45","50","55"];

  return (
    <div className="flex gap-2 items-center">
      <select value={hour}
        onChange={e => { setHour(e.target.value); emit(e.target.value, minute, ampm); }}
        className="flex-1 rounded-xl border-2 border-purple-200 bg-white/80 px-2 py-3 text-sm text-gray-700 focus:outline-none focus:border-purple-400 text-center font-semibold cursor-pointer appearance-none">
        {hours.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="text-purple-400 font-bold text-lg select-none">:</span>
      <select value={minute}
        onChange={e => { setMinute(e.target.value); emit(hour, e.target.value, ampm); }}
        className="flex-1 rounded-xl border-2 border-purple-200 bg-white/80 px-2 py-3 text-sm text-gray-700 focus:outline-none focus:border-purple-400 text-center font-semibold cursor-pointer appearance-none">
        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <div className="flex rounded-xl border-2 border-purple-200 overflow-hidden shrink-0">
        {(["AM","PM"] as const).map(ap => (
          <button key={ap} type="button"
            onClick={() => { setAmpm(ap); emit(hour, minute, ap); }}
            className={`px-3 py-3 text-xs font-bold transition-colors
              ${ampm === ap ? "bg-gradient-to-br from-rose-400 to-purple-500 text-white" : "bg-white/80 text-gray-400 hover:bg-purple-50"}`}>
            {ap}
          </button>
        ))}
      </div>
    </div>
  );
}

function IdeaPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {DATE_IDEAS.map(d => (
        <button key={d.label} type="button" onClick={() => onChange(d.label)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all
            ${value === d.label
              ? "border-purple-400 bg-purple-50 text-purple-700 shadow scale-[1.02]"
              : "border-purple-100 bg-white/60 text-gray-600 hover:border-purple-200 hover:bg-white/80"}`}>
          <span className="text-lg shrink-0">{d.emoji}</span>
          <span className="text-xs font-medium leading-tight">{d.label}</span>
        </button>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────

function fireConfetti() {
  const end = Date.now() + 1800;
  const colors = ["#FF6B9D", "#C44DD8", "#FFD700", "#FF85B3", "#B57BEE"];
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function Mandala({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(150,150)">
        {[135, 115, 95, 75, 55, 35].map((r, i) => (
          <circle key={r} r={r} fill="none"
            stroke={i % 2 === 0 ? "#FF6B9D" : "#D4A017"}
            strokeWidth="0.7"
            strokeDasharray={i % 2 === 0 ? "3 4" : "none"} />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <ellipse key={i} cx="0" cy="-100" rx="5" ry="18" fill="#FF6B9D" opacity="0.65"
            transform={`rotate(${i * 22.5})`} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx="0" cy="-62" rx="6" ry="14" fill="#D4A017" opacity="0.7"
            transform={`rotate(${i * 45})`} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx="0" cy="-38" rx="4" ry="10" fill="#C44DD8" opacity="0.6"
            transform={`rotate(${i * 45 + 22.5})`} />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <circle key={i} cx={0} cy={-76} r="3" fill="#D4A017" opacity="0.8"
            transform={`rotate(${i * 22.5})`} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={i} cx={0} cy={-114} r="2.5" fill="#FF6B9D" opacity="0.7"
            transform={`rotate(${i * 45})`} />
        ))}
        <circle r="14" fill="#FF85B3" opacity="0.5" />
        <circle r="7" fill="#D4A017" opacity="0.7" />
        <circle r="3" fill="#fff" opacity="0.9" />
      </g>
    </svg>
  );
}

function Jhumka({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 95" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="7" r="7" fill="#D4A017" stroke="#FF6B9D" strokeWidth="1.5" />
      <circle cx="30" cy="7" r="3" fill="#FF6B9D" />
      <line x1="30" y1="14" x2="30" y2="22" stroke="#D4A017" strokeWidth="2.5" />
      <path d="M 8 22 C 6 38 8 52 30 60 C 52 52 54 38 52 22 Z" fill="#D4A017" stroke="#FF6B9D" strokeWidth="1.2" />
      <path d="M 10 30 Q 30 34 50 30" fill="none" stroke="#FF6B9D" strokeWidth="1.5" />
      <path d="M 11 38 Q 30 43 49 38" fill="none" stroke="#C44DD8" strokeWidth="1" />
      {[14, 22, 30, 38, 46].map((x, i) => (
        <circle key={i} cx={x} cy="50" r="2.5" fill={i % 2 === 0 ? "#FF6B9D" : "#D4A017"} />
      ))}
      {[14, 22, 30, 38, 46].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="60" x2={x} y2="74" stroke="#D4A017" strokeWidth="1" />
          <circle cx={x} cy="79" r="4.5" fill={i % 2 === 0 ? "#FF6B9D" : "#C44DD8"} />
          <circle cx={x} cy="79" r="2" fill="#fff" opacity="0.5" />
        </g>
      ))}
    </svg>
  );
}

function PalaceArch({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      className="fixed bottom-0 pointer-events-none select-none opacity-[0.09]"
      style={{ [flip ? "right" : "left"]: 0, transform: flip ? "scaleX(-1)" : undefined }}
      width="260" height="400" viewBox="0 0 260 400"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 10 400 L 10 190 Q 10 50 130 30 Q 250 50 250 190 L 250 400 Z"
        fill="#D4A017" stroke="#D4A017" strokeWidth="1" />
      <path d="M 40 400 L 40 200 Q 40 90 130 72 Q 220 90 220 200 L 220 400 Z"
        fill="#FFF9F0" />
      <ellipse cx="130" cy="30" rx="22" ry="30" fill="#D4A017" />
      <ellipse cx="130" cy="30" rx="10" ry="14" fill="#FF6B9D" opacity="0.6" />
      {Array.from({ length: 9 }, (_, i) => {
        const angle = Math.PI + (i / 8) * Math.PI;
        const rx = 100, ry = 125;
        const cx = 130 + rx * Math.cos(angle);
        const cy = 190 + ry * Math.sin(angle) * 0.65;
        return <circle key={i} cx={cx} cy={cy} r="4" fill="#FF6B9D" />;
      })}
      {[55, 130, 205].map((x, i) => (
        <g key={i}>
          <rect x={x - 20} y={310} width={40} height={55} rx="4" fill="#D4A017" opacity="0.5" />
          <ellipse cx={x} cy={310} rx={20} ry={8} fill="#D4A017" opacity="0.5" />
        </g>
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i} transform={`translate(${25 + i * 55}, 280)`}>
          <path d="M 0 0 Q 5 -15 10 0" fill="none" stroke="#FF6B9D" strokeWidth="1.5" />
          <circle cx="5" cy="-15" r="3" fill="#D4A017" />
        </g>
      ))}
    </svg>
  );
}

function BackgroundDecor() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0">
      <Mandala className="absolute -top-24 -left-24 w-[380px] h-[380px] opacity-[0.13]" />
      <Mandala className="absolute -bottom-24 -right-24 w-[380px] h-[380px] opacity-[0.13] rotate-[22deg]" />
      <Mandala className="absolute top-1/2 -right-32 w-[280px] h-[280px] opacity-[0.07] -translate-y-1/2" />
      <Jhumka className="absolute top-6 right-[18%] w-[52px] opacity-[0.2]" />
      <Jhumka className="absolute top-10 left-[14%] w-[40px] opacity-[0.15]" />
      <Jhumka className="absolute bottom-20 right-[8%] w-[44px] opacity-[0.13]" />
      <PalaceArch />
      <PalaceArch flip />
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<Step>("ask");
  const [noCount, setNoCount] = useState(0);
  const [yesScale, setYesScale] = useState(1);
  const [noPos, setNoPos] = useState({ top: "auto", left: "auto", bottom: "2rem", right: "2rem" });

  // Switch to pixel coords on mount so jumps are always on-screen
  useEffect(() => {
    const btnW = 110, btnH = 48;
    setNoPos({ top: `${window.innerHeight - btnH - 32}px`, left: `${window.innerWidth - btnW - 32}px`, bottom: "auto", right: "auto" });
  }, []);
  const [noMsg, setNoMsg] = useState("");
  const [showNoMsg, setShowNoMsg] = useState(false);
  const [dateVal, setDateVal] = useState("");
  const [timeVal, setTimeVal] = useState("");
  const [dateIdea, setDateIdea] = useState("");
  const [customIdea, setCustomIdea] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const noRef = useRef<HTMLButtonElement>(null);

  const randomPos = useCallback(() => {
    const btnW = 110, btnH = 48;
    const x = Math.floor(Math.random() * (window.innerWidth - btnW - 20)) + 10;
    const y = Math.floor(Math.random() * (window.innerHeight - btnH - 20)) + 10;
    setNoPos({ top: `${y}px`, left: `${x}px`, bottom: "auto", right: "auto" });
  }, []);

  const runAway = useCallback((times: number) => {
    let i = 0;
    function jump() {
      randomPos();
      i++;
      if (i < times) setTimeout(jump, 130);
    }
    jump();
  }, [randomPos]);

  const handleNoHover = useCallback(() => {
    // After 2 real clicks, hover causes 3 rapid jumps
    if (noCount >= 2) runAway(3);
  }, [noCount, runAway]);

  const handleNo = () => {
    const count = noCount + 1;
    setNoCount(count);
    setYesScale((s) => Math.min(s + 0.12, 2.2));
    setNoMsg(NO_MESSAGES[(count - 1) % NO_MESSAGES.length]);
    setShowNoMsg(true);
    setTimeout(() => setShowNoMsg(false), 2200);
    // First 2 clicks: jump once. After that: jump 3 times per click
    runAway(count <= 2 ? 1 : 3);
  };

  const handleYes = () => {
    fireConfetti();
    setTimeout(() => setStep("planning"), 400);
  };

  const handleSubmit = async () => {
    if (!dateVal || !timeVal || !dateIdea) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "dateResponses"), {
        date: dateVal,
        time: timeVal,
        dateIdea: dateIdea === "I Have My Own Idea" ? customIdea || dateIdea : dateIdea,
        noAttempts: noCount,
        submittedAt: serverTimestamp(),
      });
      fireConfetti();
      setTimeout(() => setStep("submitted"), 300);
    } catch (e) {
      console.error(e);
      // Even if Firebase fails, show the success screen
      fireConfetti();
      setTimeout(() => setStep("submitted"), 300);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 py-10 relative overflow-hidden">
      <BackgroundDecor />
      {/* Floating hearts background */}
      {["💖", "💕", "✨", "🌸", "💗"].map((h, i) => (
        <div
          key={i}
          className="fixed text-2xl pointer-events-none select-none opacity-20"
          style={{
            left: `${10 + i * 18}%`,
            top: `${5 + (i % 3) * 28}%`,
            animation: `float ${3 + i * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        >
          {h}
        </div>
      ))}

      {/* No button & toast — outside AnimatePresence so transform doesn't affect fixed positioning */}
      {step === "ask" && (
        <>
          <button
            ref={noRef}
            className="btn-no-visible"
            style={{ ...noPos, position: "fixed", zIndex: 9999, transition: "top 0.09s ease, left 0.09s ease" }}
            onClick={handleNo}
            onMouseEnter={handleNoHover}
          >
            No 😐
          </button>
          <AnimatePresence>
            {showNoMsg && (
              <motion.div
                key={noMsg}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ position: "fixed", bottom: "4rem", left: "50%", transform: "translateX(-50%)", zIndex: 9999 }}
                className="glass rounded-2xl px-5 py-3 text-sm font-medium text-purple-700 shadow-lg whitespace-nowrap"
              >
                {noMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <AnimatePresence mode="wait">

        {/* ── STEP 1: ASK ── */}
        {step === "ask" && (
          <motion.div
            key="ask"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="glass rounded-3xl p-8 sm:p-12 max-w-lg w-full text-center shadow-2xl relative"
          >

            <div className="text-5xl mb-4 heart-float inline-block">💌</div>
            <h1 className="font-display text-3xl sm:text-4xl text-purple-800 mb-3 leading-tight">
              One Tiny Question...
            </h1>
            <p className="text-gray-600 text-base mb-1">Hey 👋</p>
            <p className="text-gray-600 mb-1">I know we've been texting for only 4 days...</p>
            <p className="text-purple-700 font-semibold text-lg mb-6">
              And honestly? I'd love to actually see your face and talk to you. 😊
            </p>

            <p className="text-xl font-semibold text-gray-800 mb-8">
              Would you like to go out with me?
            </p>

            <motion.button
              className="btn-yes text-white font-bold rounded-2xl px-10 py-5 text-2xl block mx-auto cursor-pointer"
              style={{ scale: yesScale }}
              whileTap={{ scale: yesScale * 0.95 }}
              onClick={handleYes}
            >
              YES! 💖
            </motion.button>

            <p className="text-xs text-gray-400 mt-6 italic">
              The "No" button has trust issues and commitment problems 🏃
              {noCount > 0 && ` (caught it ${noCount} time${noCount > 1 ? "s" : ""} 😂)`}
            </p>
          </motion.div>
        )}

        {/* ── STEP 2: PLANNING ── */}
        {step === "planning" && (
          <motion.div
            key="planning"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="glass rounded-3xl p-8 sm:p-10 max-w-lg w-full text-center shadow-2xl"
          >
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="font-display text-3xl text-purple-800 mb-1">YAYYYY!!!</h2>
            <p className="text-gray-600 mb-4 text-sm">You just made my entire day. Week. Month. Life.</p>

            <img
              src="https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif"
              alt="happy cat"
              className="mx-auto rounded-2xl mb-6 w-40 h-40 object-cover shadow-md"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />

            <p className="font-semibold text-purple-700 mb-6">
              Now help me plan this  🗓️
            </p>

            {/* Date */}
            <div className="text-left mb-3">
              <label className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1.5 block">
                📅 When?
              </label>
              <DatePicker value={dateVal} onChange={setDateVal} min={new Date().toISOString().split("T")[0]} />
            </div>

            {/* Time */}
            <div className="text-left mb-5">
              <label className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1.5 block">
                ⏰ What time?
              </label>
              <TimePicker value={timeVal} onChange={setTimeVal} />
            </div>

            {/* Date idea */}
            <div className="text-left mb-4">
              <label className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1.5 block">
                🧐 Pick your adventure
              </label>
              <IdeaPicker value={dateIdea} onChange={setDateIdea} />
            </div>

            <AnimatePresence>
              {dateIdea === "I Have My Own Idea" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-left mb-4 overflow-hidden"
                >
                  <label className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1 block">
                    📝 Tell me everything
                  </label>
                  <textarea
                    value={customIdea}
                    onChange={(e) => setCustomIdea(e.target.value)}
                    placeholder="I was thinking we could..."
                    rows={3}
                    className="w-full rounded-xl border border-purple-200 bg-white/70 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!dateVal || !timeVal || !dateIdea || submitting}
              className="btn-yes w-full text-white font-bold rounded-2xl px-6 py-4 text-lg mt-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? "Sending the memo... 📨" : "Lock it in! 💕"}
            </motion.button>

            <p className="text-xs text-gray-400 mt-3 italic">
              Step 1: Be excited. Step 2: I pick you up. ✅
            </p>
          </motion.div>
        )}

        {/* ── STEP 3: SUBMITTED ── */}
        {step === "submitted" && (
          <motion.div
            key="submitted"
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="glass rounded-3xl p-8 sm:p-12 max-w-lg w-full text-center shadow-2xl"
          >
            <div className="text-5xl mb-3 heart-float inline-block">💖</div>
            <h2 className="font-display text-3xl sm:text-4xl text-purple-800 mb-3">
              It's a date!!!
            </h2>
            <p className="text-gray-600 mb-2">Excellent choice. Truly. Impeccable taste.</p>
            <div className="bg-purple-50 rounded-2xl p-4 mb-6 text-left space-y-2">
              <p className="text-sm text-purple-700">
                📅 <span className="font-semibold">{dateVal}</span>
              </p>
              <p className="text-sm text-purple-700">
                ⏰ <span className="font-semibold">{timeVal}</span>
              </p>
              <p className="text-sm text-purple-700">
                🎯 <span className="font-semibold">
                  {dateIdea === "I Have My Own Idea" ? customIdea || dateIdea : dateIdea}
                </span>
              </p>
            </div>
            <p className="text-xl font-bold text-purple-800 mb-2">
              Cannnnn't waitttttt!!! ❤️
            </p>
            <p className="text-gray-500 text-sm">See you soon 😊</p>
            <p className="text-xs text-gray-400 mt-4 italic">
              I will now begin my highly professional planning process.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
