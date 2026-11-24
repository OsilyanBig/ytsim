import type { Params } from "./engine/types";

export interface Preset {
  id: string;
  machine: string;
  title: { en: string; tr: string };
  desc: { en: string; tr: string };
  tag: string;
  params: Params;
  seed?: number;
}

export const PRESETS: Preset[] = [
  { id: "classic-1024", machine: "bounce-double", tag: "VIRAL", title: { en: "Classic 1 → 1024", tr: "Klasik 1 → 1024" }, desc: { en: "The original doubling run. ~25 s to target.", tr: "Orijinal katlanma. Hedefe ~25 sn." }, params: { gravity: 700, speed: 520, size: 6, target: 1024 } },
  { id: "zero-g-doubling", machine: "bounce-double", tag: "FAST", title: { en: "Zero-G Doubling", tr: "Yerçekimsiz Katlanma" }, desc: { en: "No gravity, faster balls, 2048 target.", tr: "Yerçekimi yok, hızlı toplar, hedef 2048." }, params: { gravity: 0, speed: 700, size: 4, target: 2048 } },
  { id: "neon-split", machine: "wall-hit-split", tag: "ASMR", title: { en: "Neon Split Storm", tr: "Neon Bölünme Fırtınası" }, desc: { en: "Wide split angle, small balls.", tr: "Geniş bölünme açısı, küçük toplar." }, params: { speed: 420, size: 5, cap: 800, spread: 0.9 } },
  { id: "clone-factory", machine: "spinner-clone", tag: "SATISFYING", title: { en: "Clone Factory", tr: "Klon Fabrikası" }, desc: { en: "Fast bar, high cap.", tr: "Hızlı çubuk, yüksek limit." }, params: { gravity: 600, spin: 3.4, size: 6, cap: 1000 } },
  { id: "mega-burst", machine: "timer-burst", tag: "CHAOS", title: { en: "Mega Burst", tr: "Mega Patlama" }, desc: { en: "Big waves every second.", tr: "Her saniye büyük dalgalar." }, params: { gravity: 400, interval: 1, wave: 40, size: 6, cap: 900 } },
  { id: "tiny-split", machine: "size-decay-split", tag: "ASMR", title: { en: "Down to Dust", tr: "Toz Olana Kadar" }, desc: { en: "Giant ball shatters into hundreds.", tr: "Dev top yüzlerce parçaya ayrılır." }, params: { gravity: 300, startR: 70, shrink: 0.8, boost: 1.06, cap: 1200 } },
  { id: "flip-2048", machine: "gravity-flip-duplicator", tag: "VIRAL", title: { en: "Flip to 2048", tr: "Dönerek 2048" }, desc: { en: "Gravity flips every 1.5 s.", tr: "Yerçekimi her 1,5 sn döner." }, params: { gravity: 1000, interval: 1.5, size: 4, cap: 2048 } },
  { id: "gate-rush", machine: "gate-multiplier", tag: "SATISFYING", title: { en: "Gate Rush", tr: "Kapı Akını" }, desc: { en: "Fast drops through moving gates.", tr: "Hareketli kapılardan hızlı akış." }, params: { gravity: 900, rate: 8, gateSpeed: 200, size: 5, cap: 1200 } },
  { id: "rainbow-chain", machine: "color-chain-clone", tag: "ASMR", title: { en: "Rainbow Chain", tr: "Gökkuşağı Zinciri" }, desc: { en: "Six colors breeding.", tr: "Altı renk çoğalıyor." }, params: { speed: 260, size: 7, colors: 6, cap: 800 } },
  { id: "triangle-boost", machine: "corner-ricochet-boost", tag: "FAST", title: { en: "Triangle Ricochet", tr: "Üçgen Seken" }, desc: { en: "Spinning triangle with sharp corners.", tr: "Keskin köşeli dönen üçgen." }, params: { sides: 3, spin: 0.8, gravity: 0, size: 5, cap: 1000 } },
  { id: "frenzy-1000", machine: "target-cap-frenzy", tag: "CHAOS", title: { en: "Frenzy 1000", tr: "Çılgınlık 1000" }, desc: { en: "Double to 1000, then everything spills.", tr: "1000'e kadar katla, sonra her şey taşar." }, params: { threshold: 1000, gravity: 600, speed: 550, size: 4 } },
  { id: "sweeper", machine: "single-spinner-sweep", tag: "SATISFYING", title: { en: "The Sweeper", tr: "Süpürücü" }, desc: { en: "400 balls, one slow bar.", tr: "400 top, tek yavaş çubuk." }, params: { count: 400, spin: 1, gravity: 900, size: 6 } },
  { id: "hex-blade", machine: "triple-blade-vortex", tag: "ASMR", title: { en: "Hex Blade", tr: "Altı Kollu Pervane" }, desc: { en: "Six arms, reverse spin.", tr: "Altı kol, ters dönüş." }, params: { count: 350, spin: 2.6, arms: 6, gravity: 700, size: 6 } },
  { id: "ring-escape", machine: "counter-rotating-rings", tag: "VIRAL", title: { en: "Ring Escape", tr: "Halka Kaçışı" }, desc: { en: "Five counter-rotating rings, tiny gaps.", tr: "Beş ters dönen halka, dar boşluklar." }, params: { rings: 5, gap: 0.35, spin: 1.1, rate: 8, size: 5 } },
  { id: "wrecking-ball", machine: "pendulum-crusher", tag: "SATISFYING", title: { en: "Wrecking Ball", tr: "Yıkım Topu" }, desc: { en: "Huge bob, wide swing.", tr: "Dev ağırlık, geniş salınım." }, params: { count: 350, amp: 1.2, freq: 0.9, bob: 70, gravity: 1100, size: 6 } },
  { id: "pinball-party", machine: "pinball-bumper-field", tag: "FAST", title: { en: "Pinball Party", tr: "Pinball Partisi" }, desc: { en: "100 balls, strong kicks.", tr: "100 top, güçlü itiş." }, params: { count: 100, boost: 400, gravity: 900, size: 6 } },
  { id: "one-way-sort", machine: "one-way-flap-gate", tag: "SATISFYING", title: { en: "One-Way Sort", tr: "Tek Yön Ayrıştırma" }, desc: { en: "Watch every ball switch sides.", tr: "Her topun taraf değiştirmesini izle." }, params: { count: 300, flaps: 4, flapH: 36, gravity: 0, size: 6 } },
  { id: "heartbeat", machine: "expanding-core", tag: "ASMR", title: { en: "Heartbeat Core", tr: "Kalp Atışı Çekirdeği" }, desc: { en: "Fast pulse, packed arena.", tr: "Hızlı nabız, dolu arena." }, params: { count: 450, min: 20, max: 180, freq: 0.8, size: 6 } },
  { id: "battle-royale", machine: "color-battle-arena", tag: "VIRAL", title: { en: "Battle Royale", tr: "Battle Royale" }, desc: { en: "6 teams, 25 balls each.", tr: "6 takım, takım başı 25 top." }, params: { teams: 6, per: 25, hp: 3, speed: 280, size: 8 } },
  { id: "pick-a-color", machine: "last-color-standing", tag: "VIRAL", title: { en: "Pick a Color", tr: "Bir Renk Seç" }, desc: { en: "Comment your color before the end!", tr: "Bitmeden rengini yorumlara yaz!" }, params: { colors: 6, per: 40, speed: 260, size: 7 } },
  { id: "pressure-cooker", machine: "overflow-pressure", tag: "SATISFYING", title: { en: "Pressure Cooker", tr: "Düdüklü Tencere" }, desc: { en: "Fast pour, narrow mouth.", tr: "Hızlı dökme, dar ağız." }, params: { rate: 45, mouth: 0.3, gravity: 900, size: 8 } },
  { id: "grinder", machine: "shredder-drain", tag: "ASMR", title: { en: "The Grinder", tr: "Öğütücü" }, desc: { en: "600 balls, narrow drain.", tr: "600 top, dar delik." }, params: { count: 600, hole: 0.18, gravity: 900, size: 6 } },
  { id: "galaxy-drain", machine: "spiral-funnel", tag: "ASMR", title: { en: "Galaxy Drain", tr: "Galaksi Girdabı" }, desc: { en: "Four arms, strong swirl.", tr: "Dört kol, güçlü girdap." }, params: { count: 350, pull: 1100, swirl: 500, arms: 4, size: 5 } },
  { id: "jailbreak", machine: "cage-break", tag: "VIRAL", title: { en: "Jailbreak", tr: "Firar" }, desc: { en: "48 bricks, 6 HP each.", tr: "48 tuğla, her biri 6 can." }, params: { bricks: 48, hp: 6, gravity: 600, speed: 650, size: 7 } },
  { id: "dream-float", machine: "zero-g-float", tag: "ASMR", title: { en: "Dream Float", tr: "Rüya Süzülüşü" }, desc: { en: "Long trails, slow drift.", tr: "Uzun izler, yavaş süzülme." }, params: { count: 120, speed: 80, trail: 0.6, maxR: 22 } },
  { id: "planet-forge", machine: "orbit-gravity-well", tag: "ASMR", title: { en: "Planet Forge", tr: "Gezegen Ocağı" }, desc: { en: "300 orbits with long trails.", tr: "Uzun izli 300 yörünge." }, params: { count: 300, mass: 3, trail: 0.9, ecc: 0.25, size: 3 } },
  { id: "earthquake", machine: "click-shockwave", tag: "CHAOS", title: { en: "Earthquake", tr: "Deprem" }, desc: { en: "Auto blasts every 1.5 s.", tr: "Her 1,5 sn otomatik patlama." }, params: { count: 600, power: 1600, radius: 300, auto: 1.5, gravity: 900, size: 6 } },
  { id: "storm", machine: "wind-breeze-stream", tag: "CHAOS", title: { en: "Storm", tr: "Fırtına" }, desc: { en: "Strong shifting wind with updrafts.", tr: "Güçlü değişken rüzgar ve yukarı esintiler." }, params: { count: 450, wind: 2200, freq: 0.5, gust: 3200, gravity: 800, size: 5 } },
  { id: "chaos-roulette", machine: "chaos-mix", tag: "CHAOS", title: { en: "Chaos Roulette", tr: "Kaos Ruleti" }, desc: { en: "New random scenario every 8 s.", tr: "Her 8 sn yeni rastgele senaryo." }, params: { reroll: 8, size: 7 } },
];

export function getPreset(id: string | null | undefined) {
  return PRESETS.find((p) => p.id === id);
}
