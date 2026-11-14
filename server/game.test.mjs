import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameServer } from './game.mjs';

async function listen(server) { await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); return `http://127.0.0.1:${server.address().port}`; }
function client(base) {
  let cookie = '';
  return {
    get cookie() { return cookie; },
    async request(path, data, headers = {}) {
      const response = await fetch(`${base}/api${path}`, { method: data === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json', ...headers }, body: data === undefined ? undefined : JSON.stringify(data) });
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
      return { status: response.status, data: await response.json() };
    },
  };
}
async function subscribe(base, room, user) {
  const abort = new AbortController();
  const response = await fetch(`${base}/api/events?roomId=${room}`, { headers: { Cookie: user.cookie }, signal: abort.signal });
  assert.equal(response.status, 200);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  return {
    close: () => abort.abort(),
    async next() {
      const timeout = setTimeout(() => abort.abort(), 5000);
      try {
        while (true) {
          const boundary = buffer.indexOf('\n\n');
          if (boundary >= 0) {
            const value = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
            if (value.startsWith('data: ')) return JSON.parse(value.slice(6));
          } else {
            const { value, done } = await reader.read();
            if (done) throw new Error('Event stream closed');
            buffer += decoder.decode(value, { stream: true });
          }
        }
      } finally { clearTimeout(timeout); }
    },
  };
}
test('Dicebound: two independent players share authoritative room state', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'dicebound-test-'));
  const file = join(dir, 'state.json');
  const server = createGameServer({ dataFile: file });
  const base = await listen(server);
  const host = client(base), player = client(base), outsider = client(base);
  const streams = [];
  t.after(async () => { streams.forEach(s => s.close()); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); rmSync(dir, { recursive: true, force: true }); });
  const a = (await host.request('/session', { name: 'Элара', className: 'Маг' })).data;
  const b = (await player.request('/session', { name: 'Торин', className: 'Воин' })).data;
  await outsider.request('/session', { name: 'Наблюдатель' });
  let room;
  await t.test('create, join, capacity, and private room access', async () => {
    const created = await host.request('/rooms', { title: 'Тестовое приключение', maxPlayers: 2 });
    assert.equal(created.status, 201); room = created.data.room;
    assert.equal(room.hostId, a.id);
    assert.equal((await player.request(`/rooms/${room.id}/join`, {})).status, 200);
    assert.equal((await outsider.request(`/rooms/${room.id}/join`, {})).status, 409);
    assert.equal((await outsider.request(`/rooms/${room.id}`)).status, 403);
    assert.equal((await outsider.request(`/rooms/${room.id}/roll`, { sides: 20 })).status, 403);
  });
  const hostStream = await subscribe(base, room.id, host), playerStream = await subscribe(base, room.id, player);
  streams.push(hostStream, playerStream);
  await hostStream.next(); await playerStream.next();
  await t.test('chat arrives identically at both independent clients', async () => {
    await player.request(`/rooms/${room.id}/message`, { text: 'Осматриваю святилище.' });
    const one = await hostStream.next(), two = await playerStream.next();
    assert.deepEqual(one.messages.at(-1), two.messages.at(-1));
    assert.equal(two.messages.at(-1).text, 'Осматриваю святилище.');
    assert.equal(two.messages.at(-1).author, 'Торин');
  });
  await t.test('dice are rolled by server and shared, with validation', async () => {
    const result = await host.request(`/rooms/${room.id}/roll`, { sides: 20, count: 2, modifier: 3 });
    const one = await hostStream.next(), two = await playerStream.next();
    assert.deepEqual(one.messages.at(-1), two.messages.at(-1));
    const roll = result.data.room.messages.at(-1);
    assert.equal(roll.total, roll.results[0] + roll.results[1] + 3);
    assert.ok(roll.results.every(n => Number.isInteger(n) && n >= 1 && n <= 20));
    assert.equal((await host.request(`/rooms/${room.id}/roll`, { sides: 999 })).status, 400);
    assert.equal((await host.request(`/rooms/${room.id}/roll`, { sides: 20, count: 0 })).status, 400);
  });
  await t.test('players move their own token; host can move any; bounds and occupancy enforced', async () => {
    assert.equal((await player.request(`/rooms/${room.id}/move`, { tokenId: a.id, x: 2, y: 2 })).status, 403);
    assert.equal((await player.request(`/rooms/${room.id}/move`, { tokenId: b.id, x: 4, y: 5 })).status, 200);
    const one = await hostStream.next(), two = await playerStream.next();
    assert.deepEqual(one.tokens, two.tokens);
    assert.equal(two.tokens.find(t => t.id === b.id).x, 4);
    assert.equal((await host.request(`/rooms/${room.id}/move`, { tokenId: a.id, x: 4, y: 5 })).status, 409);
    assert.equal((await host.request(`/rooms/${room.id}/move`, { tokenId: b.id, x: -1, y: 5 })).status, 400);
    assert.equal((await host.request(`/rooms/${room.id}/move`, { tokenId: b.id, x: 8, y: 6 })).status, 200);
    await hostStream.next(); await playerStream.next();
  });
  await t.test('host authority, health validation and browser request protection', async () => {
    assert.equal((await player.request(`/rooms/${room.id}/turn`, {})).status, 403);
    assert.equal((await player.request(`/rooms/${room.id}/message`, { text: 'Fake GM', story: true })).status, 403);
    assert.equal((await player.request(`/rooms/${room.id}/hp`, { tokenId: b.id, hp: 21 })).status, 400);
    assert.equal((await player.request(`/rooms/${room.id}/hp`, { tokenId: a.id, hp: 1 })).status, 403);
    assert.equal((await host.request(`/rooms/${room.id}/turn`, {})).status, 200);
    await hostStream.next(); await playerStream.next();
    assert.equal((await host.request(`/rooms/${room.id}/roll`, { sides: 20 }, { Origin: 'https://untrusted.example' })).status, 403);
  });
  await t.test('saved state and guest identity survive a fresh server', async () => {
    const restarted = createGameServer({ dataFile: file });
    const secondBase = await listen(restarted);
    try {
      const response = await fetch(`${secondBase}/api/rooms/${room.id}`, { headers: { Cookie: host.cookie } });
      const state = await response.json();
      assert.equal(response.status, 200);
      assert.equal(state.room.members.length, 2);
      assert.equal(state.room.tokens.find(t => t.id === b.id).x, 8);
      assert.equal(state.room.activeTurn, 1);
      assert.ok(state.room.messages.some(m => m.type === 'roll'));
    } finally { restarted.closeAllConnections(); await new Promise(resolve => restarted.close(resolve)); }
  });
  await t.test('leaving transfers host and removes room access', async () => {
    assert.equal((await host.request(`/rooms/${room.id}/leave`, {})).status, 200);
    assert.equal((await host.request(`/rooms/${room.id}`)).status, 403);
    const finalRoom = (await player.request(`/rooms/${room.id}`)).data.room;
    assert.equal(finalRoom.hostId, b.id);
    assert.equal(finalRoom.members.length, 1);
    assert.equal(finalRoom.tokens.length, 1);
    assert.equal(finalRoom.activeTurn, 0);
  });
});
