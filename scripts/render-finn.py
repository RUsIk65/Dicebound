"""Regenerate Finn's static narration with a local Piper voice; no runtime TTS service."""
import hashlib
import json
from pathlib import Path
import sys
import wave
import tempfile
import shutil
import argparse

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--model', required=True, type=Path, help='Path to ru_RU-denis-medium.onnx with its .onnx.json beside it')
parser.add_argument('--packages', type=Path, help='Optional pip --target installation directory')
args = parser.parse_args()
if args.packages:
    sys.path.insert(0, str(args.packages.resolve()))
import piper
from piper import PiperVoice, SynthesisConfig

model = args.model.resolve(strict=True)
# The Windows eSpeak binary cannot resolve Cyrillic installation paths.
espeak_temp = tempfile.TemporaryDirectory(prefix='dicebound-finn-')
espeak_dir = Path(espeak_temp.name).resolve()
assert espeak_dir.parent == Path(tempfile.gettempdir()).resolve()
assert espeak_dir.name.startswith('dicebound-finn-')
shutil.copytree(Path(piper.__file__).parent / 'espeak-ng-data', espeak_dir / 'espeak-ng-data')
voice = PiperVoice.load(str(model), espeak_data_dir=str(espeak_dir / 'espeak-ng-data'))
config = SynthesisConfig(length_scale=1.04, noise_scale=0.5, noise_w_scale=0.333, normalize_audio=True)
folder = root / 'public' / 'audio' / 'finn'
lines = json.loads((folder / 'transcript.json').read_text(encoding='utf-8'))
manifest = []
for line in lines:
    file = folder / line['file']
    with wave.open(str(file), 'wb') as output:
        voice.synthesize_wav(line['text'], output, syn_config=config)
    with wave.open(str(file), 'rb') as result:
        duration = result.getnframes() / result.getframerate()
        if duration < 2:
            raise RuntimeError(f'Empty narration: {file.name}')
    manifest.append({'file': file.name, 'seconds': round(duration, 2), 'textSha256': hashlib.sha256(line['sourceText'].encode()).hexdigest(), 'audioSha256': hashlib.sha256(file.read_bytes()).hexdigest()})
    print(f'{file.name}: {duration:.1f}s', flush=True)
(folder / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Created {len(manifest)} narrated steps.', flush=True)
espeak_temp.cleanup()
