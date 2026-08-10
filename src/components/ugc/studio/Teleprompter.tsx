import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Download, Play, Square, X, Repeat } from 'lucide-react';

interface TeleprompterProps { open: boolean; content: string; title: string; onClose: () => void }

const COUNTDOWN = 3;

/** Full-screen canvas teleprompter with speed control, countdown and MediaRecorder export. */
export function Teleprompter({ open, content, title, onClose }: TeleprompterProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [count, setCount] = useState<number | null>(COUNTDOWN);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(60);
  const [fontSize, setFontSize] = useState(30);
  const [mirror, setMirror] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordUrl, setRecordUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setCount(COUNTDOWN); setRunning(false); setRecordUrl(null); offsetRef.current = 0;
    const t = window.setInterval(() => {
      setCount((c) => {
        if (c === null) return c;
        if (c <= 1) { window.clearInterval(t); window.setTimeout(() => setCount(null), 80); return null; }
        return c - 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(t);
      if (recorderRef.current) { recorderRef.current.stop(); recorderRef.current = null; setRecording(false); }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      offsetRef.current = 0;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const lines = wrapText(ctx, content, canvas.clientWidth - 60, fontSize);
    ctx.font = `600 ${fontSize}px Fredoka, Nunito, sans-serif`;
    const lineH = fontSize * 1.55;
    const total = lines.length * lineH;
    let last = performance.now();
    const loop = (now: number): void => {
      const dt = now - last;
      last = now;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#16131d';
      ctx.fillRect(0, 0, w, h);
      if (running && count === null) {
        offsetRef.current += speed * (dt / 1000);
        if (offsetRef.current >= total + h * 0.5) { offsetRef.current = total + h * 0.5; setRunning(false); }
      }
      ctx.save();
      if (mirror) { ctx.translate(w, 0); ctx.scale(-1, 1); }
      ctx.fillStyle = '#fff';
      ctx.font = `600 ${fontSize}px Fredoka, Nunito, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const top = h * 0.45 - offsetRef.current;
      lines.forEach((line, i) => {
        const ly = top + i * lineH;
        if (ly > -lineH && ly < h) ctx.fillText(line, w / 2, ly);
      });
      ctx.restore();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [open, running, count, speed, fontSize, mirror, content]);

  const toggleRecord = (): void => {
    if (recorderRef.current) { recorderRef.current.stop(); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRecordUrl(null);
    const stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4' });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' });
      setRecordUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
      setRecording(false);
      recorderRef.current = null;
      stream.getTracks().forEach((t) => t.stop());
    };
    rec.start();
    recorderRef.current = rec;
    setRecording(true);
  };

  if (!open) return <></>;

  return <div className="teleprompter">
    <div className="tp-toolbar">
      <button className="icon-btn" onClick={onClose} aria-label="Close teleprompter" style={{ color: '#fff', background: 'rgba(255,255,255,.15)' }}><X size={18}/></button>
      <strong style={{ fontSize: 13 }}>{title}</strong>
      <span className="spacer"/>
      <button className={`btn small ${mirror ? 'primary' : 'ghost'}`} onClick={() => setMirror((m) => !m)}><Repeat size={13}/> Mirror</button>
      <button className={`btn small ${recording ? 'danger' : 'primary'}`} onClick={toggleRecord}>{recording ? <Square size={13}/> : <span className="tp-rec-dot"/>}{recording ? 'Stop' : 'Record'}</button>
      {recordUrl && <a className="btn small soft" href={recordUrl} download={`teleprompter-${Date.now()}.webm`}><Download size={13}/> Save video</a>}
    </div>
    <div className="tp-body">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }}/>
      {count !== null && <div className="tp-countdown">{count === 0 ? 'Go!' : count}</div>}
    </div>
    <div className="tp-controls">
      <span className="tp-meter">Speed · {speed} px/s</span>
      <input type="range" min={20} max={220} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Scroll speed"/>
      <span className="tp-meter">Font · {fontSize}px</span>
      <input type="range" min={18} max={64} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} aria-label="Font size"/>
      <span className="tp-meter">~{Math.round(content.split(/\s+/).filter(Boolean).length / 140)} min at 140 wpm</span>
      <button className={`btn small ${running ? 'ghost' : 'primary'}`} onClick={() => { if (count === null) setRunning((r) => !r); }} >{running ? <Square size={13}/> : <Play size={13}/>} {running ? 'Pause' : 'Play'}</button>
    </div>
  </div>;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
  ctx.font = `600 ${fontSize}px Fredoka, Nunito, sans-serif`;
  const lines: string[] = [];
  for (const raw of text.split('\n')) {
    const words = raw.length > 0 ? raw.split(/\s+/) : [''];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
    }
    if (line) lines.push(line);
  }
  return lines.length > 0 ? lines : [''];
}