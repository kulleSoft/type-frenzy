export const WORDS = [
  "rapido","caos","neon","viral","bug","cerebro","impossivel","combo","fogo","nivel",
  "teclado","pressao","mente","foco","reflexo","glitch","trauma","pixel","onda","sonho",
  "digite","palavra","tempo","score","insano","loucura","panico","gamer","streamer","meme",
  "brasil","forca","velocidade","precisao","ataque","defesa","arena","boss","skill","epico",
  "magia","portal","sombra","luz","fenix","dragao","ninja","pirata","robo","alien",
  "musica","ritmo","danca","festa","noite","luzes","cidade","futuro","ciber","punk"
];

export const PHRASES = [
  "voce nao vai conseguir",
  "rapido demais para voce",
  "errar e humano",
  "isso e o caos puro",
  "mente bugada total",
  "respira e digita",
  "ninguem passa daqui",
  "modo deus ativado",
  "sem pressao certo",
  "voce e o escolhido"
];

export const TAUNTS = [
  "1% consegue passar daqui",
  "Seu cerebro bugou?",
  "Impossivel jogar sem errar",
  "Tente de novo, lentao",
  "Achou que era facil?",
  "Voce digita igual avo",
  "Acelera ai campeao",
  "Hahaha boa tentativa",
  "Quase! (mentira)",
  "Voce foi destruido"
];

export const ACHIEVEMENTS = [
  { id: "first", name: "Primeiro Sangue", desc: "Acerte sua primeira palavra", check: (s: any) => s.totalWords >= 1 },
  { id: "combo10", name: "Combo Insano", desc: "Faca 10x combo", check: (s: any) => s.maxCombo >= 10 },
  { id: "combo25", name: "Mente de Aco", desc: "Faca 25x combo", check: (s: any) => s.maxCombo >= 25 },
  { id: "score500", name: "Veterano", desc: "500 pontos em uma run", check: (s: any) => s.bestScore >= 500 },
  { id: "score2000", name: "Lenda Viva", desc: "2000 pontos em uma run", check: (s: any) => s.bestScore >= 2000 },
  { id: "level10", name: "Cerebro Bugado", desc: "Chegue no nivel 10", check: (s: any) => s.maxLevel >= 10 },
  { id: "level20", name: "1% dos Players", desc: "Chegue no nivel 20", check: (s: any) => s.maxLevel >= 20 },
];

export const SKINS = [
  { id: "cyber", name: "Cyber", primary: "neon-cyan", accent: "neon-pink" },
  { id: "vapor", name: "Vapor", primary: "neon-purple", accent: "neon-pink" },
  { id: "toxic", name: "Toxico", primary: "neon-green", accent: "neon-yellow" },
  { id: "sunset", name: "Sunset", primary: "neon-pink", accent: "neon-yellow" },
];

export const EMOJIS = ["🔥","💀","😱","🤯","💥","⚡","🚀","👾","🎮","💣","😈","🤡","👻","💯","🌀","✨"];
