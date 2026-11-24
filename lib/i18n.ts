import type { Lang } from "./engine/types";

export const DICT = {
  studio: { en: "Studio", tr: "Stüdyo" },
  gallery: { en: "Gallery", tr: "Galeri" },
  guides: { en: "Guides", tr: "Rehberler" },
  machines: { en: "Machines", tr: "Makineler" },
  play: { en: "Play", tr: "Oynat" },
  pause: { en: "Pause", tr: "Duraklat" },
  reset: { en: "Reset", tr: "Sıfırla" },
  controls: { en: "Controls", tr: "Kontroller" },
  hideUi: { en: "Clean mode", tr: "Sade mod" },
  showUi: { en: "Show UI", tr: "Arayüzü göster" },
  params: { en: "Parameters", tr: "Parametreler" },
  simSpeed: { en: "Sim speed", tr: "Simülasyon hızı" },
  sound: { en: "Sound", tr: "Ses" },
  volume: { en: "Volume", tr: "Seviye" },
  style: { en: "Sound style", tr: "Ses stili" },
  record: { en: "Record", tr: "Kayıt" },
  start: { en: "Start", tr: "Başlat" },
  stop: { en: "Stop & save", tr: "Durdur & kaydet" },
  autoRecord: { en: "Auto record", tr: "Otomatik kayıt" },
  duration: { en: "Duration", tr: "Süre" },
  untilTarget: { en: "Until target", tr: "Hedefe kadar" },
  resetOnRec: { en: "Reset before recording", tr: "Kayıttan önce sıfırla" },
  quality: { en: "Quality", tr: "Kalite" },
  hud: { en: "Counters (HUD)", tr: "Sayaçlar (HUD)" },
  hook: { en: "3s hook text", tr: "3sn kanca metni" },
  notSupported: { en: "Recording is not supported in this browser.", tr: "Bu tarayıcı kaydı desteklemiyor." },
  tips: {
    en: "↑/↓ or swipe: switch · Tap: interact · Space: pause · R: reset · H: clean mode · M: mute",
    tr: "↑/↓ veya kaydır: geçiş · Dokun: etkileşim · Boşluk: duraklat · R: sıfırla · H: sade mod · M: sessiz",
  },
  loadPreset: { en: "Load in studio", tr: "Stüdyoda aç" },
  galleryTitle: { en: "Preset gallery", tr: "Hazır ayar galerisi" },
  gallerySub: {
    en: "One click loads the machine with tuned settings — ready to record.",
    tr: "Tek tıkla makine ayarlarıyla yüklenir — kayda hazır.",
  },
  guidesTitle: { en: "Shorts playbook", tr: "Shorts rehberi" },
  guidesSub: {
    en: "Short, practical rules for physics simulations that hold attention.",
    tr: "Dikkat çeken fizik simülasyonları için kısa ve pratik kurallar.",
  },
  all: { en: "All", tr: "Tümü" },
  random: { en: "Random", tr: "Rastgele" },
  search: { en: "Search machines…", tr: "Makine ara…" },
  recording: { en: "Recording", tr: "Kaydediliyor" },
  saved: { en: "Video saved", tr: "Video kaydedildi" },
  fps: { en: "FPS", tr: "FPS" },
  balls: { en: "balls", tr: "top" },
  enableAudio: { en: "Tap to enable sound", tr: "Sesi açmak için dokun" },
} as const;

export type DictKey = keyof typeof DICT;

export function translate(lang: Lang, key: DictKey) {
  return DICT[key][lang];
}
