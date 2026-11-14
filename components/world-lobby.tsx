'use client';

import { useState } from 'react';
import { WorldMap } from '@/components/world-map';
import { ArrowRight, BookOpen, Compass, Crown, Dice5, Flag, Plus, Shield, Sparkles, Star, Users } from 'lucide-react';
import type { RoomSummary, Session } from '@/lib/game-types';

type WorldLobbyProps = {
  rooms: RoomSummary[];
  myRooms: RoomSummary[];
  saved: string[];
  session: Session | null;
  ready: boolean;
  onBrowse: (tab: string, scene?: string) => void;
  onCreate: () => void;
  onProfile: () => void;
  onGuide: () => void;
};

export function WorldLobby({ rooms, myRooms, saved, session, ready, onBrowse, onCreate, onProfile, onGuide }: WorldLobbyProps) {
  const savedRooms = rooms.filter(room => saved.includes(room.id));
  const [expanded, setExpanded] = useState(false);

  return <section className={`world-lobby interactive-world ${expanded ? 'map-expanded' : ''}`} aria-labelledby="world-title">
    <WorldMap rooms={rooms} ready={ready} expanded={expanded} onExpand={() => { setExpanded(value => !value); requestAnimationFrame(() => document.querySelector('.interactive-world')?.scrollIntoView({ block: 'start', behavior: 'auto' })); }} onRegion={scene => onBrowse('discover', scene)}/>
    <div className="world-vignette" aria-hidden="true"/>
    <span className="world-corner corner-tl" aria-hidden="true"/><span className="world-corner corner-tr" aria-hidden="true"/>
    <span className="world-corner corner-bl" aria-hidden="true"/><span className="world-corner corner-br" aria-hidden="true"/>

    <div className="world-intro">
      <div className="world-kicker"><span/> ТАВЕРНА ИСКАТЕЛЕЙ ПРИКЛЮЧЕНИЙ</div>
      <h1 id="world-title">Dice<span>bound</span></h1>
      <div className="world-rule" aria-hidden="true"><span/>✦<span/></div>
      <h2>За этим столом<br/>рождаются легенды.</h2>
      <p>Разверните карту. Найдите свой отряд.<br/>Ваша следующая история уже близко.</p>
      <button className="world-start" onClick={() => onBrowse('discover')}><Compass size={18}/> Найти приключение <ArrowRight size={17}/></button>
      <button className="world-guide-link" onClick={onGuide}><BookOpen size={14}/> Первый раз за столом?</button>
      <div className="world-meta"><span><Users size={12}/> Играйте вместе</span><span><Dice5 size={12}/> D&D в браузере</span></div>
    </div>

    <aside className="world-menu" aria-label="Меню приключений">
      <div className="world-menu-heading"><span/> ВАША ИСТОРИЯ <span/></div>
      <nav aria-label="Главное меню">
        <button className="menu-plaque menu-plaque-primary" onClick={onCreate}><Plus size={18}/><span>Новое приключение<small>Станьте ведущим своей истории</small></span><ArrowRight size={15}/></button>
        <button className="menu-plaque" onClick={() => onBrowse('discover')}><Compass size={18}/><span>Доска приключений<small>Открытые лобби и новые друзья</small></span></button>
        <button className="menu-plaque" onClick={() => onBrowse('mine')}><Flag size={18}/><span>Ваши приключения<small>Возвращайтесь к своему отряду</small></span>{myRooms.length > 0 && <em>{myRooms.length}</em>}</button>
        <button className="menu-plaque" onClick={() => onBrowse('saved')}><Star size={18}/><span>Сохранённые истории<small>Отложенные на потом</small></span>{savedRooms.length > 0 && <em>{savedRooms.length}</em>}</button>
        <button className="menu-plaque" onClick={onProfile}><Shield size={18}/><span>Мой персонаж<small>{session ? `${session.name} · ${session.className || 'Выберите класс'}` : 'У каждой легенды есть имя'}</small></span></button>
      </nav>
      <button className="world-finn" onClick={onGuide}><span className="finn-medallion"><Sparkles size={17}/></span><span>Нужен проводник?<small>Финн покажет, с чего начать</small></span><ArrowRight size={13}/></button>
    </aside>

  </section>;
}

export function AdventureTrail({ onBrowse, onProfile, onCreate }: { onBrowse: () => void; onProfile: () => void; onCreate: () => void }) {
  return <section className="adventure-trail" aria-labelledby="trail-title">
    <div className="trail-heading"><span className="eyebrow">ВАШ ПЕРВЫЙ ПУТЬ</span><h2 id="trail-title">От искры до легенды</h2><p>Три шага — и вы уже за одним столом.</p></div>
    <div className="trail-stops">
      <div className="trail-stop"><span className="trail-number">01</span><Shield size={23}/><h3>Придумайте героя</h3><p>Имя, класс и немного воображения. Остальное придёт в пути.</p><button onClick={onProfile}>Мой персонаж <ArrowRight size={14}/></button></div>
      <div className="trail-stop"><span className="trail-number">02</span><Compass size={23}/><h3>Найдите своих</h3><p>Выберите мир и отряд, с которым хочется отправиться навстречу неизвестному.</p><button onClick={onBrowse}>Выбрать приключение <ArrowRight size={14}/></button></div>
      <div className="trail-stop"><span className="trail-number">03</span><Crown size={23}/><h3>Создайте историю</h3><p>Карта, чат и общие броски кубиков. Весь ваш мир — за одним столом.</p><button onClick={onCreate}>Собрать отряд <ArrowRight size={14}/></button></div>
    </div>
  </section>;
}
