import { existsSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';

export function resolveGameDataFile(directory = resolve('data')) {
  const current = resolve(directory, 'dicebound.json');
  const legacy = resolve(directory, 'partyquest.json');
  // Migrate once at startup, preserving the exact room and session data.
  // An existing Dicebound store always wins and is never overwritten.
  if (!existsSync(current) && existsSync(legacy)) renameSync(legacy, current);
  return current;
}
