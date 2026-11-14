import { useId } from 'react';

export function DiceGlyph({ sides }: { sides: number }) {
  const uid = useId().replace(/:/g, '');
  const shapes: Record<number, { outline: string; facets: string; y?: number }> = {
    4: { outline: 'M21 3 40 38H2Z', facets: 'M21 3 21 27 2 38M21 27 40 38', y: 26 },
    6: { outline: 'M21 2 39 11V33L21 43 3 33V11Z', facets: 'M3 11 21 20 39 11M21 20V43', y: 32 },
    8: { outline: 'M21 1 40 21 21 43 2 21Z', facets: 'M21 1 13 22 21 43M13 22 40 21', y: 27 },
    10: { outline: 'M21 2 39 16 34 35 21 43 5 33 2 16Z', facets: 'M21 2 11 18 5 33M11 18 34 35M11 18 39 16', y: 31 },
    12: { outline: 'M12 3H30L41 17 36 35 21 43 5 35 1 17Z', facets: 'M12 3 14 14 1 17M30 3 28 14 41 17M14 14H28L32 28 21 35 10 28ZM5 35 10 28M36 35 32 28M21 35V43', y: 27 },
    20: { outline: 'M21 2 39 12 36 33 21 43 4 33 2 12Z', facets: 'M21 2 12 17 2 12M21 2 30 17 39 12M12 17H30L21 34ZM4 33 12 17M36 33 30 17M4 33 21 34 36 33M21 34V43', y: 27 },
  };
  const shape = shapes[sides] || shapes[20];
  return <svg className="dice-glyph" viewBox="0 0 43 46" aria-hidden="true"><defs><linearGradient id={uid} x2=".9" y2="1"><stop stopColor="#c54c69"/><stop offset=".35" stopColor="#73122e"/><stop offset="1" stopColor="#1c060d"/></linearGradient></defs><path d={shape.outline} fill={`url(#${uid})`} stroke="#dc8398" strokeWidth="1.1"/><path d={shape.facets} fill="none" stroke="#d66b85" strokeWidth=".6" opacity=".7"/><path d="m7 16 2-1m23 18 2-1m-24 0 1 1m20-21 2 1" stroke="#efb3c2" strokeWidth=".7" opacity=".65"/><text x={sides === 6 ? 12 : 21} y={shape.y || 27} textAnchor="middle" fill="#fff0f4" fontFamily="Georgia,serif" fontSize={sides < 10 ? '12' : '10'}>{sides}</text></svg>;
}
