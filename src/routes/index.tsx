import { useEffect, useState } from "react";
import { Zap, Infinity as InfinityIcon, Flame, Trophy, Gamepad2, Target, Keyboard } from "lucide-react";
import { Game } from "@/components/Game";
import { TermsModal } from "@/components/TermsModal";
import { ACHIEVEMENTS, SKINS } from "@/lib/game-data";
import { sound } from "@/lib/sound";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Digite Mais Rapido — Jogo viral de digitacao caotica" },
      { name: "description", content: "Sobreviva ao teclado mais maluco da internet. Teclas trocam, tela gira, tudo bugado. 1% passa do nivel 10." },
      { property: "og:title", content: "Digite Mais Rapido" },
      { property: "og:description", content: "Jogo viral de digitacao caotica. Voce nao vai passar do nivel 10." },
    ],
  }),
});

type Screen = "menu" | "game" | "over" | "ranking" | "how" | "achievements" | "skins";
type Mode = "normal" | "infinite" | "insane";

interface Stats {
  bestScore: number;
  maxLevel: number;
  maxCombo: number;
  totalWords: number;
  totalRuns: number;
  unlocked: string[];
  skin: string;
  ranking: { score: number; level: number; date: string }[];
}

const DEFAULT_STATS: Stats = {
  bestScore: 0, maxLevel: 0, maxCombo: 0, totalWords: 0, totalRuns: 0,
  unlocked: [], skin: "cyber", ranking: []
};

function loadStats(): Stats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem("dmr_stats");
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch { return DEFAULT_STATS; }
}

function Index() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [mode, setMode] = useState<Mode>("normal");
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [lastRun, setLastRun] = useState({ score: 0, level: 0, isRecord: false });

  useEffect(() => { setStats(loadStats()); }, []);

  const saveStats = (s: Stats) => {
    setStats(s);
    if (typeof window !== "undefined") localStorage.setItem("dmr_stats", JSON.stringify(s));
  };

  const handleGameOver = (score: number, level: number, maxCombo: number, totalWords: number) => {
    const isRecord = score > stats.bestScore;
    const newStats: Stats = {
      ...stats,
      bestScore: Math.max(stats.bestScore, score),
      maxLevel: Math.max(stats.maxLevel, level),
      maxCombo: Math.max(stats.maxCombo, maxCombo),
      totalWords: stats.totalWords + totalWords,
      totalRuns: stats.totalRuns + 1,
      ranking: [...stats.ranking, { score, level, date: new Date().toISOString() }]
        .sort((a, b) => b.score - a.score).slice(0, 10),
    };
    // Check achievements
    const baseForCheck = { ...newStats, bestScore: Math.max(stats.bestScore, score), maxLevel: Math.max(stats.maxLevel, level), maxCombo: Math.max(stats.maxCombo, maxCombo), totalWords };
    const newUnlocked = ACHIEVEMENTS.filter(a => a.check(baseForCheck) && !newStats.unlocked.includes(a.id)).map(a => a.id);
    newStats.unlocked = [...newStats.unlocked, ...newUnlocked];
    saveStats(newStats);
    setLastRun({ score, level, isRecord });
    setScreen("over");
  };

  const startGame = (m: Mode) => {
    sound.start();
    setMode(m);
    setScreen("game");
  };

  const share = () => {
    const text = `Fiz ${lastRun.score} pontos no nivel ${lastRun.level} em DIGITE MAIS RAPIDO 🔥 Voce consegue mais?`;
    if (navigator.share) {
      navigator.share({ title: "Digite Mais Rapido", text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      alert("Resultado copiado! Cole no seu story 🔥");
    }
  };

  if (screen === "game") {
    return <><TermsModal /><Game mode={mode} onGameOver={handleGameOver} onExit={() => setScreen("menu")} /></>;
  }

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      <TermsModal />

      {/* Floating bg shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-neon-purple/20 blur-3xl animate-spin-slow" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-neon-pink/20 blur-3xl animate-spin-slow" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 py-8">
        {screen === "menu" && (
          <div className="text-center max-w-lg w-full animate-pop-in">
            <h1 className="text-6xl sm:text-8xl font-black leading-[0.95] mb-0 tracking-tight">
              <span className="text-white text-glow-cyan">DIGITE</span>
            </h1>
            <h1 className="text-6xl sm:text-8xl font-black leading-[0.95] tracking-tight">
              <span className="text-neon-pink text-glow-pink">MAIS</span>
            </h1>
            <h1 className="text-6xl sm:text-8xl font-black leading-[0.95] mb-3 tracking-tight">
              <span className="text-neon-pink text-glow-pink animate-pulse-neon">RAPIDO</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground/80 uppercase tracking-[0.2em] mb-6">— 1% consegue passar do nivel 10 —</p>

            <div className="space-y-3">
              <button onClick={() => { console.log("[btn] JOGAR normal"); startGame("normal"); }}
                className="w-full py-5 rounded-2xl bg-gradient-to-b from-neon-pink to-pink-600 text-white text-3xl font-black glow-pink hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-3 border-2 border-pink-300/40">
                <Zap className="w-8 h-8 fill-white" strokeWidth={2.5} />
                JOGAR
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { console.log("[btn] INFINITO"); startGame("infinite"); }}
                  className="py-4 px-3 rounded-2xl bg-bg-deeper/60 border-2 border-neon-cyan/60 hover:border-neon-cyan hover:glow-cyan transition flex items-center gap-2 text-left">
                  <InfinityIcon className="w-7 h-7 text-neon-cyan shrink-0" strokeWidth={2.5} />
                  <div className="min-w-0">
                    <div className="text-neon-cyan font-black text-base leading-tight">INFINITO</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">Quanto tempo voce aguenta?</div>
                  </div>
                </button>
                <button onClick={() => { console.log("[btn] INSANO"); startGame("insane"); }}
                  className="py-4 px-3 rounded-2xl bg-bg-deeper/60 border-2 border-neon-purple/60 hover:border-neon-purple hover:glow-purple transition flex items-center gap-2 text-left">
                  <Flame className="w-7 h-7 text-neon-purple shrink-0" strokeWidth={2.5} />
                  <div className="min-w-0">
                    <div className="text-neon-purple font-black text-base leading-tight">INSANO</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">So para os verdadeiros</div>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => { console.log("[btn] Ranking"); setScreen("ranking"); }} className="py-3 px-2 rounded-xl bg-bg-deeper/60 border border-neon-pink/40 hover:border-neon-pink transition flex flex-col items-center gap-1">
                  <Trophy className="w-5 h-5 text-neon-pink" strokeWidth={2.5} />
                  <div className="text-[11px] font-black text-white leading-tight">RANKING</div>
                  <div className="text-[9px] text-muted-foreground leading-tight">Veja os melhores</div>
                </button>
                <button onClick={() => { console.log("[btn] Como Jogar"); setScreen("how"); }} className="py-3 px-2 rounded-xl bg-bg-deeper/60 border border-neon-purple/40 hover:border-neon-purple transition flex flex-col items-center gap-1">
                  <Gamepad2 className="w-5 h-5 text-neon-purple" strokeWidth={2.5} />
                  <div className="text-[11px] font-black text-white leading-tight">COMO JOGAR</div>
                  <div className="text-[9px] text-muted-foreground leading-tight">Aprenda as regras</div>
                </button>
                <button onClick={() => { console.log("[btn] Conquistas"); setScreen("achievements"); }} className="py-3 px-2 rounded-xl bg-bg-deeper/60 border border-neon-cyan/40 hover:border-neon-cyan transition flex flex-col items-center gap-1">
                  <Target className="w-5 h-5 text-neon-cyan" strokeWidth={2.5} />
                  <div className="text-[11px] font-black text-white leading-tight">CONQUISTAS</div>
                  <div className="text-[9px] text-muted-foreground leading-tight">Desbloqueie tudo</div>
                </button>
              </div>

              <button onClick={() => { console.log("[btn] Skins de Teclado"); setScreen("skins"); }}
                className="w-full py-3 px-4 rounded-xl bg-bg-deeper/60 border border-neon-cyan/40 hover:border-neon-cyan transition flex items-center justify-center gap-3">
                <Keyboard className="w-5 h-5 text-neon-cyan" strokeWidth={2.5} />
                <div className="text-left">
                  <div className="text-sm font-black text-white leading-tight">SKINS DE TECLADO</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">Personalize sua experiencia</div>
                </div>
              </button>
            </div>

            <div className="mt-8 text-xs text-muted-foreground">
              Recorde pessoal: <span className="text-neon-yellow font-bold">{stats.bestScore}</span> · Nivel max: <span className="text-neon-cyan font-bold">{stats.maxLevel}</span>
            </div>
          </div>
        )}

        {screen === "over" && (
          <div className="text-center max-w-md w-full animate-pop-in">
            {lastRun.isRecord ? (
              <div className="text-neon-yellow text-glow-pink text-2xl font-black mb-2 animate-pulse-neon">NOVO RECORDE!</div>
            ) : (
              <div className="text-neon-pink text-glow-pink text-2xl font-black mb-2">VOCE FOI DESTRUIDO</div>
            )}
            <div className="text-7xl font-black text-neon-cyan text-glow-cyan mb-1">{lastRun.score}</div>
            <div className="text-sm text-muted-foreground mb-1">pontos · nivel {lastRun.level}</div>
            <div className="text-xs text-neon-purple mb-8">recorde: {stats.bestScore}</div>

            <div className="space-y-3">
              <button onClick={() => { console.log("[btn] TENTAR DE NOVO", mode); startGame(mode); }}
                className="w-full py-4 rounded-2xl bg-neon-pink text-black text-xl font-black glow-pink hover:scale-105 transition">
                TENTAR DE NOVO
              </button>
              <button onClick={() => { console.log("[btn] COMPARTILHAR"); share(); }}
                className="w-full py-3 rounded-xl bg-bg-deeper border-2 border-neon-cyan text-neon-cyan font-bold hover:glow-cyan transition">
                COMPARTILHAR
              </button>
              <button onClick={() => { console.log("[btn] voltar ao menu (over)"); setScreen("menu"); }}
                className="w-full py-2 text-sm text-muted-foreground hover:text-white transition">
                ← voltar ao menu
              </button>
            </div>
          </div>
        )}

        {screen === "ranking" && (
          <Panel title="RANKING LOCAL" onBack={() => setScreen("menu")}>
            {stats.ranking.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">Nenhuma run ainda. Bora jogar!</p>
            ) : (
              <ol className="space-y-2">
                {stats.ranking.map((r, i) => (
                  <li key={i} className="flex items-center justify-between bg-bg-deeper rounded-lg px-3 py-2 border border-neon-purple/30">
                    <span className="font-black text-neon-yellow w-6">{i+1}.</span>
                    <span className="text-2xl font-black text-neon-cyan flex-1 text-left ml-2">{r.score}</span>
                    <span className="text-xs text-muted-foreground">nv {r.level}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        )}

        {screen === "how" && (
          <Panel title="COMO JOGAR" onBack={() => setScreen("menu")}>
            <ul className="space-y-3 text-sm text-white">
              <li><strong className="text-neon-cyan">Digite</strong> a palavra/frase mostrada e aperte espaco/enter.</li>
              <li><strong className="text-neon-pink">Combos</strong> aumentam seu multiplicador. Erros zeram tudo.</li>
              <li>Acertos <strong>somam tempo</strong>. Erros <strong>tiram tempo</strong>.</li>
              <li>A cada nivel o jogo fica mais <strong className="text-neon-purple">caotico</strong>: teclado embaralha, teclas somem, tela gira, popups falsos aparecem.</li>
              <li>Faca seu melhor score e compartilhe!</li>
            </ul>
          </Panel>
        )}

        {screen === "achievements" && (
          <Panel title="CONQUISTAS" onBack={() => setScreen("menu")}>
            <ul className="space-y-2">
              {ACHIEVEMENTS.map(a => {
                const got = stats.unlocked.includes(a.id);
                return (
                  <li key={a.id} className={`p-3 rounded-lg border ${got ? "bg-neon-pink/10 border-neon-pink" : "bg-bg-deeper border-neon-purple/30 opacity-60"}`}>
                    <div className={`font-bold ${got ? "text-neon-pink" : "text-white"}`}>{got ? "OK" : "BLOQUEADO"} {a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.desc}</div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}

        {screen === "skins" && (
          <Panel title="SKINS DE TECLADO" onBack={() => setScreen("menu")}>
            <div className="grid grid-cols-2 gap-3">
              {SKINS.map(s => {
                const selected = stats.skin === s.id;
                return (
                  <button key={s.id} onClick={() => { console.log("[btn] skin", s.id); saveStats({ ...stats, skin: s.id }); }}
                    className={`p-4 rounded-xl border-2 transition ${selected ? "border-neon-pink glow-pink" : "border-neon-purple/30"}`}>
                    <div className="text-lg font-black" style={{ color: `var(--${s.primary})` }}>{s.name}</div>
                    <div className="flex gap-1 mt-2 justify-center">
                      <div className="w-4 h-4 rounded-full" style={{ background: `var(--${s.primary})` }} />
                      <div className="w-4 h-4 rounded-full" style={{ background: `var(--${s.accent})` }} />
                    </div>
                    {selected && <div className="text-xs text-neon-yellow mt-2">SELECIONADA</div>}
                  </button>
                );
              })}
            </div>

          </Panel>
        )}
      </div>
    </div>
  );
}

function Panel({ title, children, onBack }: { title: string; children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="max-w-md w-full animate-pop-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { console.log("[btn] Voltar"); onBack(); }} className="text-xs px-3 py-1 rounded-full bg-bg-deeper border border-neon-purple text-neon-purple hover:scale-105 transition">← Voltar</button>
        <h2 className="text-xl font-black text-neon-cyan text-glow-cyan">{title}</h2>
        <div className="w-16" />
      </div>
      <div className="bg-bg-deeper/80 backdrop-blur border-2 border-neon-purple/40 rounded-2xl p-4">
        {children}
      </div>
    </div>
  );
}
