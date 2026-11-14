import { randomBytes, randomInt, randomUUID, createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolveGameDataFile } from './storage.mjs';

const classes = ['Воин', 'Маг', 'Плут', 'Следопыт', 'Жрец', 'Бард'];
const colors = ['#deaa61', '#a695e8', '#6eb9a5', '#e38982', '#83b9d9', '#c29dcc'];
const hash = value => createHash('sha256').update(value).digest('hex');
const clean = (value, max = 80) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const fail = (status, message) => Object.assign(new Error(message), { status });
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

export function createGameServer({ dataFile = resolveGameDataFile() } = {}) {
  let db = { sessions: {}, rooms: {} };
  if (dataFile && existsSync(dataFile)) db = JSON.parse(readFileSync(dataFile, 'utf8'));
  const listeners = new Map();
  const rates = new Map();

  function save() {
    if (!dataFile) return;
    mkdirSync(dirname(dataFile), { recursive: true });
    writeFileSync(`${dataFile}.tmp`, JSON.stringify(db), { mode: 0o600 });
    renameSync(`${dataFile}.tmp`, dataFile);
  }
  function event(room, type, text, extra = {}) {
    const item = { id: randomUUID(), type, text, at: Date.now(), ...extra };
    room.messages.push(item);
    room.messages = room.messages.slice(-120);
    return item;
  }
  function makeRoom(input, hostId = null, id = randomUUID()) {
    const room = {
      id, title: clean(input.title), description: clean(input.description, 500),
      scene: ['ruins', 'forest', 'crypt'].includes(input.scene) ? input.scene : 'ruins',
      level: input.level === 'experienced' ? 'experienced' : 'beginner',
      maxPlayers: integer(input.maxPlayers, 2, 6) ? input.maxPlayers : 4,
      duration: clean(input.duration, 30) || '2–3 часа', hostId, members: [], tokens: [],
      messages: [], activeTurn: 0, round: 1, createdAt: Date.now(), demo: !hostId,
    };
    event(room, 'story', 'Старый мост ведёт к забытому святилищу. Из глубины руин доносится звон колокола. Кто сделает первый шаг?');
    db.rooms[id] = room;
    return room;
  }
  if (!Object.keys(db.rooms).length) {
    makeRoom({ title: 'Тайна Лунного святилища', description: 'Древние руины, забытые боги и один колокол, который не должен звонить. Приключение начинается с вас.', scene: 'ruins', maxPlayers: 4 }, null, 'moon-sanctuary');
    makeRoom({ title: 'Шёпот Изумрудного леса', description: 'Лес хранит свои секреты. Найдите исчезнувшую экспедицию, прежде чем тропы навсегда сомкнутся.', scene: 'forest', maxPlayers: 5 }, null, 'emerald-woods');
    makeRoom({ title: 'Подземелья Чёрной короны', description: 'За каменными вратами ждут ловушки и сокровища. Соберите отряд, которому сможете доверять.', scene: 'crypt', level: 'experienced', maxPlayers: 6 }, null, 'black-crown');
    save();
  }
  const summary = room => ({ id: room.id, title: room.title, description: room.description, scene: room.scene,
    level: room.level, maxPlayers: room.maxPlayers, duration: room.duration, demo: room.demo,
    memberCount: room.members.length, members: room.members, hostName: room.members.find(m => m.id === room.hostId)?.name || 'Станьте ведущим' });
  function broadcast(room) {
    save();
    for (const response of listeners.get(room.id) || []) response.write(`data: ${JSON.stringify(room)}\n\n`);
  }
  function join(room, session) {
    if (room.members.some(m => m.id === session.id)) return;
    if (room.members.length >= room.maxPlayers) throw fail(409, 'В этом приключении пока нет свободных мест.');
    if (room.members.length === 0) room.hostId = session.id;
    const color = colors[room.members.length % colors.length];
    room.members.push({ id: session.id, name: session.name, className: session.className, color });
    room.tokens.push({ id: session.id, name: session.name, className: session.className, color,
      x: 4 + room.members.length, y: 10, hp: 20, maxHp: 20, initiative: randomInt(1, 21) });
    event(room, 'system', `${session.name} присоединяется к приключению.`);
    broadcast(room);
  }
  async function body(req) {
    let text = '';
    for await (const chunk of req) {
      text += chunk;
      if (text.length > 16384) throw fail(413, 'Слишком большой запрос.');
    }
    try { return JSON.parse(text || '{}'); } catch { throw fail(400, 'Некорректный запрос.'); }
  }
  const server = createServer(async (req, res) => {
    const reply = (status, data, headers = {}) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff', ...headers });
      res.end(JSON.stringify(data));
    };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/health') return reply(200, { ok: true });
      if (req.method !== 'GET' && req.headers.origin) {
        const allowed = new Set(['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3001', 'http://127.0.0.1:3001', process.env.APP_ORIGIN].filter(Boolean));
        if (!allowed.has(req.headers.origin)) throw fail(403, 'Источник запроса не разрешён.');
      }
      const cookie = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('pq_session='))?.slice(11);
      let session = cookie ? db.sessions[hash(cookie)] : null;
      if (req.method === 'POST' && url.pathname === '/api/session') {
        const input = await body(req);
        const name = clean(input.name, 24) || session?.name || 'Путник';
        const className = classes.includes(input.className) ? input.className : session?.className || 'Следопыт';
        let token;
        if (!session) {
          token = randomBytes(32).toString('hex');
          session = { id: randomUUID(), name, className };
          db.sessions[hash(token)] = session;
        } else Object.assign(session, { name, className });
        for (const room of Object.values(db.rooms)) {
          for (const item of [...room.members, ...room.tokens]) if (item.id === session.id) Object.assign(item, { name, className });
          if (room.members.some(m => m.id === session.id)) broadcast(room);
        }
        save();
        return reply(200, session, token ? { 'Set-Cookie': `pq_session=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=2592000` } : {});
      }
      if (req.method === 'GET' && url.pathname === '/api/session') return reply(200, { session });
      if (req.method === 'GET' && url.pathname === '/api/rooms') return reply(200, { rooms: Object.values(db.rooms).map(summary).reverse() });
      if (!session) throw fail(401, 'Сначала создайте профиль путешественника.');
      if (req.method !== 'GET') {
        const now = Date.now();
        const recent = (rates.get(session.id) || []).filter(t => now - t < 10000);
        if (recent.length >= 50) throw fail(429, 'Слишком много действий. Подождите несколько секунд.');
        recent.push(now); rates.set(session.id, recent);
      }
      if (req.method === 'POST' && url.pathname === '/api/rooms') {
        const input = await body(req);
        if (clean(input.title).length < 3) throw fail(400, 'Название должно содержать хотя бы 3 символа.');
        if (Object.values(db.rooms).filter(r => r.hostId === session.id && !r.demo).length >= 12) throw fail(409, 'Можно вести до 12 приключений.');
        const room = makeRoom(input, session.id);
        join(room, session);
        return reply(201, { room });
      }
      if (url.pathname === '/api/events' && req.method === 'GET') {
        const room = db.rooms[url.searchParams.get('roomId')];
        if (!room?.members.some(m => m.id === session.id)) throw fail(403, 'Сначала присоединитесь к комнате.');
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
        res.pqSessionId = session.id;
        res.write(`data: ${JSON.stringify(room)}\n\n`);
        if (!listeners.has(room.id)) listeners.set(room.id, new Set());
        const clients = listeners.get(room.id);
        clients.add(res);
        const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
        req.on('close', () => { clearInterval(heartbeat); clients.delete(res); if (!clients.size) listeners.delete(room.id); });
        return;
      }
      const match = url.pathname.match(/^\/api\/rooms\/([^/]+)(?:\/(join|leave|message|roll|move|turn|hp))?$/);
      if (!match) throw fail(404, 'Не найдено.');
      const room = db.rooms[match[1]];
      if (!room) throw fail(404, 'Приключение не найдено.');
      const action = match[2];
      if (req.method === 'POST' && action === 'join') { join(room, session); return reply(200, { room }); }
      if (!room.members.some(m => m.id === session.id)) throw fail(403, 'Вы не участник этой комнаты.');
      if (req.method === 'GET' && !action) return reply(200, { room });
      if (req.method !== 'POST') throw fail(405, 'Метод не поддерживается.');
      const input = await body(req);
      if (action === 'leave') {
        room.members = room.members.filter(m => m.id !== session.id);
        room.tokens = room.tokens.filter(t => t.id !== session.id);
        if (room.hostId === session.id) room.hostId = room.members[0]?.id || null;
        room.activeTurn = Math.min(room.activeTurn, Math.max(0, room.tokens.length - 1));
        event(room, 'system', `${session.name} покидает отряд.`);
        broadcast(room);
        // A player who left must stop receiving further room events.
        for (const response of listeners.get(room.id) || []) {
          if (response.pqSessionId === session.id) response.end();
        }
        return reply(200, { ok: true });
      } else if (action === 'message') {
        const text = clean(input.text, 1000);
        if (!text) throw fail(400, 'Напишите сообщение.');
        if (input.story && room.hostId !== session.id) throw fail(403, 'Описание сцены доступно ведущему.');
        event(room, input.story ? 'story' : 'chat', text, { author: session.name, authorId: session.id });
      } else if (action === 'roll') {
        const { sides, count = 1, modifier = 0 } = input;
        if (![4, 6, 8, 10, 12, 20, 100].includes(sides) || !integer(count, 1, 10) || !integer(modifier, -20, 20)) throw fail(400, 'Некорректный бросок.');
        const results = Array.from({ length: count }, () => randomInt(1, sides + 1));
        event(room, 'roll', `${count}d${sides}${modifier ? `${modifier > 0 ? '+' : ''}${modifier}` : ''}`, {
          author: session.name, authorId: session.id, results, total: results.reduce((a, b) => a + b, modifier),
          sides, critical: sides === 20 && count === 1 && results[0] === 20,
        });
      } else if (action === 'move' || action === 'hp') {
        const token = room.tokens.find(t => t.id === input.tokenId);
        if (!token) throw fail(404, 'Персонаж не найден.');
        if (token.id !== session.id && room.hostId !== session.id) throw fail(403, 'Можно управлять только своим персонажем.');
        if (action === 'move') {
          if (!integer(input.x, 0, 19) || !integer(input.y, 0, 13)) throw fail(400, 'Перемещение за пределы карты.');
          if (room.tokens.some(t => t.id !== token.id && t.x === input.x && t.y === input.y)) throw fail(409, 'Эта клетка занята.');
          Object.assign(token, { x: input.x, y: input.y });
        } else {
          if (!integer(input.hp, 0, token.maxHp)) throw fail(400, 'Некорректное здоровье.');
          token.hp = input.hp;
        }
      } else if (action === 'turn') {
        if (room.hostId !== session.id) throw fail(403, 'Только ведущий меняет ход.');
        room.activeTurn = (room.activeTurn + 1) % Math.max(room.tokens.length, 1);
        if (room.activeTurn === 0) room.round++;
        event(room, 'system', `Ход: ${room.tokens[room.activeTurn]?.name || 'отряд'}. Раунд ${room.round}.`);
      } else throw fail(404, 'Действие не найдено.');
      broadcast(room);
      reply(200, { room });
    } catch (error) { reply(error.status || 500, { error: error.status ? error.message : 'Не удалось выполнить действие.' }); }
  });
  server.on('close', () => { for (const clients of listeners.values()) for (const response of clients) response.end(); });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.API_PORT || 3001);
  createGameServer().listen(port, '127.0.0.1', () => console.log(`Dicebound API: http://127.0.0.1:${port}`));
}
