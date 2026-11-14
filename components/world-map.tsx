'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { Castle, Maximize2, Minimize2, Minus, Move, Plus, RotateCcw, Swords, Trees } from 'lucide-react';
import type { RoomSummary } from '@/lib/game-types';

type View = { x: number; y: number; scale: number };
type Point = { x: number; y: number };
const initialView: View = { x: 0, y: 0, scale: 1 };
const minScale = 1;
const maxScale = 3;
const forms = { one: 'приключение', few: 'приключения', many: 'приключений', other: 'приключений', zero: 'приключений', two: 'приключения' };
const plural = new Intl.PluralRules('ru');
const regions = [
  { scene: 'forest', name: 'Изумрудный лес', caption: 'Там, где шепчут деревья', Icon: Trees },
  { scene: 'ruins', name: 'Лунные руины', caption: 'Истории забытого королевства', Icon: Castle },
  { scene: 'crypt', name: 'Чёрная корона', caption: 'Тайны под каменными сводами', Icon: Swords },
];
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function WorldMap({ rooms, ready, expanded, onExpand, onRegion }: {
  rooms: RoomSummary[];
  ready: boolean;
  expanded: boolean;
  onExpand: () => void;
  onRegion: (scene: string) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const currentView = useRef(initialView);
  const pointers = useRef(new Map<number, Point>());
  const start = useRef<Point | null>(null);
  const dragged = useRef(false);
  const [view, setView] = useState(initialView);
  const [dragging, setDragging] = useState(false);

  const commit = useCallback((next: View) => {
    const root = viewport.current, plane = canvas.current;
    if (!root || !plane || !root.clientWidth || !root.clientHeight) return;
    const scale = Math.min(maxScale, Math.max(minScale, next.scale));
    // The oversized plane allows dragging at 100%, while bounds keep the table covered.
    const limitX = Math.max(0, (plane.offsetWidth * scale - root.clientWidth) / 2);
    const limitY = Math.max(0, (plane.offsetHeight * scale - root.clientHeight) / 2);
    const bounded = { scale, x: Math.max(-limitX, Math.min(limitX, next.x)), y: Math.max(-limitY, Math.min(limitY, next.y)) };
    currentView.current = bounded;
    setView(previous => previous.x === bounded.x && previous.y === bounded.y && previous.scale === bounded.scale ? previous : bounded);
  }, []);

  const zoom = useCallback((factor: number, anchor?: Point, nextAnchor?: Point) => {
    const box = viewport.current?.getBoundingClientRect();
    if (!box?.width || !box.height) return;
    const before = currentView.current;
    const scale = Math.min(maxScale, Math.max(minScale, before.scale * factor));
    const ratio = scale / before.scale;
    const center = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    const point = anchor || center;
    const destination = nextAnchor || point;
    // Keep the map point under the cursor (or between two fingers) in place.
    commit({ scale, x: destination.x - center.x - (point.x - center.x - before.x) * ratio, y: destination.y - center.y - (point.y - center.y - before.y) * ratio });
  }, [commit]);

  useEffect(() => {
    const root = viewport.current;
    if (!root) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1;
      zoom(Math.exp(-Math.max(-240, Math.min(240, event.deltaY * units)) * .0025), { x: event.clientX, y: event.clientY });
    };
    const resize = new ResizeObserver(() => commit(currentView.current));
    resize.observe(root);
    const cancel = () => { pointers.current.clear(); start.current = null; setDragging(false); };
    root.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('blur', cancel);
    return () => { root.removeEventListener('wheel', wheel); resize.disconnect(); window.removeEventListener('blur', cancel); };
  }, [commit, zoom]);

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const point = { x: event.clientX, y: event.clientY };
    if (!pointers.current.size) { start.current = point; dragged.current = false; }
    pointers.current.set(event.pointerId, point);
    const button = (event.target as Element).closest('button');
    const capture = button || event.currentTarget;
    capture.setPointerCapture(event.pointerId);
    if (!button) { event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); }
  }

  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const oldPoints = [...pointers.current.values()];
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    const nextPoints = [...pointers.current.values()];
    if (nextPoints.length > 1) {
      dragged.current = true; setDragging(true);
      const oldDistance = distance(oldPoints[0], oldPoints[1]);
      if (oldDistance > 0) zoom(distance(nextPoints[0], nextPoints[1]) / oldDistance, midpoint(oldPoints[0], oldPoints[1]), midpoint(nextPoints[0], nextPoints[1]));
    } else if (dragged.current || (start.current && distance(start.current, point) > 5)) {
      dragged.current = true; setDragging(true);
      const before = currentView.current;
      commit({ ...before, x: before.x + point.x - previous.x, y: before.y + point.y - previous.y });
    }
  }

  function pointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    const target = event.target as Element;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    if (!pointers.current.size) { start.current = null; setDragging(false); }
    else start.current = [...pointers.current.values()][0];
  }

  return <>
    <div ref={viewport} className={`world-map-viewport ${dragging ? 'is-dragging' : ''}`} tabIndex={0} role="region" aria-label="Интерактивная карта мира" aria-describedby="world-map-instructions"
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd}
      onClickCapture={event => { if (dragged.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); } }}
      onDoubleClick={event => { if (!(event.target as Element).closest('button')) zoom(1.4, { x: event.clientX, y: event.clientY }); }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        const step = event.shiftKey ? 120 : 45;
        const before = currentView.current;
        if (['+', '=', '-', '_', '0', 'Home', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); }
        if (event.key === '+' || event.key === '=') zoom(1.25);
        if (event.key === '-' || event.key === '_') zoom(1 / 1.25);
        if (event.key === '0' || event.key === 'Home') commit(initialView);
        if (event.key === 'ArrowLeft') commit({ ...before, x: before.x + step });
        if (event.key === 'ArrowRight') commit({ ...before, x: before.x - step });
        if (event.key === 'ArrowUp') commit({ ...before, y: before.y + step });
        if (event.key === 'ArrowDown') commit({ ...before, y: before.y - step });
      }}>
      <div ref={canvas} className="world-map-canvas" style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`, '--pin-scale': 1 / view.scale } as CSSProperties}>
        <img className="world-art" src="/images/world-map-desk.png" alt="Карта фэнтезийного мира с горами, лесами, замками и дорогами между ними." draggable={false} fetchPriority="high"/>
        <div className="world-locations" role="group" aria-label="Локации мира">
          {regions.map(({ scene, name, caption, Icon }) => {
            const count = rooms.filter(room => room.scene === scene).length;
            return <button className={`world-pin pin-${scene}`} key={scene} onClick={() => onRegion(scene)} aria-label={`${name}: показать приключения`}>
              <span className="world-pin-seal"><Icon size={20}/></span>
              <span className="world-pin-label"><b>{name}</b><small>{ready ? `${count} ${forms[plural.select(count)]}` : 'Открываем карту…'}</small></span>
              <span className="world-pin-caption">{caption}</span>
            </button>;
          })}
        </div>
      </div>
    </div>
    <div className="world-map-hud">
      <p id="world-map-instructions"><Move size={13}/><span className="map-mouse-hint">Тяните карту мышью · колесо для масштаба</span><span className="map-touch-hint">Двигайте карту · разводите пальцы для масштаба</span></p>
      <div className="world-map-controls" role="group" aria-label="Управление картой мира">
        <button onClick={() => zoom(1 / 1.25)} disabled={view.scale <= minScale} aria-label="Отдалить карту мира" title="Отдалить (−)"><Minus size={17}/></button>
        <output aria-label="Масштаб карты мира">{Math.round(view.scale * 100)}%</output>
        <button onClick={() => zoom(1.25)} disabled={view.scale >= maxScale} aria-label="Приблизить карту мира" title="Приблизить (+)"><Plus size={17}/></button>
        <span className="map-control-divider"/>
        <button onClick={() => commit(initialView)} aria-label="Сбросить вид карты мира" title="Сбросить вид (0)"><RotateCcw size={16}/></button>
        <button onClick={onExpand} aria-label={expanded ? 'Вернуть меню на карту' : 'Развернуть карту мира'} aria-pressed={expanded} title={expanded ? 'Вернуть меню' : 'Развернуть карту'}>{expanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button>
      </div>
    </div>
  </>;
}
