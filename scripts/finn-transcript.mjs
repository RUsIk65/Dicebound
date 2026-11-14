import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('lib/guide-content.ts', root), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { getGuideSteps } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const lines = new Map();
for (const mode of ['tavern', 'tabletop']) for (const isHost of [true, false]) for (const step of getGuideSteps(mode, isHost)) {
  const sourceText = `${step.title} ${step.text}`;
  lines.set(step.audioSrc, { file: step.audioSrc.split('/').at(-1), text: sourceText.replaceAll('d20', 'дэ двадцать').replaceAll('«−»', '«минус»').replaceAll('«+»', '«плюс»'), sourceText });
}
const folder = new URL('public/audio/finn/', root);
if (process.argv.includes('--check')) {
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', folder), 'utf8'));
  const hash = data => createHash('sha256').update(data).digest('hex');
  for (const line of lines.values()) {
    const entry = manifest.find(item => item.file === line.file);
    const wav = readFileSync(new URL(line.file, folder));
    if (!entry || entry.textSha256 !== hash(line.sourceText)) throw new Error(`Narration text is out of date: ${line.file}`);
    if (entry.audioSha256 !== hash(wav) || wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE' || entry.seconds < 2) throw new Error(`Invalid narration: ${line.file}`);
  }
  if (manifest.length !== lines.size) throw new Error('Unexpected narration files');
  console.log(`Verified ${lines.size} recordings, matching all guide steps and roles.`);
} else {
  writeFileSync(new URL('transcript.json', folder), JSON.stringify([...lines.values()], null, 2));
  console.log(`Exported ${lines.size} guide recordings to synthesize.`);
}
