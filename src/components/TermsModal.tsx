import { useEffect, useState } from "react";

export function TermsModal() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("dmr_terms_accepted")) setOpen(true);
  }, []);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-bg-deeper border-2 border-neon-cyan rounded-2xl p-6 glow-cyan animate-pop-in">
        <h2 className="text-2xl font-black text-neon-cyan text-glow-cyan mb-3">TERMOS DE USO</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Ao continuar, voce concorda em jogar <strong className="text-neon-pink">DIGITE MAIS RAPIDO</strong> por sua conta e risco.
          Este jogo pode causar <strong>raiva</strong>, <strong>frustracao</strong> e <strong>vicio</strong>.
        </p>
        <p className="text-xs text-muted-foreground mb-5">
          O jogo pode exibir anuncios. Recordes sao salvos localmente no seu navegador. Nao nos responsabilizamos por teclados quebrados.
        </p>
        <button
          onClick={() => { localStorage.setItem("dmr_terms_accepted","1"); setOpen(false); }}
          className="w-full py-3 rounded-xl bg-neon-pink text-black font-black text-lg glow-pink hover:scale-105 transition-transform"
        >
          ACEITAR E CONTINUAR
        </button>
      </div>
    </div>
  );
}
