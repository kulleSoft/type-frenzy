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

function vibrate(ms: number | number[]) {
  try { (navigator as any).vibrate?.(ms); } catch {}
}

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
  const floaterId = useRef(0);

  // Refs for stable submit logic (avoid stale closures with virtual keyboard)
  const typedRef = useRef("");
  const targetRef = useRef(target);
  const comboRef = useRef(0);
  const totalRef = useRef(0);
  const levelRef = useRef(level);
  const chaosDelayRef = useRef(0);

  useEffect(() => { typedRef.current = typed; }, [typed]);
  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { totalRef.current = totalWords; }, [totalWords]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { chaosDelayRef.current = chaos.delay; }, [chaos.delay]);

  // Timer
  useEffect(() => {
    if (time <= 0) {
      sound.death();
      vibrate([100, 50, 200]);
      onGameOver(score, level, maxCombo, totalWords);
      return;
    }
    const id = setTimeout(() => setTime(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [time, score, level, maxCombo, totalWords, onGameOver]);

  // Chaos progression
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
          setChaos(c => ({ ...c, rotate: (Math.random() - 0.5) * 24 * intensity }));
          setTimeout(() => setChaos(c => ({ ...c, rotate: 0 })), 2500);
          break;
        case "zoom":
          setChaos(c => ({ ...c, zoom: 1 + (Math.random() - 0.5) * 0.3 * intensity }));
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
          setChaos(c => ({ ...c, delay: 180 }));
          setTimeout(() => setChaos(c => ({ ...c, delay: 0 })), 2500);
          break;
        case "fakePopup":
          setChaos(c => ({ ...c, fakePopup: true }));
          setTimeout(() => setChaos(c => ({ ...c, fakePopup: false })), 1800);
          break;
        case "emojiRain": {
          const drops = Array.from({length: 12}, () => ({
            id: floaterId.current++, x: Math.random()*100, y: 100,
            text: EMOJIS[Math.floor(Math.random()*EMOJIS.length)], color: "white"
          }));
          setFloaters(f => [...f, ...drops]);
          setTimeout(() => setFloaters(f => f.filter(x => !drops.find(d => d.id === x.id))), 1600);
          break;
        }
        case "fakeLetters": {
          const orig = targetRef.current;
          const fake = orig.split("").map(c => Math.random() < 0.3 ? BASE_KEYS[Math.floor(Math.random()*26)] : c).join("");
          setTarget(fake);
          setTimeout(() => setTarget(orig), 600);
          break;
        }
      }
    }, Math.max(4500 - level * 200, 1500));
    return () => clearInterval(interval);
  }, [level]);

  // Taunts
  useEffect(() => {
    if (level === 5 || level === 10 || level === 15 || level === 20) {
      setTaunt(TAUNTS[Math.floor(Math.random() * TAUNTS.length)]);
      setTimeout(() => setTaunt(null), 2000);
    }
  }, [level]);

  const submitWord = useCallback(() => {
    const guess = typedRef.current.trim().toLowerCase();
    const tgt = targetRef.current.toLowerCase();
    if (!guess) return;
    if (guess === tgt) {
      const points = (tgt.length * 10) * (1 + comboRef.current * 0.1);
      const final = Math.round(points);
      setScore(s => s + final);
      setCombo(c => {
        const nc = c + 1;
        setMaxCombo(m => Math.max(m, nc));
        sound.combo(nc);
        return nc;
      });
      sound.hit();
      vibrate(15);
      setTotalWords(w => w + 1);
      setTime(t => Math.min(t + (mode === "insane" ? 1 : 2), 60));
      setTyped("");
      setTarget(pickWord(levelRef.current));
      if ((totalRef.current + 1) % 5 === 0) setLevel(l => l + 1);
      const id = floaterId.current++;
      setFloaters(f => [...f, { id, x: 50, y: 42, text: `+${final}`, color: "var(--neon-yellow)" }]);
      setTimeout(() => setFloaters(f => f.filter(x => x.id !== id)), 1500);
    } else {
      sound.error();
      vibrate([40, 30, 40]);
      setCombo(0);
      setTime(t => Math.max(t - 2, 0));
      setTyped("");
      setChaos(c => ({ ...c, shake: true }));
      setTimeout(() => setChaos(c => ({ ...c, shake: false })), 400);
    }
  }, [mode]);

  // Tap virtual key — apply chaos delay
  const tapKey = useCallback((origK: string) => {
    if (hiddenKeys.has(origK)) return;
    vibrate(8);
    const apply = () => setTyped(t => t + origK);
    if (chaosDelayRef.current) setTimeout(apply, chaosDelayRef.current);
    else apply();
  }, [hiddenKeys]);

  const tapBackspace = () => {
    vibrate(8);
    setTyped(t => t.slice(0, -1));
  };

  // Physical keyboard fallback (desktop test)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); submitWord(); return; }
      if (e.key === "Backspace") { tapBackspace(); return; }
      const k = e.key.toLowerCase();
      if (k.length === 1 && BASE_KEYS.includes(k)) tapKey(k);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitWord, tapKey]);

  const difficulty = useMemo(() => Math.min((level / 20) * 100, 100), [level]);

  return (
    <div
      className="fixed inset-0 grid-bg overflow-hidden select-none touch-none"
      style={{
        transform: `rotate(${chaos.rotate}deg) scale(${chaos.zoom})`,
        filter: chaos.invert ? "invert(1) hue-rotate(180deg)" : "none",
        transition: "transform 0.6s ease-out, filter 0.3s",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* HUD */}
      <div className="absolute top-0 inset-x-0 px-3 pt-3 flex justify-between items-start gap-2 z-20"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}>
        <div className="flex flex-col gap-1">
          <button onClick={() => { console.log("[btn] Sair"); onExit(); }} className="text-[11px] px-3 py-1.5 rounded-full bg-bg-deeper border border-neon-purple text-neon-purple active:scale-95 transition">← Sair</button>
          <div className="text-[10px] text-muted-foreground">NV <span className="text-neon-cyan font-black text-sm">{level}</span></div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-black text-glow-pink leading-none"
            style={{ color: time < 5 ? "var(--neon-pink)" : "var(--neon-yellow)" }}>
            {time}s
          </div>
          <div className="w-32 h-1.5 bg-bg-deeper rounded-full overflow-hidden mt-1 border border-neon-purple">
            <div className="h-full bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-purple transition-all"
              style={{ width: `${difficulty}%` }} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">SCORE</div>
          <div className="text-2xl font-black text-neon-cyan text-glow-cyan leading-none">{score}</div>
          {combo > 1 && (
            <div className="text-xs font-black text-neon-pink animate-pulse-neon">x{combo}</div>
          )}
        </div>
      </div>

      {/* Main area — word + typed buffer */}
      <div className={`absolute inset-x-0 top-[88px] bottom-[270px] flex flex-col items-center justify-center px-4 ${chaos.shake ? "animate-shake" : ""}`}>
        <div className={`text-center w-full ${chaos.glitch ? "animate-glitch" : ""}`}>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">digite:</div>
          <div className="font-black text-white text-glow-cyan break-words leading-tight"
            style={{
              wordBreak: "break-word",
              fontSize: target.length > 14 ? "2rem" : target.length > 8 ? "2.75rem" : "3.5rem",
            }}>
            {target.split("").map((c, i) => (
              <span key={i} className={i < typed.length ? (typed[i] === c ? "text-neon-green" : "text-neon-pink") : ""}>
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 w-full max-w-sm h-12 rounded-xl bg-bg-deeper border-2 border-neon-pink glow-pink flex items-center justify-center px-3 text-2xl font-black text-neon-pink tracking-wider overflow-hidden">
          {typed || <span className="text-muted-foreground text-base">toque nas teclas</span>}
        </div>
      </div>

      {/* Virtual keyboard (bottom-locked) */}
      <div className="absolute inset-x-0 bottom-0 px-1.5 pb-2 z-20"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}>
        {[["q","w","e","r","t","y","u","i","o","p"],
          ["a","s","d","f","g","h","j","k","l"],
          ["z","x","c","v","b","n","m"]].map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1 mb-1.5">
            {ri === 2 && (
              <button onClick={() => { console.log("[btn] APAGAR"); tapBackspace(); }}
                className="flex-1 max-w-[52px] h-12 rounded-md bg-bg-deeper border border-neon-purple/60 text-neon-pink font-bold text-xs active:scale-90 active:bg-neon-pink/20 transition-transform">
                APAGAR
              </button>
            )}
            {row.map((origK) => {
              const idx = BASE_KEYS.indexOf(origK);
              const display = keyMap[idx];
              const hidden = hiddenKeys.has(origK);
              return (
                <button
                  key={origK}
                  onPointerDown={(e) => { e.preventDefault(); console.log("[btn] key", origK); tapKey(origK); }}
                  disabled={hidden}
                  className="flex-1 max-w-[40px] h-12 rounded-md flex items-center justify-center text-base font-bold border bg-bg-deeper border-neon-purple/40 text-white active:scale-90 active:bg-neon-pink active:text-black transition-transform"
                  style={{ opacity: hidden ? 0.05 : 1, touchAction: "manipulation" }}>
                  {display}
                </button>
              );
            })}
            {ri === 2 && (
              <button onClick={() => { console.log("[btn] OK"); submitWord(); }}
                className="flex-1 max-w-[60px] h-12 rounded-md bg-neon-pink text-black font-black text-xs active:scale-90 transition-transform glow-pink">
                OK
              </button>
            )}
          </div>
        ))}
        <button onClick={() => { console.log("[btn] ESPAÇO/ENVIAR"); submitWord(); }}
          className="w-full h-12 rounded-lg bg-bg-deeper border-2 border-neon-cyan text-neon-cyan font-black text-sm active:scale-95 transition-transform">
          ESPAÇO / ENVIAR
        </button>
      </div>

      {/* Floaters */}
      {floaters.map(f => (
        <div key={f.id} className="absolute pointer-events-none text-4xl font-black animate-float-up z-30"
          style={{ left: `${f.x}%`, top: `${f.y}%`, color: f.color, transform: "translate(-50%,-50%)" }}>
          {f.text}
        </div>
      ))}

      {/* Taunt */}
      {taunt && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 px-4">
          <div className="text-3xl font-black text-neon-pink text-glow-pink animate-pop-in bg-black/70 px-5 py-3 rounded-2xl border-2 border-neon-pink text-center">
            {taunt}
          </div>
        </div>
      )}

      {/* Fake popup */}
      {chaos.fakePopup && (
        <div className="absolute z-50 animate-pop-in"
          style={{ top: `${15 + Math.random()*30}%`, left: `${5 + Math.random()*20}%` }}>
          <div className="bg-white text-black rounded-lg shadow-2xl p-3 max-w-[220px] border-2 border-gray-400">
            <div className="flex justify-between items-center mb-1">
              <strong className="text-xs">SISTEMA</strong>
              <span className="text-gray-500 text-lg leading-none">x</span>
            </div>
            <p className="text-[11px]">Você ganhou um iPhone! Clique aqui para resgatar!!!</p>
          </div>
        </div>
      )}
    </div>
  );
}
