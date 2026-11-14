import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveGameDataFile } from './storage.mjs';

test('renaming the project preserves saved rooms and guest sessions', t => {
  const directory = mkdtempSync(join(tmpdir(), 'dicebound-migration-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const legacy = join(directory, 'partyquest.json');
  const current = join(directory, 'dicebound.json');
  const saved = JSON.stringify({ sessions: { 'test-session': { id: 'hero' } }, rooms: { adventure: { members: ['hero'], messages: [{ text: 'Наше приключение' }] } } });
  writeFileSync(legacy, saved);
  assert.equal(resolveGameDataFile(directory), current);
  assert.equal(readFileSync(current, 'utf8'), saved);
  assert.equal(existsSync(legacy), false);
  assert.equal(resolveGameDataFile(directory), current);
  assert.equal(readFileSync(current, 'utf8'), saved);
});

test('a current Dicebound save is never replaced by legacy data', t => {
  const directory = mkdtempSync(join(tmpdir(), 'dicebound-migration-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  writeFileSync(join(directory, 'partyquest.json'), 'old');
  writeFileSync(join(directory, 'dicebound.json'), 'new');
  assert.equal(readFileSync(resolveGameDataFile(directory), 'utf8'), 'new');
  assert.equal(readFileSync(join(directory, 'partyquest.json'), 'utf8'), 'old');
});

test('a fresh installation uses the Dicebound filename', t => {
  const directory = mkdtempSync(join(tmpdir(), 'dicebound-migration-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = resolveGameDataFile(directory);
  assert.equal(file, join(directory, 'dicebound.json'));
  assert.equal(existsSync(file), false);
});
