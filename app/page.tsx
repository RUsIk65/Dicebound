'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronRight, Clock3, Compass, Crown, Dice5, Flag, Heart, HelpCircle, Leaf, Link2, LoaderCircle, LogOut, Map, MessageCircle, Plus, Search, Send, Shield, Sparkles, Star, Sword, Swords, Users, VolumeX, X } from 'lucide-react';
import { Landscape } from '@/components/landscape';
import { BattleMap } from '@/components/battle-map';
import { GuideTour } from '@/components/guide-tour';
import { GuideWelcome } from '@/components/guide-welcome';
import { DiceGlyph } from '@/components/dice-glyph';
import type { GameMessage, Room, RoomSummary, Session } from '@/lib/game-types';

async function api<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, { method: data === undefined ? 'GET' : 'POST',
    headers: data === undefined ? {} : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || 'Сервер недоступен. Попробуйте ещё раз.');
  return result;
}
function Logo({ compact = false }: { compact?: boolean }) {
  return <span className="logo"><svg viewBox="0 0 40 42" fill="none" aria-hidden="true"><path d="M20 2 37 14 31 35H9L3 14Z M20 2 11 16 3 14M20 2 29 16 37 14M11 16H29L20 33ZM9 35 11 16M31 35 29 16" stroke="currentColor" strokeWidth="1.6"/></svg>{!compact && <span>Dice<span>bound</span><small>YOUR NEXT ADVENTURE</small></span>}</span>;
}
function Modal({ title, subtitle, children, onClose }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const el = dialog.current; el?.showModal(); return () => el?.close(); }, []);
  return <dialog ref={dialog} className="modal" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-inner"><button className="icon-button modal-close" aria-label="Закрыть" onClick={onClose}><X size={20}/></button><div className="eyebrow"><Sparkles size={14}/> НОВАЯ ИСТОРИЯ</div><h2>{title}</h2>{subtitle && <p className="muted">{subtitle}</p>}{children}</div></dialog>;
}
function Avatar({ name, color = '#d2ae76', small = false }: { name: string; color?: string; small?: boolean }) {
  return <span className={`avatar ${small ? 'small' : ''}`} style={{ '--avatar-color': color } as React.CSSProperties}>{name.slice(0, 1).toUpperCase()}</span>;
}

export default function Dicebound() {
  const [session, setSession] = useState<Session | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState<'create' | 'profile' | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideWelcomeOpen, setGuideWelcomeOpen] = useState(true);
  const closeGuide = useCallback(() => setGuideOpen(false), []);
  const openGuide = useCallback(() => { setGuideWelcomeOpen(false); setGuideOpen(true); }, []);
  const [tab, setTab] = useState('discover');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');
  const [scene, setScene] = useState('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState('');
  const [connected, setConnected] = useState(false);
  const [draft, setDraft] = useState('');
  const [story, setStory] = useState(false);
  const [die, setDie] = useState(20);
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [feedTab, setFeedTab] = useState('all');
  const [rollResult, setRollResult] = useState<GameMessage | null>(null);
  const feed = useRef<HTMLDivElement>(null);
  const latestRoll = useRef('');

  const refresh = useCallback(async () => { const data = await api<{ rooms: RoomSummary[] }>('/rooms'); setRooms(data.rooms); }, []);
  const goRoom = useCallback(async (id: string, replace = false) => {
    setBusy(true); setError('');
    try {
      const data = await api<{ room: Room }>(`/rooms/${encodeURIComponent(id)}/join`, {});
      setRoom(data.room); setRollResult(null); latestRoll.current = data.room.messages.filter(m => m.type === 'roll').at(-1)?.id || '';
      setSelected(''); setStory(false); setFeedTab('all');
      if (!replace) window.history.pushState({}, '', `/?room=${id}`);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }, []);
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const existing = await api<{ session: Session | null }>('/session');
        const identity = existing.session || await api<Session>('/session', {});
        if (cancelled) return;
        setSession(identity);
        await refresh();
        const id = new URLSearchParams(window.location.search).get('room');
        if (id) await goRoom(id, true);
        try { setSaved(JSON.parse(localStorage.getItem('dicebound-saved') ?? localStorage.getItem('partyquest-saved') ?? '[]')); } catch { /* Keep favorites from before the rename; storage may be disabled. */ }
      } catch (err) { setError((err as Error).message); } finally { if (!cancelled) setReady(true); }
    }
    void init();
    const onPop = () => { const id = new URLSearchParams(window.location.search).get('room'); if (id) void goRoom(id, true); else setRoom(null); };
    window.addEventListener('popstate', onPop);
    return () => { cancelled = true; window.removeEventListener('popstate', onPop); };
  }, [refresh, goRoom]);
  useEffect(() => {
    if (room) return;
    const timer = setInterval(() => { void refresh().catch(() => {}); }, 8000);
    return () => clearInterval(timer);
  }, [room?.id, refresh]);
  useEffect(() => {
    if (!room?.id) return;
    setConnected(false);
    const stream = new EventSource(`/api/events?roomId=${encodeURIComponent(room.id)}`);
    stream.onopen = () => setConnected(true);
    stream.onerror = () => setConnected(false);
    stream.onmessage = e => {
      const next = JSON.parse(e.data) as Room;
      setRoom(next); setConnected(true);
      const last = next.messages.filter(m => m.type === 'roll').at(-1);
      if (last && last.id !== latestRoll.current) { latestRoll.current = last.id; setRollResult(last); }
    };
    return () => { stream.close(); setConnected(false); };
  }, [room?.id]);
  useEffect(() => { if (room && session && !selected) setSelected(session.id); }, [room, session, selected]);
  useEffect(() => { feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: 'smooth' }); }, [room?.messages.length, feedTab]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { if (!rollResult) return; const timer = setTimeout(() => setRollResult(null), 6000); return () => clearTimeout(timer); }, [rollResult]);

  async function action(name: string, input: unknown) {
    if (!room) return;
    try {
      const data = await api<{ room: Room }>(`/rooms/${room.id}/${name}`, input);
      setRoom(data.room);
      if (name === 'roll') { const last = data.room.messages.at(-1); if (last) { latestRoll.current = last.id; setRollResult(last); } }
      return true;
    } catch (err) { setError((err as Error).message); return false; }
  }
  function home(nextTab = 'discover') { setRoom(null); setTab(nextTab); window.history.pushState({}, '', '/'); void refresh().catch(() => {}); }
  function bookmark(id: string) {
    const next = saved.includes(id) ? saved.filter(v => v !== id) : [...saved, id];
    setSaved(next); try { localStorage.setItem('dicebound-saved', JSON.stringify(next)); } catch { /* Saved for this visit. */ }
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const result = await api<{ room: Room }>('/rooms', { title: data.get('title'), description: data.get('description'), scene: data.get('scene'), level: data.get('level'), maxPlayers: Number(data.get('maxPlayers')), duration: data.get('duration') });
      setRoom(result.room); setSelected(session?.id || ''); setModal(null); setStory(false); latestRoll.current = ''; setRollResult(null);
      window.history.pushState({}, '', `/?room=${result.room.id}`);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function profile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const data = new FormData(event.currentTarget);
    try { setSession(await api<Session>('/session', { name: data.get('name'), className: data.get('className') })); setModal(null); setNotice('Профиль путешественника сохранён'); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function send(event: FormEvent) {
    event.preventDefault(); if (!draft.trim() || busy) return; setBusy(true);
    const sent = await action('message', { text: draft, story }); if (sent) setDraft(''); setBusy(false);
  }
  async function roll() { if (rolling) return; setRolling(true); await action('roll', { sides: die, count, modifier }); setTimeout(() => setRolling(false), 500); }
  async function invite() {
    try { await navigator.clipboard.writeText(window.location.href); setNotice('Ссылка на приключение скопирована'); }
    catch { setNotice('Скопируйте адрес комнаты из строки браузера'); }
  }
  async function leave() {
    if (!room) return;
    try { await api(`/rooms/${room.id}/leave`, {}); home('mine'); }
    catch (err) { setError((err as Error).message); }
  }
  const filtered = rooms.filter(r =>
    (tab !== 'mine' || r.members.some(m => m.id === session?.id)) && (tab !== 'saved' || saved.includes(r.id)) &&
    (`${r.title} ${r.description} ${r.hostName}`.toLowerCase().includes(query.toLowerCase())) &&
    (level === 'all' || r.level === level) && (scene === 'all' || r.scene === scene) && (!onlyAvailable || r.memberCount < r.maxPlayers));
  const isHost = room?.hostId === session?.id;
  const token = room?.tokens.find(t => t.id === selected);
  const myRooms = rooms.filter(r => r.members.some(m => m.id === session?.id));

  return <div className={`app ${room ? 'in-game' : ''}`}>
    {!room && <aside className="sidebar">
      <a className="brand" href="/" onClick={e => { e.preventDefault(); home(); }}><Logo/></a>
      <div className="sidebar-label">ПРИКЛЮЧЕНИЕ ЗОВЁТ</div>
      <nav data-tour="navigation" aria-label="Главное меню">
        <button data-tour="discover" className={tab === 'discover' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('discover')}><Compass size={19}/> Найти приключение <ChevronRight className="nav-arrow" size={14}/></button>
        <button data-tour="mine" className={tab === 'mine' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('mine')}><Map size={18}/> Мои приключения {myRooms.length > 0 && <span className="nav-count">{myRooms.length}</span>}</button>
        <button data-tour="saved" className={tab === 'saved' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('saved')}><Star size={18}/> Избранное {saved.length > 0 && <span className="nav-count">{saved.length}</span>}</button>
      </nav>
      <div className="sidebar-divider"/>
      <div className="sidebar-label">ВАША ИСТОРИЯ</div>
      <button data-tour="profile" className="nav-item" onClick={() => setModal('profile')}><Shield size={18}/> Мой персонаж</button>
      <button className="nav-item" onClick={openGuide}><BookOpen size={18}/> Как играть</button>
      <div className="sidebar-bottom"><div className="host-promo"><span className="promo-icon"><Crown size={22}/></span><h3>Ваша история.<br/>Ваши правила.</h3><p>Соберите отряд и станьте ведущим своего приключения.</p><button onClick={() => setModal('create')}>Создать приключение <Plus size={15}/></button></div>
        <button className="profile" onClick={() => setModal('profile')}><Avatar name={session?.name || 'П'}/><span><b>{session?.name || 'Путник'}</b><small>{session?.className || 'Выберите персонажа'}</small></span><ChevronDown size={15}/></button></div>
    </aside>}

    <main className="main">
      {!room ? <>
        <header className="topbar"><div className="breadcrumbs"><Compass size={16}/><span>Таверна</span><ChevronRight size={13}/><b>{tab === 'mine' ? 'Мои приключения' : tab === 'saved' ? 'Избранное' : 'Найти приключение'}</b></div><div className="topbar-right"><span className="local-badge"><i/> Локальная версия</span><button data-tour="help" className="icon-button guide-trigger" aria-label="Позвать Финна: подсказки по меню" title="Финн поможет разобраться" onClick={openGuide}><HelpCircle size={19}/></button></div></header>
        <div className="discovery">
          <section className="hero">
            <div className="hero-dice-art" aria-hidden="true"><img src="/images/obsidian-dice.jpg" alt="" fetchPriority="high"/></div>
            <div className="hero-shade"/>
            <div className="hero-content"><div className="eyebrow"><span/> ВАША СЛЕДУЮЩАЯ ИСТОРИЯ НАЧИНАЕТСЯ ЗДЕСЬ</div><h1>Приключения лучше<br/>в хорошей компании.</h1><p>Найдите свой отряд. Бросьте кубики.<br/>Станьте частью истории, которую создаёте вы.</p><div className="hero-actions"><button className="button gold" onClick={() => document.getElementById('adventures')?.scrollIntoView({ behavior: 'smooth' })}>Найти приключение <ArrowRight size={17}/></button><button className="button glass" onClick={openGuide}><BookOpen size={16}/> Я здесь впервые</button></div><div className="hero-footnote"><Shield size={13}/> Новичкам рады <span>✧</span><span>Всё для игры — прямо в браузере</span></div></div>
            <div className="hero-caption"><span>YOUR STORY. YOUR DICE.</span><b>Один бросок может изменить всё.</b></div>
          </section>
          <section className="discovery-section" id="adventures">
            <div className="section-heading"><div><div className="eyebrow">НАЙДИТЕ СВОЮ КОМПАНИЮ</div><h2>{tab === 'mine' ? 'Ваши приключения' : tab === 'saved' ? 'Сохранённые истории' : 'Доска приключений'}<span>{filtered.length}</span></h2></div><button data-tour="create" className="button outline create-button" onClick={() => setModal('create')}><Plus size={16}/> Создать лобби</button></div>
            <div data-tour="filters" className="filters"><label className="search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Название, история или ведущий…" aria-label="Поиск приключений"/>{query && <button aria-label="Очистить поиск" onClick={() => setQuery('')}><X size={14}/></button>}</label><label className="select-wrap"><Shield size={15}/><select aria-label="Уровень опыта" value={level} onChange={e => setLevel(e.target.value)}><option value="all">Любой опыт</option><option value="beginner">Для новичков</option><option value="experienced">Для опытных</option></select></label><label className="select-wrap"><Map size={15}/><select aria-label="Мир приключения" value={scene} onChange={e => setScene(e.target.value)}><option value="all">Все миры</option><option value="ruins">Древние руины</option><option value="forest">Волшебный лес</option><option value="crypt">Подземелья</option></select></label></div>
            <div className="results-line"><span>{tab === 'discover' ? 'Одна встреча. Тысяча возможных историй.' : 'Следующая глава ждёт вас.'}</span><label><input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)}/> Есть свободные места</label></div>
            {!ready ? <div className="empty"><LoaderCircle className="spin"/><h3>Зажигаем огни в таверне…</h3></div> : filtered.length === 0 ? <div className="empty"><Compass size={34}/><h3>{tab === 'mine' ? 'Ваше приключение ещё впереди' : tab === 'saved' ? 'Сохраните историю на потом' : 'Пока ни одного приключения'}</h3><p>{tab === 'saved' ? 'Нажмите на закладку в карточке понравившегося лобби.' : 'Измените фильтры или создайте собственное лобби.'}</p><button className="button outline" onClick={() => { setQuery(''); setLevel('all'); setScene('all'); setOnlyAvailable(false); setTab('discover'); }}>Все приключения <ArrowRight size={15}/></button></div> : <div className="adventure-grid">{filtered.map(r => <article className="adventure-card" key={r.id}><div className={`card-art scene-${r.scene}`}><Landscape scene={r.scene}/><div className="card-art-shade"/><span className={`room-tag ${r.level === 'beginner' ? 'beginner' : ''}`}>{r.level === 'beginner' ? <Leaf size={12}/> : <Swords size={12}/>} {r.level === 'beginner' ? 'Новичкам рады' : 'Для опытных'}</span><button className={`bookmark ${saved.includes(r.id) ? 'bookmarked' : ''}`} aria-label={`${saved.includes(r.id) ? 'Удалить из избранного' : 'В избранное'}: ${r.title}`} aria-pressed={saved.includes(r.id)} onClick={() => bookmark(r.id)}><Star size={16} fill={saved.includes(r.id) ? 'currentColor' : 'none'}/></button><div className="art-bottom"><span>FANTASY · ONE-SHOT</span><span><Users size={13}/> {r.memberCount}/{r.maxPlayers}</span></div></div><div className="card-content"><h3>{r.title}</h3><p>{r.description}</p><div className="card-metadata"><span><Clock3 size={13}/> {r.duration}</span><span><MessageCircle size={13}/> Русский</span><span><Dice5 size={13}/> D&D</span></div><div className="card-bottom"><span className="host"><Avatar small name={r.hostName}/><span><small>{r.memberCount ? 'Ведущий' : 'Открытая комната'}</small><b>{r.memberCount ? r.hostName : 'Создайте свой отряд'}</b></span></span><button className="join-button" aria-label={`Войти: ${r.title}`} disabled={busy || (r.memberCount >= r.maxPlayers && !r.members.some(m => m.id === session?.id))} onClick={() => void goRoom(r.id)}>{r.members.some(m => m.id === session?.id) ? 'Продолжить' : r.memberCount >= r.maxPlayers ? 'Мест нет' : 'Войти'} <ArrowRight size={14}/></button></div></div></article>)}</div>}
          </section>
          <section className="how-strip"><div className="how-intro"><span className="outlined-die"><Dice5 size={28}/></span><div><h3>От незнакомцев до отряда.</h3><p>Для первой игры нужны только вы и немного воображения.</p></div></div><button onClick={openGuide}>Как это работает <ArrowRight size={16}/></button></section>
          <footer className="page-footer"><span>Dicebound <span>✧</span> Истории создаются вместе.</span><span>Локальный прототип · v0.1</span></footer>
        </div>
      </> : session && <>
        <header className="game-header"><button className="back-button" onClick={() => home('mine')} aria-label="Назад к приключениям"><ArrowLeft size={18}/></button><a className="game-brand" href="/" onClick={e => { e.preventDefault(); home(); }}><Logo compact/></a><div className="game-title"><small>ПРИКЛЮЧЕНИЕ · {room.level === 'beginner' ? 'ДЛЯ НОВИЧКОВ' : 'ДЛЯ ОПЫТНЫХ'}</small><h1>{room.title}</h1></div><div className={`connection ${connected ? '' : 'reconnecting'}`}><i/>{connected ? 'За одним столом' : 'Восстанавливаем связь…'}</div><button data-tour="invite" className="button outline invite-button" onClick={() => void invite()}><Link2 size={15}/> Пригласить</button><button data-tour="help" className="icon-button guide-trigger" aria-label="Позвать Финна: подсказки по игровому столу" title="Финн поможет разобраться" onClick={openGuide}><HelpCircle size={19}/></button></header>
        <div className="game-layout">
          <aside className="party-panel"><div className="panel-heading"><span><Users size={16}/> Ваш отряд</span><small>{room.members.length}/{room.maxPlayers}</small></div><div data-tour="party" className="party-members">{room.members.map(member => { const t = room.tokens.find(t => t.id === member.id); return <button className={`member-card ${selected === member.id ? 'chosen' : ''}`} key={member.id} onClick={() => setSelected(member.id)}><Avatar name={member.name} color={member.color}/><span><b>{member.name}{member.id === session.id && <small> (вы)</small>}</b><small>{member.className}{member.id === room.hostId && <> · <Crown size={10}/> Ведущий</>}</small><span className="health-line"><span style={{ width: `${(t?.hp || 0)/(t?.maxHp || 20)*100}%` }}/></span></span></button>; })}{Array.from({ length: room.maxPlayers - room.members.length }, (_, i) => <button className="open-seat" key={i} onClick={() => void invite()}><span>+</span><small>Место для героя</small></button>)}</div>
            <div data-tour="turns" className="initiative"><div className="panel-heading"><span><Swords size={15}/> Порядок ходов</span><small>Раунд {room.round}</small></div>{room.tokens.map((t, i) => <div key={t.id} className={`initiative-row ${room.activeTurn === i ? 'current' : ''}`}><span className="initiative-number">{i+1}</span><span>{t.name}</span>{room.activeTurn === i && <ArrowRight size={13}/>}</div>)}{isHost && <button className="button outline next-turn" onClick={() => void action('turn', {})}>Следующий ход <ChevronRight size={14}/></button>}</div>
            <div className="party-bottom"><div className="session-note"><BookOpen size={16}/><p>Ведущий рассказывает историю.<br/>Вы решаете, что будет дальше.</p></div><button className="leave-button" onClick={() => void leave()}><LogOut size={15}/> Покинуть отряд</button></div>
          </aside>
          <section className="table-panel"><div className="table-toolbar"><span className="table-tab"><Map size={15}/> Игровой стол</span><span className="table-note"><Shield size={13}/> {isHost ? 'Вы — ведущий' : 'Вы — игрок'}</span></div><div data-tour="map" className="map-wrapper"><BattleMap room={room} session={session} selected={selected} onSelect={setSelected} onMove={(id,x,y) => void action('move', { tokenId: id, x,y })}/>{rollResult && <div key={rollResult.id} className={`roll-overlay ${rollResult.critical ? 'critical' : ''}`}><span>{rollResult.author} бросает {rollResult.text}</span><strong>{rollResult.total}</strong><small>{rollResult.critical ? 'КРИТИЧЕСКИЙ УСПЕХ!' : rollResult.results?.join(' + ')}</small></div>}</div>
            <div data-tour="health" className="character-bar">{token ? <><Avatar small name={token.name} color={token.color}/><div><b>{token.name}</b><small>{token.className}</small></div><div className="hp-control"><Heart size={14}/>{(isHost || token.id === session.id) && <button aria-label="Уменьшить здоровье" disabled={token.hp <= 0} onClick={() => void action('hp', { tokenId: token.id, hp: token.hp-1 })}>−</button>}<span>{token.hp}<small> / {token.maxHp}</small></span>{(isHost || token.id === session.id) && <button aria-label="Увеличить здоровье" disabled={token.hp >= token.maxHp} onClick={() => void action('hp', { tokenId: token.id, hp: token.hp+1 })}>+</button>}</div><span className="position">Клетка {token.x+1}:{token.y+1}</span></> : <span>Выберите персонажа на карте</span>}</div>
            <div data-tour="dice" className="dice-tray"><div className="dice-tray-title"><Dice5 size={18}/><span>Пусть решат кубики<small>Бросок виден всему отряду</small></span></div><div className="dice-choices">{[4,6,8,10,12,20].map(d => <button key={d} className={die === d ? 'active' : ''} onClick={() => setDie(d)} aria-pressed={die === d}><DiceGlyph sides={d}/><small>d{d}</small></button>)}</div><div className="dice-settings"><label>Кубики<input aria-label="Количество кубиков" type="number" min="1" max="10" value={count} onChange={e => setCount(Math.min(10, Math.max(1, Number(e.target.value))))}/></label><label>Бонус<input aria-label="Модификатор броска" type="number" min="-20" max="20" value={modifier} onChange={e => setModifier(Math.min(20, Math.max(-20, Number(e.target.value))))}/></label></div><button className="button gold roll-button" onClick={() => void roll()} disabled={rolling}><Dice5 size={18} className={rolling ? 'spin' : ''}/>{rolling ? 'Бросаем…' : `Бросить ${count}d${die}`}</button></div>
          </section>
          <aside data-tour="chat" className="chat-panel"><div className="panel-heading"><span><MessageCircle size={16}/> У костра</span><span className="chat-live-dot"/></div><div className="feed-tabs"><button className={feedTab === 'all' ? 'active' : ''} onClick={() => setFeedTab('all')}>Вся история</button><button className={feedTab === 'rolls' ? 'active' : ''} onClick={() => setFeedTab('rolls')}>Броски кубиков</button></div><div className="message-feed" ref={feed} role="log" aria-label="Чат и журнал бросков" aria-live="polite"><div className="journal-start"><span>✧</span><small>Здесь начинается ваша история</small></div>{room.messages.filter(m => feedTab === 'all' || m.type === 'roll').map(m => <div key={m.id} className={`message ${m.type}`}>
              {m.type === 'system' ? <p>{m.text}</p> : m.type === 'story' ? <><div className="message-author"><BookOpen size={13}/><b>{m.author || 'Начало приключения'}</b></div><p>{m.text}</p></> : m.type === 'roll' ? <><div className="message-author"><Avatar small name={m.author || '?'}/><b>{m.author}</b><time>{new Date(m.at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</time></div><div className={`roll-card ${m.critical ? 'critical' : ''}`}><Dice5 size={22}/><span>Бросок {m.text}<small>{m.critical ? 'Критический успех!' : `Результат: ${m.results?.join(' + ')}`}</small></span><strong>{m.total}</strong></div></> : <><div className="message-author"><Avatar small name={m.author || '?'}/><b>{m.author}</b><time>{new Date(m.at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</time></div><p>{m.text}</p></>}
            </div>)}</div><form className="chat-compose" onSubmit={send}>{isHost && <label className="story-toggle"><input type="checkbox" checked={story} onChange={e => setStory(e.target.checked)}/> Описать сцену от имени ведущего</label>}<div><input aria-label="Сообщение в чат" value={draft} onChange={e => setDraft(e.target.value)} placeholder={story ? 'Что видит ваш отряд?' : 'Слово за вами…'} maxLength={1000}/><button aria-label="Отправить сообщение" disabled={!draft.trim() || busy}><Send size={17}/></button></div><small><Shield size={11}/> Хорошая история начинается с уважения.</small></form></aside>
        </div><footer className="game-footer"><span><Logo compact/> Dicebound <span>✧</span> Истории создаются вместе.</span><span>Карта, чат и броски сохраняются автоматически <Check size={12}/></span></footer>
      </>}
    </main>
    {modal === 'create' && <Modal title="Соберите свой отряд" subtitle="Хорошему приключению нужен только первый шаг." onClose={() => setModal(null)}><form className="modal-form" onSubmit={create}><label>Название приключения<input name="title" required minLength={3} maxLength={80} placeholder="Например, Тайна забытого маяка" autoFocus/></label><label>О чём будет ваша история?<textarea name="description" maxLength={500} rows={3} placeholder="Заинтригуйте будущих героев…"/></label><div className="form-row"><label>Мир<select name="scene"><option value="ruins">Древние руины</option><option value="forest">Волшебный лес</option><option value="crypt">Подземелья</option></select></label><label>Опыт игроков<select name="level"><option value="beginner">Новичкам рады</option><option value="experienced">Для опытных</option></select></label></div><div className="form-row"><label>Мест за столом<select name="maxPlayers" defaultValue="4">{[2,3,4,5,6].map(n => <option key={n} value={n}>{n} участников, включая вас</option>)}</select></label><label>Длительность<select name="duration"><option>2–3 часа</option><option>До 1 часа</option><option>3–4 часа</option><option>Длинная кампания</option></select></label></div><p className="form-note"><Crown size={16}/> Вы станете ведущим. Карта, чат и кубики уже готовы.</p><button className="button gold full" disabled={busy}>{busy ? 'Открываем врата…' : 'Создать приключение'}<ArrowRight size={17}/></button></form></Modal>}
    {modal === 'profile' && <Modal title="Как зовут вашего героя?" subtitle="Отряд узнает вас по этому имени." onClose={() => setModal(null)}><form className="modal-form" onSubmit={profile}><label>Имя персонажа<input name="name" autoFocus required minLength={2} maxLength={24} defaultValue={session?.name} placeholder="Ваше имя в приключении"/></label><label>Класс персонажа<select name="className" defaultValue={session?.className || 'Следопыт'}>{['Воин','Маг','Плут','Следопыт','Жрец','Бард'].map(c => <option key={c}>{c}</option>)}</select></label><p className="form-note"><Shield size={18}/> Пока это гостевой профиль в этом браузере. В комнатах используется простой жетон персонажа с 20 очками здоровья.</p><button className="button gold full" disabled={busy}>Сохранить персонажа <Check size={16}/></button></form></Modal>}
    {ready && guideWelcomeOpen && !guideOpen && !modal && <GuideWelcome onStart={openGuide} onDismiss={() => setGuideWelcomeOpen(false)}/>}
    {guideOpen && <GuideTour key={room?.id || 'tavern'} mode={room ? 'tabletop' : 'tavern'} isHost={isHost} onClose={closeGuide}/>}
    {error && <div className="toast error" role="alert"><span>{error}</span><button aria-label="Закрыть ошибку" onClick={() => setError('')}><X size={17}/></button></div>}
    {notice && <div className="toast" role="status"><Check size={17}/><span>{notice}</span></div>}
  </div>;
}
