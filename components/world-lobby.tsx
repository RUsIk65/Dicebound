'use client';

import { ArrowDown, ArrowRight, BookOpen, Castle, Compass, Crown, Dice5, Flag, Map, Plus, Shield, Sparkles, Star, Swords, Trees, Users } from 'lucide-react';
import type { RoomSummary, Session } from '@/lib/game-types';

type WorldLobbyProps = {
  rooms: RoomSummary[];
  myRooms: RoomSummary[];
  saved: string[];
  session: Session | null;
  activeTab: string;
  ready: boolean;
  busy: boolean;
  onBrowse: (tab: string, scene?: string) => void;
  onJoin: (id: string) => void;
  onCreate: () => void;
  onProfile: () => void;
  onGuide: () => void;
};

const adventureForms = { one: 'приключение', few: 'приключения', many: 'приключений', other: 'приключений', zero: 'приключений', two: 'приключения' };
const plural = new Intl.PluralRules('ru');

const regions = [
  { scene: 'forest', name: 'Изумрудный лес', caption: 'Там, где шепчут деревья', Icon: Trees },
  { scene: 'ruins', name: 'Лунные руины', caption: 'Истории забытого королевства', Icon: Castle },
  { scene: 'crypt', name: 'Чёрная корона', caption: 'Тайны под каменными сводами', Icon: Swords },
];

export function WorldLobby({ rooms, myRooms, saved, session, activeTab, ready, busy, onBrowse, onJoin, onCreate, onProfile, onGuide }: WorldLobbyProps) {
  const savedRooms = rooms.filter(room => saved.includes(room.id));
  const continuations = [...myRooms, ...savedRooms.filter(room => !myRooms.some(mine => mine.id === room.id))].slice(0, 3);

  return <section className="world-lobby" aria-labelledby="world-title">
    <img className="world-art" src="/images/world-map-desk.png" alt="Развёрнутая карта фэнтезийного мира на столе мастера: горы, леса, замки и дороги между ними." fetchPriority="high"/>
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

    <div className="world-locations" role="group" aria-label="Выберите мир приключения">
      {regions.map(({ scene, name, caption, Icon }) => {
        const count = rooms.filter(room => room.scene === scene).length;
        return <button className={`world-pin pin-${scene}`} key={scene} onClick={() => onBrowse('discover', scene)} aria-label={`${name}: показать приключения`}>
          <span className="world-pin-seal"><Icon size={20}/></span>
          <span className="world-pin-label"><b>{name}</b><small>{ready ? `${count} ${adventureForms[plural.select(count)]}` : 'Открываем карту…'}</small></span>
          <span className="world-pin-caption">{caption}</span>
        </button>;
      })}
      <span className="world-map-caption"><Map size={12}/> Выберите место — начните историю</span>
    </div>

    <aside className="world-menu" aria-label="Меню приключений">
      <div className="world-menu-heading"><span/> ВАША ИСТОРИЯ <span/></div>
      <nav data-tour="navigation" aria-label="Главное меню">
        <button className="menu-plaque menu-plaque-primary" onClick={onCreate}><Plus size={18}/><span>Новое приключение<small>Станьте ведущим своей истории</small></span><ArrowRight size={15}/></button>
        <button data-tour="discover" aria-current={activeTab === 'discover' ? 'page' : undefined} className="menu-plaque" onClick={() => onBrowse('discover')}><Compass size={18}/><span>Найти отряд<small>Открытые лобби и новые друзья</small></span></button>
        <button data-tour="mine" aria-current={activeTab === 'mine' ? 'page' : undefined} className="menu-plaque" onClick={() => onBrowse('mine')}><Flag size={18}/><span>Продолжить путь<small>Мои приключения</small></span>{myRooms.length > 0 && <em>{myRooms.length}</em>}</button>
        <button data-tour="saved" aria-current={activeTab === 'saved' ? 'page' : undefined} className="menu-plaque" onClick={() => onBrowse('saved')}><Star size={18}/><span>Избранные истории<small>Отложенные на потом</small></span>{savedRooms.length > 0 && <em>{savedRooms.length}</em>}</button>
        <button data-tour="profile" className="menu-plaque" onClick={onProfile}><Shield size={18}/><span>Мой персонаж<small>{session ? `${session.name} · ${session.className || 'Выберите класс'}` : 'У каждой легенды есть имя'}</small></span></button>
      </nav>
      <button className="world-finn" onClick={onGuide}><span className="finn-medallion"><Sparkles size={17}/></span><span>Нужен проводник?<small>Финн покажет, с чего начать</small></span><ArrowRight size={13}/></button>
    </aside>

    <section className="campaign-dock" aria-labelledby="campaign-title">
      <div className="campaign-heading"><h2 id="campaign-title"><BookOpen size={15}/> Ваши истории</h2><span>СЛЕДУЮЩАЯ ГЛАВА ЖДЁТ</span></div>
      {!ready ? <div className="campaign-empty" role="status"><Compass size={24}/><p>Открываем журнал путешествий…</p></div> : continuations.length ? <div className="campaign-slots">
        {continuations.map(room => {
          const joined = myRooms.some(mine => mine.id === room.id);
          const Icon = regions.find(region => region.scene === room.scene)?.Icon || Castle;
          return <button className="campaign-slot" key={room.id} disabled={busy || (!joined && room.memberCount >= room.maxPlayers)} onClick={() => onJoin(room.id)} aria-label={`${joined ? 'Продолжить' : 'Открыть'}: ${room.title}`}>
            <span className={`campaign-emblem emblem-${room.scene}`}><Icon size={23}/></span><span><small>{joined ? 'ВЫ В ОТРЯДЕ' : 'ИЗБРАННОЕ'}</small><b>{room.title}</b><em>{room.memberCount}/{room.maxPlayers} героев · {room.duration}</em></span><ArrowRight size={15}/>
          </button>;
        })}
        {continuations.length < 3 && <button className="campaign-slot campaign-new" onClick={onCreate}><span className="campaign-emblem"><Plus size={23}/></span><span><small>ЧИСТАЯ СТРАНИЦА</small><b>Новая легенда</b><em>Пригласите друзей за свой стол</em></span></button>}
      </div> : <div className="campaign-empty"><BookOpen size={25}/><p><b>Здесь будут ваши приключения.</b><span>Вступите в отряд или сохраните историю на доске ниже.</span></p><button onClick={() => onBrowse('discover')} aria-label="Посмотреть все приключения"><ArrowRight size={19}/></button></div>}
    </section>
    <button className="world-scroll" onClick={() => onBrowse('discover')} aria-label="Перейти к доске приключений"><ArrowDown size={15}/></button>
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
