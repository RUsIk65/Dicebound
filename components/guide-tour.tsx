'use client';

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles, X, Volume2, VolumeX, RotateCcw, Play } from 'lucide-react';
import './guide-tour.css';
import { getGuideSteps } from '@/lib/guide-content';
import { useFinnVoice } from '@/hooks/use-finn-voice';

type Rect = { x: number; y: number; width: number; height: number };
type Layout = { viewport: { width: number; height: number }; target: Rect | null; left: number; top: number; mirror: boolean; connector: { x1: number; y1: number; x2: number; y2: number } | null };


function Finn() {
  const id = useId().replace(/:/g, '');
  return <svg className="guide-wizard" viewBox="0 0 220 310" role="img" aria-label="Финн — добродушный волшебник с посохом">
    <defs>
      <linearGradient id={`${id}-robe`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#782f42"/><stop offset="1" stopColor="#38131d"/></linearGradient>
      <linearGradient id={`${id}-hat`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#965266"/><stop offset="1" stopColor="#4b1d2e"/></linearGradient>
      <linearGradient id={`${id}-beard`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f5e8c9"/><stop offset="1" stopColor="#c3b48e"/></linearGradient>
      <radialGradient id={`${id}-magic`}><stop stopColor="#ecc6c0" stopOpacity=".6"/><stop offset="1" stopColor="#b6758e" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse className="guide-wizard-shadow" cx="103" cy="292" rx="69" ry="11" fill="#060e09" opacity=".35"/>
    <g className="guide-wizard-body" strokeLinecap="round" strokeLinejoin="round">
      <path d="M65 269 61 289Q78 301 98 288L97 271M112 271 115 290Q138 299 153 287L140 268" fill="#4b392b" stroke="#29291f" strokeWidth="3"/>
      <path d="M67 162Q47 190 43 268Q90 292 161 271L141 173Z" fill={`url(#${id}-robe)`} stroke="#26121c" strokeWidth="3"/>
      <path d="M89 190 81 277M126 194 141 278" fill="none" stroke="#91a084" strokeOpacity=".35" strokeWidth="3"/>
      <path d="M46 262Q99 280 157 265" fill="none" stroke="#d3b67c" strokeWidth="4"/>
      <path d="M63 222Q103 233 149 220L150 232Q102 246 58 232Z" fill="#70543b" stroke="#303626" strokeWidth="2"/>
      <rect x="97" y="226" width="19" height="14" rx="3" fill="#c5a567" stroke="#e6ca8b" strokeWidth="2"/>
      <path d="M104 230v6h5v-6" fill="#4a4b31"/>
      <path d="M135 235q10-4 16 0l5 23q-13 12-24-1Z" fill="#8b6642" stroke="#463f2a" strokeWidth="2"/>
      <path d="M137 238h12" stroke="#c29b66" strokeWidth="2"/>
      <path d="M65 168Q42 177 36 209L56 219 83 185" fill="#662f41" stroke="#2d1b24" strokeWidth="3"/>
      <path d="M37 206 52 207 55 220 37 220Z" fill="#c5ac71"/>
      <g className="guide-wave">
        <path d="M137 170Q156 176 168 153L182 161Q174 202 150 210L127 184" fill="#753345" stroke="#2d1b24" strokeWidth="3"/>
        <path d="m165 154 15 10 6-12-16-9Z" fill="#d6bd82" stroke="#897d52" strokeWidth="2"/>
        <path d="M170 146q-9-4-11-11-1-5 4-4l7 5-2-19q0-8 5-5l4 16 1-22q3-5 6 0l1 22 5-18q4-3 5 2l-3 21 6-11q5-2 5 3l-9 21-11 9Z" fill="#e4bb8a" stroke="#986b4a" strokeWidth="2"/>
        <path d="m179 134 7 4-7 7" fill="none" stroke="#b9855e" strokeWidth="2"/>
      </g>
      <path d="M53 135Q38 122 44 113q8-6 17 6M138 119q12-11 18-2 3 12-12 20" fill="#d7ad7a" stroke="#986b4a" strokeWidth="2"/>
      <path d="M57 108Q60 79 100 77q42 1 45 36l-3 37q-9 35-45 36-37-9-43-37Z" fill="#e6bd8e" stroke="#a47b53" strokeWidth="2"/>
      <path d="M56 131q-9 40 15 59l29 30 28-25q25-24 17-65l-14 20-31 5-32-8Z" fill={`url(#${id}-beard)`} stroke="#bbab83" strokeWidth="2"/>
      <path d="M65 150q-3 19 18 39m47-34q0 17-19 36m-14-20 4 34" fill="none" stroke="#aa9a72" strokeWidth="2" opacity=".6"/>
      <ellipse cx="68" cy="133" rx="9" ry="6" fill="#d99c79" opacity=".7"/><ellipse cx="130" cy="133" rx="9" ry="6" fill="#d99c79" opacity=".7"/>
      <g className="guide-eyes"><ellipse cx="77" cy="120" rx="4" ry="5" fill="#28382c"/><ellipse cx="121" cy="120" rx="4" ry="5" fill="#28382c"/><circle cx="78" cy="118" r="1.3" fill="#fff4d2"/><circle cx="122" cy="118" r="1.3" fill="#fff4d2"/></g>
      <path d="M66 109q11-7 21 0M110 109q10-7 20-1" stroke="#e8ddbc" strokeWidth="6" fill="none"/>
      <path d="M96 121q-8 12-2 16 8 4 13-2" fill="#eac599" stroke="#bd8a5d" strokeWidth="2"/>
      <path className="guide-mouth" d="M88 147q11 12 23-1" fill="#7a4a36" stroke="#966448" strokeWidth="2"/>
      <path d="M99 139Q82 132 70 148q13 5 29-5 16 11 30 4-17-16-30-8Z" fill="#f5e7c7"/>
      <path d="M48 99Q55 68 77 33q17-29 41-22 13 4 20 17-17-3-26 9l30 62Z" fill={`url(#${id}-hat)`} stroke="#2a1820" strokeWidth="3"/>
      <path d="M58 80q39-10 75 2l9 18q-49-14-94 1Z" fill="#b59b66"/>
      <path d="M42 95Q97 78 147 96q21 9 2 16-55-13-103 1-25-5-4-18Z" fill="#743849" stroke="#2a1820" strokeWidth="3"/>
      <path d="m94 44 3 9 10 2-9 5 1 10-8-7-9 4 4-10-6-7 10 1Z" fill="#d7c38b"/>
      <path d="m119 22 3 5 5 1-4 3-1 5-3-4-5-1 4-3Z" fill="#e2cb8c"/>
      <path d="M34 93q-12 80-9 191" fill="none" stroke="#503a28" strokeWidth="10"/><path d="M32 94q-9 77-7 185" fill="none" stroke="#9d7f50" strokeWidth="4"/>
      <path d="M34 103q-25-13-15-37 14-17 29 0 9 17-14 37Z" fill="#682e45" stroke="#b7a76c" strokeWidth="3"/>
      <circle className="guide-magic-glow" cx="33" cy="76" r="36" fill={`url(#${id}-magic)`}/>
      <path d="m33 54 13 21-15 19-12-20Z" fill="#e7b1b2" stroke="#e7eec7" strokeWidth="2"/><path d="m33 54-2 40 15-19Z" fill="#b25d7d" opacity=".65"/>
      <path d="M32 207q14-7 14 3-6 5-14 4m0 0q14-5 13 4-7 5-14 2" fill="#dfb786" stroke="#a17b52" strokeWidth="2"/>
      <path d="m68 252 3 5 6 1-5 4 1 5-5-3-5 2 2-6-4-3 5-1Z" fill="#a8b18b" opacity=".65"/>
    </g>
    <g className="guide-magic-sparks" fill="#e5d39a"><path d="m13 41 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/><path d="m59 46 2 4 4 2-4 1-2 4-1-4-4-1 4-2Z"/><circle cx="12" cy="104" r="2"/><circle cx="54" cy="27" r="2"/></g>
  </svg>;
}

export function GuideTour({ mode, isHost, onClose, onStepChange }: { mode: 'tavern' | 'tabletop'; isHost: boolean; onClose: () => void; onStepChange?: (index: number) => void }) {
  const steps = useMemo(() => getGuideSteps(mode, isHost), [mode, isHost]);
  const [index, setIndex] = useState(0);
  const [layout, setLayout] = useState<Layout | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const companion = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const mask = `guide-mask-${useId().replace(/:/g, '')}`;
  const step = steps[index];
  const last = index === steps.length - 1;
  const voice = useFinnVoice(step.audioSrc);
  const voiceLabel = !voice.enabled ? 'Звук выключен' : voice.status === 'speaking' ? 'Финн говорит…' : voice.status === 'loading' ? 'Готовлю реплику…' : voice.status === 'finished' ? 'Реплика закончилась' : voice.status === 'blocked' ? 'Нажмите «Озвучить»' : 'Не удалось воспроизвести';

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const originalScroll = { left: window.scrollX, top: window.scrollY };
    const element = dialog.current;
    element?.showModal();
    heading.current?.focus({ preventScroll: true });
    return () => {
      element?.close();
      window.scrollTo({ ...originalScroll, behavior: 'auto' });
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const element = step.target ? document.querySelector<HTMLElement>(step.target) : null;
    // Background content remains visible but cannot be activated during the tour.
    if (element) {
      const wide = element.getBoundingClientRect().width > window.innerWidth * .5;
      element.scrollIntoView({ block: wide ? 'start' : 'center', inline: 'nearest', behavior: 'auto' });
      if (wide) window.scrollBy({ top: -24, behavior: 'auto' });
    }
    heading.current?.focus({ preventScroll: true });
    let frame = 0;
    const measure = () => {
      const width = window.innerWidth, height = window.innerHeight;
      const margin = width < 700 ? 12 : 24;
      const panel = companion.current?.getBoundingClientRect();
      if (!panel) return;
      const targetElement = step.target ? document.querySelector<HTMLElement>(step.target) : null;
      const box = targetElement?.getBoundingClientRect();
      const target = box && box.width > 0 && box.height > 0 ? {
        x: Math.max(4, box.left - 7), y: Math.max(4, box.top - 7),
        width: Math.max(0, Math.min(width - 4, box.right + 7) - Math.max(4, box.left - 7)),
        height: Math.max(0, Math.min(height - 4, box.bottom + 7) - Math.max(4, box.top - 7)),
      } : null;
      const right = Math.max(margin, width - panel.width - margin);
      const bottom = Math.max(margin, height - panel.height - margin);
      const clampX = (x: number) => Math.min(right, Math.max(margin, x));
      const clampY = (y: number) => Math.min(bottom, Math.max(margin, y));
      const gap = 18;
      // Prefer the space immediately beside the highlighted control, never a fixed corner.
      const candidates = target ? [
        { left: target.x + target.width + gap, top: target.y + target.height / 2 - panel.height / 2, mirror: false },
        { left: target.x - panel.width - gap, top: target.y + target.height / 2 - panel.height / 2, mirror: true },
        { left: target.x + target.width / 2 - panel.width / 2, top: target.y + target.height + gap, mirror: target.x + target.width / 2 > width / 2 },
        { left: target.x + target.width / 2 - panel.width / 2, top: target.y - panel.height - gap, mirror: target.x + target.width / 2 > width / 2 },
      ] : [{ left: right, top: bottom, mirror: false }];
      const positions = candidates.map(position => ({ ...position, left: clampX(position.left), top: clampY(position.top), displacement: Math.abs(clampX(position.left) - position.left) + Math.abs(clampY(position.top) - position.top) }));
      const score = (position: typeof positions[number]) => {
        const overlap = target ? Math.max(0, Math.min(position.left + panel.width, target.x + target.width + 8) - Math.max(position.left, target.x - 8)) * Math.max(0, Math.min(position.top + panel.height, target.y + target.height + 8) - Math.max(position.top, target.y - 8)) : 0;
        return overlap * 100 + position.displacement;
      };
      const best = positions.reduce((best, position) => score(position) < score(best) ? position : best, positions[0]);
      let connector: Layout['connector'] = null;
      if (target) {
        const cx = target.x + target.width / 2, cy = target.y + target.height / 2;
        const withinX = Math.max(best.left + 20, Math.min(best.left + panel.width - 20, cx));
        const withinY = Math.max(best.top + 20, Math.min(best.top + panel.height - 20, cy));
        if (best.left >= target.x + target.width) connector = { x1: best.left - 2, y1: withinY, x2: target.x + target.width + 3, y2: cy };
        else if (best.left + panel.width <= target.x) connector = { x1: best.left + panel.width + 2, y1: withinY, x2: target.x - 3, y2: cy };
        else if (best.top >= target.y + target.height) connector = { x1: withinX, y1: best.top - 2, x2: cx, y2: target.y + target.height + 3 };
        else if (best.top + panel.height <= target.y) connector = { x1: withinX, y1: best.top + panel.height + 2, x2: cx, y2: target.y - 3 };
      }
      const next = { viewport: { width, height }, target, left: best.left, top: best.top, mirror: best.mirror, connector };
      setLayout(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    const resize = new ResizeObserver(schedule);
    if (companion.current) resize.observe(companion.current);
    if (element) resize.observe(element);
    const mutation = new MutationObserver(schedule);
    const app = document.querySelector('.app');
    if (app) mutation.observe(app, { childList: true, subtree: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', schedule); window.removeEventListener('scroll', schedule, true); resize.disconnect(); mutation.disconnect(); };
  }, [step]);

  const close = () => { voice.stop(); onClose(); };
  const next = () => { voice.stop(); if (last) onClose(); else { onStepChange?.(index + 1); setIndex(value => value + 1); } };
  const previous = () => { if (index > 0) { voice.stop(); onStepChange?.(index - 1); setIndex(value => value - 1); } };
  return createPortal(<dialog ref={dialog} className="guide-tour" aria-labelledby="guide-title" aria-describedby="guide-description" onCancel={event => { event.preventDefault(); close(); }} onKeyDown={event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
  }}>
    {layout && <svg className="guide-shade" width="100%" height="100%" viewBox={`0 0 ${layout.viewport.width} ${layout.viewport.height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs><mask id={mask}><rect width="100%" height="100%" fill="white"/>{layout.target && <rect x={layout.target.x} y={layout.target.y} width={layout.target.width} height={layout.target.height} rx="9" fill="black"/>}</mask></defs>
      <rect width="100%" height="100%" fill="#090509" fillOpacity=".72" mask={`url(#${mask})`}/>
      {layout.target && <rect className="guide-spotlight" x={layout.target.x} y={layout.target.y} width={layout.target.width} height={layout.target.height} rx="9" fill="none" stroke="var(--accent)" strokeWidth="2"/>}
      {layout.connector && <g><line {...layout.connector} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 4" opacity=".8"/><circle cx={layout.connector.x2} cy={layout.connector.y2} r="3" fill="var(--accent)"/></g>}
    </svg>}
    <div ref={companion} className={`guide-companion ${layout ? 'positioned' : ''} ${layout?.mirror ? 'mirrored' : ''}`} style={layout ? { left: layout.left, top: layout.top } as CSSProperties : undefined}>
      <audio ref={voice.attachAudio} preload="none" data-finn-audio hidden/><div className={`guide-character ${voice.status === 'speaking' ? 'is-speaking' : ''}`}><Finn/><div className="guide-character-name">Финн<span>Хранитель таверны</span></div></div>
      <section className="guide-speech">
        <div className="guide-card-top"><span><Sparkles size={13}/> ФИНН ПОДСКАЖЕТ</span><button className="guide-close" aria-label="Закрыть подсказки Финна" onClick={close}><X size={17}/></button></div>
        <div key={index} className="guide-copy"><div className="guide-step-label">{step.label} <span>· {index + 1} из {steps.length}</span></div><h2 id="guide-title" ref={heading} tabIndex={-1}>{step.title}</h2><p id="guide-description">{step.text}</p></div>
        <div className="guide-voice" data-voice-status={voice.status}>
          <button className="guide-voice-toggle" onClick={voice.status === 'blocked' || voice.status === 'error' ? voice.repeat : voice.toggle} aria-label={voice.enabled && voice.status !== 'blocked' && voice.status !== 'error' ? 'Выключить голос Финна' : 'Включить голос Финна'} aria-pressed={voice.enabled}>{voice.status === 'blocked' || voice.status === 'error' ? <Play size={14}/> : voice.enabled ? <Volume2 size={15}/> : <VolumeX size={15}/>}<span>{voice.status === 'blocked' || voice.status === 'error' ? 'Озвучить' : voice.enabled ? 'Голос включён' : 'Включить голос'}</span></button>
          <span className={`voice-wave ${voice.status === 'speaking' ? 'playing' : ''}`} aria-hidden="true"><i/><i/><i/><i/></span>
          <button className="guide-repeat" onClick={voice.repeat} disabled={!voice.enabled || voice.status === 'loading'} aria-label="Повторить реплику Финна" title="Повторить реплику"><RotateCcw size={14}/></button>
          <span className="voice-playback" style={{ width: `${voice.progress}%` }} aria-hidden="true"/>
        </div>
        <div className="guide-voice-caption" role="status">{voiceLabel}</div>
        <div className="guide-progress" aria-label={`Шаг ${index + 1} из ${steps.length}`}>{steps.map((item, i) => <span key={item.label} className={i <= index ? 'visited' : ''}/>)}</div>
        <div className="guide-actions"><button className="guide-back" disabled={index === 0} onClick={previous}><ArrowLeft size={14}/> Назад</button><button className="button gold guide-next" onClick={next}>{last ? 'В приключение!' : index === 0 ? 'Покажи мне' : 'Далее'}{last ? <Check size={15}/> : <ArrowRight size={15}/>}</button></div>
        <div className="guide-card-footer"><button onClick={close}>Пропустить экскурсию</button><span>← → шаги <i>·</i> Esc закрыть</span></div>
      </section>
    </div>
  </dialog>, document.body);
}
