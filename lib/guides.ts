export interface Guide {
  id: string;
  icon: string;
  title: { en: string; tr: string };
  summary: { en: string; tr: string };
  points: { en: string[]; tr: string[] };
}

export const GUIDES: Guide[] = [
  {
    id: "hook",
    icon: "⚡",
    title: { en: "The first 3 seconds", tr: "İlk 3 saniye" },
    summary: { en: "Viewers decide in under 3 s. Promise an outcome immediately.", tr: "İzleyici 3 saniyeden kısa sürede karar verir. Sonucu hemen vaat et." },
    points: {
      en: [
        "Show the goal on screen: \"1 → 1024?\", \"Which color wins?\". Keep the 3s hook text on.",
        "Start with motion already happening — never a static first frame.",
        "Keep the counter big and centered; numbers changing fast = retention.",
        "Use \"Reset before recording\" so every clip starts at the exact hook moment.",
      ],
      tr: [
        "Hedefi ekranda göster: \"1 → 1024?\", \"Hangi renk kazanır?\". 3sn kanca metnini açık tut.",
        "Hareket zaten başlamış olsun — ilk kare asla durağan olmasın.",
        "Sayaç büyük ve ortada olsun; hızla değişen sayılar = izlenme süresi.",
        "Her klibin tam kanca anında başlaması için \"Kayıttan önce sıfırla\"yı kullan.",
      ],
    },
  },
  {
    id: "balance",
    icon: "⚖️",
    title: { en: "Ball count vs. speed", tr: "Top sayısı / hız dengesi" },
    summary: { en: "Too few is boring, too many is noise. Ramp up instead.", tr: "Az top sıkıcı, çok top gürültü. Kademeli artır." },
    points: {
      en: [
        "Start with 1–20 balls and let the machine multiply; growth is the story.",
        "Small balls (4–6 px) read well above ~500; bigger (8–12 px) below 200.",
        "Speed: fast enough to hit a wall every ~0.5 s, slow enough to follow one ball.",
        "Cap at 1000–2000 for smooth 60 FPS on phones and for clean encodes.",
      ],
      tr: [
        "1–20 topla başla, makine çoğaltsın; büyüme hikâyenin kendisi.",
        "Küçük toplar (4–6 px) ~500 üstünde, büyükler (8–12 px) 200 altında iyi görünür.",
        "Hız: her ~0,5 sn'de duvara çarpacak kadar hızlı, tek topu izleyebilecek kadar yavaş.",
        "Telefonda akıcı 60 FPS ve temiz kodlama için 1000–2000'de sınırla.",
      ],
    },
  },
  {
    id: "sound",
    icon: "🎵",
    title: { en: "Sound rhythm", tr: "Ses ritmi" },
    summary: { en: "Sound carries half of the satisfaction. Keep it musical.", tr: "Tatminin yarısı sestir. Müzikal tut." },
    points: {
      en: [
        "Marimba for calm/ASMR, Pop for splits, Tick for dense piles, Synth for energy.",
        "Pitches use a pentatonic scale — any combination sounds pleasant.",
        "Lower the volume as ball count explodes; the engine also thins dense hits.",
        "Big events (flips, waves, breaks) get a boom/chime — your edit points.",
      ],
      tr: [
        "Sakin/ASMR için Marimba, bölünme için Pop, yoğun yığın için Tick, enerji için Synth.",
        "Notalar pentatonik dizide — her kombinasyon kulağa hoş gelir.",
        "Top sayısı patladıkça sesi kıs; motor yoğun çarpışmaları zaten seyreltir.",
        "Büyük olaylar (dönüş, dalga, kırılma) boom/chime alır — kurgu noktaların bunlar.",
      ],
    },
  },
  {
    id: "length",
    icon: "⏱️",
    title: { en: "Recording length", tr: "Kayıt süresi" },
    summary: { en: "15–30 s wins. End on the payoff and loop.", tr: "15–30 sn kazanır. Doruk noktasında bitir ve döngüye sok." },
    points: {
      en: [
        "15 s for one clear event, 30 s for a build-up, 45 s only with multiple twists.",
        "Use Auto record → Until target to stop exactly at the payoff.",
        "Cut right after the climax — a seamless loop boosts replays.",
        "Export 1080×1920 for upload; 720×1280 is lighter for quick drafts.",
      ],
      tr: [
        "Tek net olay için 15 sn, birikim için 30 sn, 45 sn yalnızca birden çok sürprizle.",
        "Tam doruk anında durdurmak için Otomatik kayıt → Hedefe kadar kullan.",
        "Doruktan hemen sonra kes — kesintisiz döngü tekrar izlenmeyi artırır.",
        "Yükleme için 1080×1920, hızlı taslak için 720×1280 kullan.",
      ],
    },
  },
  {
    id: "color",
    icon: "🎨",
    title: { en: "Color & contrast", tr: "Renk & kontrast" },
    summary: { en: "Dark background, saturated balls, one accent.", tr: "Koyu zemin, doygun toplar, tek vurgu rengi." },
    points: {
      en: [
        "Dark backgrounds make neon balls pop and compress better.",
        "Color races need maximally different hues (red, blue, yellow, green).",
        "Change color on events (split, gate) so the eye can track cause → effect.",
        "Keep text outside the arena; platforms overlay UI at top and bottom.",
      ],
      tr: [
        "Koyu zemin neon topları öne çıkarır ve daha iyi sıkıştırılır.",
        "Renk yarışlarında birbirinden en farklı tonları seç (kırmızı, mavi, sarı, yeşil).",
        "Olaylarda (bölünme, kapı) rengi değiştir ki göz neden → sonucu takip etsin.",
        "Yazıları arena dışında tut; platformlar üst ve alta arayüz bindirir.",
      ],
    },
  },
  {
    id: "engage",
    icon: "💬",
    title: { en: "Engagement tricks", tr: "Etkileşim taktikleri" },
    summary: { en: "Give viewers a reason to comment and rewatch.", tr: "İzleyiciye yorum yapması ve tekrar izlemesi için sebep ver." },
    points: {
      en: [
        "\"Pick a color\" races drive comments — ask in the caption.",
        "Post series: same machine, one parameter changed (\"Part 2: 6 arms\").",
        "Chaos Mix seeds make unique variations for daily uploads.",
        "Tap interactions mid-clip add surprise; time them to the beat.",
      ],
      tr: [
        "\"Bir renk seç\" yarışları yorum getirir — açıklamada sor.",
        "Seri paylaş: aynı makine, tek parametre değişik (\"Bölüm 2: 6 kol\").",
        "Kaos Mix tohumları günlük paylaşımlar için benzersiz varyasyonlar üretir.",
        "Klip ortasında dokunma etkileşimleri sürpriz katar; ritme denk getir.",
      ],
    },
  },
];
