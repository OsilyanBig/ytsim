/** Canvas + Web Audio → video file recorder (MediaRecorder). Browser-only. */

const CANDIDATES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1,opus",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

export function recordingSupported() {
  return typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && typeof HTMLCanvasElement.prototype.captureStream === "function";
}

export function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of CANDIDATES) if (MediaRecorder.isTypeSupported(m)) return m;
  return "";
}

export class Recorder {
  private mr: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stopResolve: ((b: Blob) => void) | null = null;
  mime = "";
  startedAt = 0;

  get recording() {
    return this.mr?.state === "recording";
  }

  start(canvas: HTMLCanvasElement, audio: MediaStream | null, fps = 60, bitrate = 10_000_000) {
    if (this.recording) return;
    const vstream = canvas.captureStream(fps);
    const tracks = [...vstream.getVideoTracks()];
    if (audio) tracks.push(...audio.getAudioTracks());
    const stream = new MediaStream(tracks);
    this.mime = pickMime();
    const opts: MediaRecorderOptions = { videoBitsPerSecond: bitrate, audioBitsPerSecond: 192_000 };
    if (this.mime) opts.mimeType = this.mime;
    const mr = new MediaRecorder(stream, opts);
    this.chunks = [];
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size) this.chunks.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(this.chunks, { type: this.mime || "video/webm" });
      vstream.getTracks().forEach((t) => t.stop());
      this.stopResolve?.(blob);
      this.stopResolve = null;
    };
    mr.start(250);
    this.mr = mr;
    this.startedAt = performance.now();
  }

  stop(): Promise<Blob | null> {
    if (!this.mr || this.mr.state === "inactive") return Promise.resolve(null);
    return new Promise((res) => {
      this.stopResolve = res;
      this.mr!.stop();
    });
  }

  get ext() {
    return this.mime.includes("mp4") ? "mp4" : "webm";
  }
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
