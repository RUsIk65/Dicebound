'use client';
import { useRef, useState, type PointerEvent } from 'react';
import { Minus, Plus, Scan, Map, MousePointer2, Grid2X2 } from 'lucide-react';
import type { Room, Session } from '@/lib/game-types';

export function BattleMap({ room, session, selected, onSelect, onMove }: {
  room: Room; session: Session; selected: string; onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState(true);
  const drag = useRef<{ id: string; x: number; y: number } | null>(null);
  const canMove = (id: string) => id === session.id || room.hostId === session.id;
  function point(event: PointerEvent) {
    const element = svg.current;
    if (!element) return null;
    const matrix = element.getScreenCTM();
    if (!matrix) return null;
    const p = element.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
    const local = p.matrixTransform(matrix.inverse());
    return { x: Math.floor(local.x / 50), y: Math.floor(local.y / 50) };
  }
  function drop(event: PointerEvent<SVGSVGElement>) {
    const p = point(event);
    const tokenId = drag.current?.id || selected;
    const wasDrag = drag.current && Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) > 5;
    if (p && tokenId && canMove(tokenId) && p.x >= 0 && p.x < 20 && p.y >= 0 && p.y < 14 && (wasDrag || !drag.current)) onMove(tokenId, p.x, p.y);
    drag.current = null;
  }
  const forest = room.scene === 'forest';
  return <div className="battle-map">
    <div className="map-topline"><span><Map size={14}/> {forest ? 'Затерянная поляна' : room.scene === 'crypt' ? 'Зал Чёрной короны' : 'Лунное святилище'}</span><span className="map-scale">1 клетка = 5 футов</span></div>
    <div className="map-viewport">
      <svg ref={svg} className="board" viewBox="0 0 1000 700" style={{ transform: `scale(${zoom})` }} onPointerUp={drop} onPointerCancel={() => { drag.current = null; }} aria-label="Игровая карта. Выберите персонажа и нажмите на клетку для перемещения.">
        <defs>
          <pattern id="ground" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill={forest ? '#47383e' : '#4c4246'}/><path d="m5 13 15-6m42 18 20 4m-67 33 12 5m42 9 14-5m-28-20 3-8" stroke="#a99986" strokeWidth="1" opacity=".13"/><circle cx="33" cy="37" r="3" fill="#38292f" opacity=".4"/><circle cx="82" cy="87" r="4" fill="#3c2830" opacity=".4"/></pattern>
          <pattern id="tiles" width="50" height="50" patternUnits="userSpaceOnUse"><rect x="1" y="1" width="48" height="48" rx="3" fill="#73676c"/><path d="M5 5h38v38M1 29l13-4 6-24" stroke="#aaa094" strokeWidth="1" opacity=".25"/><path d="M3 47h44V5" stroke="#4d3f44" strokeWidth="2"/></pattern>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" stroke="#d1c6b9" strokeWidth=".7" opacity=".18"/></pattern>
          <radialGradient id="torch"><stop stopColor="#ffce6a" stopOpacity=".55"/><stop offset="1" stopColor="#f3b94b" stopOpacity="0"/></radialGradient>
          <radialGradient id="vignette"><stop offset=".4" stopColor="#150d10" stopOpacity="0"/><stop offset="1" stopColor="#130c0f" stopOpacity=".65"/></radialGradient>
          <filter id="shadow"><feDropShadow dx="2" dy="5" stdDeviation="5" floodOpacity=".55"/></filter>
          <g id="tree"><circle r="58" fill="#321e26"/><circle cx="-15" cy="-12" r="39" fill="#462b35"/><circle cx="17" cy="-15" r="31" fill="#553441"/><circle cx="-13" cy="-27" r="22" fill="#603b49"/><path d="m-29-20 17 6m19-16 14 7M-16 6l14 4" stroke="#835a6a" strokeWidth="2" opacity=".5"/></g>
        </defs>
        <rect width="1000" height="700" fill="url(#ground)"/>
        <path d="M-40 520Q140 440 214 532T457 575T719 599T1040 527V760H-40Z" fill="#3a242c"/><path d="M-30 525Q135 458 218 546T459 589T725 611T1040 542" fill="none" stroke="#9b8873" strokeWidth="4" opacity=".24"/>
        <path d="M180 0 163 175 201 286 172 420 248 527 370 547 369 486 274 413 298 286 270 190 288 0Z" fill="#9a9671" opacity=".25"/>
        <path d="M295 135H740V480H295Z" fill="#38292f" opacity=".7"/>
        <path d="M300 140H735V470H300Z" fill="url(#tiles)"/>
        <rect x="447" y="460" width="150" height="155" rx="5" fill="#564e36" stroke="#3c2f34" strokeWidth="8"/>
        {[...Array(9)].map((_, i) => <path key={i} d={`M450 ${469 + i * 16}h144`} stroke="#97866a" strokeWidth="3" opacity=".55"/>)}
        <path d="M302 142H460V168H327V250H301ZM565 141H738V280H712V166H565ZM300 343H326V446H440V471H301ZM622 448H714V375H739V473H622Z" fill="#908981" stroke="#4f4348" strokeWidth="7" filter="url(#shadow)"/>
        <path d="m305 166 17 9m391 35 20-4M351 450v17m351-14 9 16M605 145l8 19" stroke="#4f4247" strokeWidth="3"/>
        <circle cx="520" cy="300" r="112" fill="#49393f" stroke="#ac9d8b" strokeWidth="3" opacity=".8"/><circle cx="520" cy="300" r="91" fill="#74636a" stroke="#a39584" strokeWidth="1"/>
        <path d="m520 211 52 161-137-99h170L468 372Z" fill="none" stroke="#b4a28d" strokeWidth="2" opacity=".55"/><circle cx="520" cy="300" r="40" fill="#573b46" stroke="#b0a08d" strokeWidth="3"/>
        <path d="m519 276 12 24-12 24-13-24Z" fill="#c8baab" opacity=".8"/>
        {[ [350,210], [685,210], [350,400], [685,400] ].map(([x,y], i) => <g key={i} transform={`translate(${x} ${y})`} filter="url(#shadow)"><rect x="-18" y="-18" width="36" height="36" rx="3" fill="#998e82" stroke="#534349" strokeWidth="4"/><circle r="12" fill="#7c676f"/><path d="M-8-8 8 8M8-8-8 8" stroke="#ada194" strokeWidth="2"/></g>)}
        {[ [405,185], [635,185], [394,434], [650,434] ].map(([x,y], i) => <g key={i}><circle cx={x} cy={y} r="66" fill="url(#torch)"/><circle cx={x} cy={y} r="8" fill="#3a3022"/><path d={`m${x-4} ${y}q-4-10 5-17 10 11 4 17Z`} fill="#e8c17b"/><circle cx={x} cy={y-4} r="3" fill="#fff0ab"/></g>)}
        {[ [35,45], [145,70], [67,179], [88,320], [160,420], [38,448], [873,28], [970,100], [823,113], [902,238], [994,331], [859,374], [966,470], [70,686], [166,664], [827,687], [954,643] ].map(([x,y], i) => <use key={i} href="#tree" transform={`translate(${x} ${y}) scale(${.7 + (i%4)*.16})`} filter="url(#shadow)"/>)}
        {[ [262,216], [773,306], [245,410], [777,440], [402,114], [680,498] ].map(([x,y], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${i*34})`}><path d="m-15-10 22-4 10 17-20 9-17-7Z" fill="#857279" stroke="#4d3b42" strokeWidth="3"/><path d="m-9-6 12-3 5 7" stroke="#a4998c" strokeWidth="2"/></g>)}
        <path d="M331 270q30 20 18 61m372-31q-29 15-11 39M481 168q-7 30 20 23" stroke="#a18a6f" strokeWidth="5" opacity=".48" fill="none"/>
        <rect width="1000" height="700" fill="url(#vignette)" pointerEvents="none"/>
        {grid && <rect width="1000" height="700" fill="url(#grid)" pointerEvents="none"/>}
        {room.tokens.map(token => <g key={token.id} transform={`translate(${token.x*50+25} ${token.y*50+25})`} className={`map-token ${selected === token.id ? 'selected' : ''}`} role="button" tabIndex={0} aria-label={`${token.name}, ${token.className}, клетка ${token.x+1}, ${token.y+1}`} onPointerDown={event => { event.stopPropagation(); onSelect(token.id); drag.current = { id: token.id, x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }} onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(token.id); }
          const moves: Record<string, number[]> = { ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0] };
          if (moves[event.key] && canMove(token.id)) { event.preventDefault(); onMove(token.id, token.x+moves[event.key][0], token.y+moves[event.key][1]); }
        }}>
          {selected === token.id && <circle r="28" fill="none" stroke={token.color} strokeWidth="1.5" strokeDasharray="3 4"/>}
          <circle r="21" fill="#26171d" stroke={token.color} strokeWidth="3" filter="url(#shadow)"/>
          <path d="M-12 12Q-9-2 0-2T12 12Z" fill={token.color}/><circle cy="-7" r="7" fill={token.color}/>
          <path d="M-15 23h30" stroke="#25161c" strokeWidth="5" strokeLinecap="round"/><path d={`M-15 23h${30*token.hp/token.maxHp}`} stroke="#b6a490" strokeWidth="3" strokeLinecap="round"/>
          <text y="42" textAnchor="middle" fill="#ede8cf" fontSize="12" fontFamily="Segoe UI,sans-serif" paintOrder="stroke" stroke="#24171c" strokeWidth="3">{token.name}</text>
        </g>)}
      </svg>
      <div className="compass">N<span>✧</span>S</div>
      <div className="map-tools"><button aria-label="Приблизить карту" onClick={() => setZoom(z => Math.min(1.6, z+.2))}><Plus size={17}/></button><button aria-label="Отдалить карту" onClick={() => setZoom(z => Math.max(.8, z-.2))}><Minus size={17}/></button><button aria-label="Сбросить масштаб" onClick={() => setZoom(1)}><Scan size={17}/></button><span/><button aria-label="Показать сетку" aria-pressed={grid} onClick={() => setGrid(!grid)}><Grid2X2 size={17}/></button></div>
      <div className="map-hint"><MousePointer2 size={13}/> Выберите героя и клетку или перетащите фишку</div>
    </div>
  </div>;
}
