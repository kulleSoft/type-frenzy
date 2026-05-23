import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WORDS, PHRASES, TAUNTS, EMOJIS } from "@/lib/game-data";
import { sound } from "@/lib/sound";

type Mode = "normal" | "infinite" | "insane";

interface Props {
  mode: Mode;
  onGameOver: (score: number, level: number, maxCombo: number, totalWords: number) => void;
  onExit: () => void;
}

const BASE_KEYS = "qwertyuiopasdfghjklzxcvbnm".split("");

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWord(level: number) {
  if (level >= 5 && Math.random() < 0.35) return PHRASES[Math.floor(Math.random() * PHRASES.length)];
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export function Game({ mode, onGameOver, onExit }: Props) {
  const [target, setTarget] = useState(() => pickWord(1));
  const [typed, setTyped] = useState("");
  const [time, setTime] = useState(mode === "insane" ? 15 : 30);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [level, setLevel] = useState(mode === "insane" ? 5 : 1);
  const [totalWords, setTotalWords] = useState(0);
  const [keyMap, setKeyMap] = useState<string[]>(BASE_KEYS);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [chaos, setChaos] = useState({ shake: false, rotate: 0, zoom: 1, invert: false, glitch: false, delay: 0, fakePopup: false });
  const [floaters, setFloaters] = useState<{ id: number; x: number; y: number; text: string; color: string }[]>([]);
  const [taunt, setTaunt] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const floaterId = useRef(0);

  // Focus input
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const h = () => inputRef.current?.focus();
    window.addEventListener("click", h);
    window.addEventListener("touchstart", h);
    return () => { window.removeEventListener("click", h); window.removeEventListener("touchstart", h); };
  }, []);

  // Timer
  useEffect(() => {
    if (time <= 0) {
      sound.death();
      onGameOver(score, level, maxCombo, totalWords);
      return;
    }
    const id = setTimeout(() => setTime(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [time, score, level, maxCombo, totalWords, onGameOver]);

  // Chaos progression — re-trigger on level change
  useEffect(() => {
    if (level < 2) return;
    const intensity = Math.min(level / 20, 1);
    const interval = setInterval(() => {
      const events = ["shuffle","hide","shake","rotate","zoom","invert","glitch","delay","fakePopup","emojiRain","fakeLetters"];
      const ev = events[Math.floor(Math.random() * events.length)];
      sound.chaos();
      switch (ev) {
        case "shuffle":
          setKeyMap(shuffle(BASE_KEYS));
          break;
        case "hide": {
          const n = Math.min(3 + Math.floor(level/3), 12);
          setHiddenKeys(new Set(shuffle(BASE_KEYS).slice(0, n)));
          setTimeout(() => setHiddenKeys(new Set()), 3000);
          break;
        }
        case "shake":
          setChaos(c => ({ ...c, shake: true }));
          setTimeout(() => setChaos(c => ({ ...c, shake: false })), 1500);
          break;
        case "rotate":
          setChaos(c => ({ ...c, rotate: (Math.random() - 0.5) * 30 * intensity }));
          setTimeout(() => setChaos(c => ({ ...c, rotate: 0 })), 2500);
          break;
        case "zoom":
          setChaos(c => ({ ...c, zoom: 1 + (Math.random() - 0.5) * 0.4 * intensity }));
          setTimeout(() => setChaos(c => ({ ...c, zoom: 1 })), 2000);
          break;
        case "invert":
          setChaos(c => ({ ...c, invert: true }));
          setTimeout(() => setChaos(c => ({ ...c, invert: false })), 2000);
          break;
        case "glitch":
          setChaos(c => ({ ...c, glitch: true }));
          setTimeout(() => setChaos(c => ({ ...c, glitch: false })), 800);
          break;
        case "delay":
          setChaos(c => ({ ...c, delay: 200 }));
          setTimeout(() => setChaos(c => ({ ...c, delay: 0 })), 2500);
          break;
        case "fakePopup":
          setChaos(c => ({ ...c, fakePopup: true }));
          setTimeout(() => setChaos(c => ({ ...c, fakePopup: false })), 1800);
          break;
        case "emojiRain": {
          const drops = Array.from({length: 12}, (_,i) => ({
            id: floaterId.current++, x: Math.random()*100, y: 100,
            text: EMOJIS[Math.floor(Math.random()*EMOJIS.length)], color: "white"
          }));
          setFloaters(f => [...f, ...drops]);
          setTimeout(() => setFloaters(f => f.filter(x => !drops.find(d => d.id === x.id))), 1600);
          break;
        }
        case "fakeLetters": {
          const orig = target;
          const fake = orig.split("").map(c => Math.random() < 0.3 ? BASE_KEYS[Math.floor(Math.random()*26)] : c).join("");
          setTarget(fake);
          setTimeout(() => setTarget(orig), 600);
          break;
        }
      }
    }, Math.max(4500 - level * 200, 1500));
    return () => clearInterval(interval);
  }, [level, target]);

  // Random taunts
  useEffect(() => {
    if (level === 10 || level === 5 || level === 15 || level === 20) {
      setTaunt(TAUNTS[Math.floor(Math.random() * TAUNTS.length)]);
      setTimeout(() => setTaunt(null), 2000);
    }
  }, [level]);

  const submitWord = useCallback(() => {
    const guess = typed.trim().toLowerCase();
    const tgt = target.toLowerCase();
    if (guess === tgt) {
      const points = (tgt.length * 10) * (1 + combo * 0.1);
      const final = Math.round(points);
      setScore(s => s + final);
      setCombo(c => {
        const nc = c + 1;
        setMaxCombo(m => Math.max(m, nc));
        sound.combo(nc);
        return nc;
      });
      sound.hit();
      setTotalWords(w => w + 1);
      setTime(t => Math.min(t + (mode === "insane" ? 1 : 2), 60));
      setTyped("");
      setTarget(pickWord(level));
      // Level up every 5 words
      if ((totalWords + 1) % 5 === 0) setLevel(l => l + 1);
      // Floater
      const id = floaterId.current++;
      setFloaters(f => [...f, { id, x: 50, y: 50, text: `+${final}`, color: "var(--neon-yellow)" }]);
      setTimeout(() => setFloaters(f => f.filter(x => x.id !== id)), 1500);
    } else {
      sound.error();
      setCombo(0);
      setTime(t => Math.max(t - 2, 0));
      setTyped("");
      setChaos(c => ({ ...c, shake: true }));
      setTimeout(() => setChaos(c => ({ ...c, shake: false })), 400);
    }
  }, [typed, target, combo, totalWords, level, mode]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      submitWord();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (chaos.delay) {
      setTimeout(() => setTyped(v), chaos.delay);
    } else {
      setTyped(v);
    }
    // Auto-submit on space already handled by Enter; also check final char
    if (v.endsWith(" ")) {
      setTyped(v.trim());
      setTimeout(submitWord, 0);
    }
  };

  const difficulty = useMemo(() => Math.min((level / 20) * 100, 100), [level]);

  return (
    <div className="min-h-screen relative grid-bg overflow-hidden select-none"
      style={{
        transform: `rotate(${chaos.rotate}deg) scale(${chaos.zoom})`,
        filter: chaos.invert ? "invert(1) hue-rotate(180deg)" : "none",
        transition: "transform 0.6s ease-out, filter 0.3s",
      }}
    >
      {/* HUD */}
      <div className="absolute top-0 inset-x-0 p-3 sm:p-4 flex justify-between items-start gap-2 z-20">
        <div className="flex flex-col gap-1">
          <button onClick={onExit} className="text-xs px-3 py-1 rounded-full bg-bg-deeper border border-neon-purple text-neon-purple hover:scale-105 transition">← Sair</button>
          <div className="text-xs text-muted-foreground">NIVEL <span className="text-neon-cyan font-black">{level}</span></div>
        </div>
        <div className="text-center">
          <div className="text-4xl sm:text-5xl font-black text-neon-yellow text-glow-pink" style={{ color: time < 5 ? "var(--neon-pink)" : "var(--neon-yellow)" }}>
            {time}s
          </div>
          <div className="w-32 sm:w-48 h-2 bg-bg-deeper rounded-full overflow-hidden mt-1 border border-neon-purple">
            <div className="h-full bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-purple transition-all"
              style={{ width: `${difficulty}%` }} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">SCORE</div>
          <div className="text-2xl sm:text-3xl font-black text-neon-cyan text-glow-cyan">{score}</div>
          {combo > 1 && (
            <div className="text-sm font-black text-neon-pink animate-pulse-neon">x{combo} COMBO</div>
          )}
        </div>
      </div>

      {/* Main target */}
      <div className={`min-h-screen flex flex-col items-center justify-center px-4 ${chaos.shake ? "animate-shake" : ""}`}>
        <div className={`text-center mb-6 ${chaos.glitch ? "animate-glitch" : ""}`}>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">digite:</div>
          <div className="text-5xl sm:text-7xl font-black text-white text-glow-cyan break-all max-w-[90vw]"
            style={{ wordBreak: "break-word" }}>
            {target.split("").map((c, i) => (
              <span key={i} className={i < typed.length ? (typed[i] === c ? "text-neon-green" : "text-neon-pink") : ""}>
                {c}
              </span>
            ))}
          </div>
        </div>

        <input
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          onKeyDown={handleKey}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full max-w-md text-center text-2xl sm:text-3xl font-black bg-bg-deeper border-2 border-neon-pink rounded-xl px-4 py-3 text-neon-pink outline-none glow-pink"
          placeholder="..."
        />

        {/* Virtual keyboard */}
        <div className="mt-6 w-full max-w-2xl">
          {[["q","w","e","r","t","y","u","i","o","p"],
            ["a","s","d","f","g","h","j","k","l"],
            ["z","x","c","v","b","n","m"]].map((row, ri) => (
            <div key={ri} className="flex justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
              {row.map((origK) => {
                const idx = BASE_KEYS.indexOf(origK);
                const display = keyMap[idx];
                const hidden = hiddenKeys.has(origK);
                const active = typed.endsWith(origK);
                return (
                  <div key={origK}
                    className={`w-7 h-9 sm:w-10 sm:h-12 rounded-md flex items-center justify-center text-sm sm:text-base font-bold border transition-all
                      ${active ? "bg-neon-pink text-black scale-110 glow-pink" : "bg-bg-deeper border-neon-purple/40 text-white"}
                    `}
                    style={{ opacity: hidden ? 0 : 1 }}>
                    {display}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Floaters */}
      {floaters.map(f => (
        <div key={f.id} className="absolute pointer-events-none text-3xl sm:text-5xl font-black animate-float-up z-30"
          style={{ left: `${f.x}%`, top: `${f.y}%`, color: f.color, transform: "translate(-50%,-50%)" }}>
          {f.text}
        </div>
      ))}

      {/* Taunt */}
      {taunt && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="text-3xl sm:text-5xl font-black text-neon-pink text-glow-pink animate-pop-in bg-black/60 px-6 py-3 rounded-2xl border-2 border-neon-pink">
            {taunt}
          </div>
        </div>
      )}

      {/* Fake popup */}
      {chaos.fakePopup && (
        <div className="absolute z-50 animate-pop-in"
          style={{ top: `${20 + Math.random()*40}%`, left: `${20 + Math.random()*40}%` }}>
          <div className="bg-white text-black rounded-lg shadow-2xl p-4 max-w-xs border-2 border-gray-400">
            <div className="flex justify-between items-center mb-2">
              <strong className="text-sm">⚠ Sistema</strong>
              <button className="text-gray-500 text-lg leading-none">×</button>
            </div>
            <p className="text-xs">Voce ganhou um iPhone! Clique aqui para resgatar!!!</p>
          </div>
        </div>
      )}
    </div>
  );
}
