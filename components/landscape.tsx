import { useId } from 'react';

export function Landscape({ scene = 'ruins', hero = false }: { scene?: string; hero?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const forest = scene === 'forest';
  const crypt = scene === 'crypt';
  const pine = 'M0 0-22 48-13 45-32 78-19 74-42 112-8 108-8 140H8V108L42 112 19 74 32 78 13 45 22 48Z';
  return <svg className={`landscape ${hero ? 'hero-landscape' : ''}`} viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id={`${uid}sky`} x2="0" y2="1"><stop stopColor={crypt ? '#272630' : forest ? '#3c242d' : '#422832'}/><stop offset="1" stopColor={crypt ? '#99908b' : forest ? '#a89a8b' : '#b5ada4'}/></linearGradient>
      <linearGradient id={`${uid}fade`} x2="0" y2="1"><stop stopColor="#1b1014" stopOpacity="0"/><stop offset="1" stopColor="#1b1014" stopOpacity=".8"/></linearGradient>
      <radialGradient id={`${uid}glow`}><stop stopColor="#f3d8a5" stopOpacity=".3"/><stop offset="1" stopColor="#f3d8a5" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${uid}stone`}><stop stopColor="#56484d"/><stop offset="1" stopColor="#2f1d24"/></linearGradient>
    </defs>
    <rect width="1200" height="520" fill={`url(#${uid}sky)`}/>
    <circle cx="825" cy="130" r="185" fill={`url(#${uid}glow)`}/>
    <circle cx="825" cy="130" r="50" fill="#dfd9bb" opacity=".7"/>
    <circle cx="837" cy="115" r="47" fill="#8a757d" opacity=".45"/>
    {[...Array(24)].map((_, i) => <circle key={i} cx={(i * 137 + 35) % 1200} cy={(i * 37 + 20) % 200} r={i % 3 === 0 ? 1.4 : .7} fill="#e9e2bd" opacity=".5"/>)}
    <path d="M0 305 130 220 206 265 350 85 470 224 568 143 731 290 830 206 959 280 1070 130 1200 240V520H0Z" fill="#7a616b" opacity=".65"/>
    <path d="m235 222 115-137 120 139-73-42-23-59-20 64-28-8Z" fill="#bcb6b0" opacity=".24"/>
    <path d="M0 360 172 278 310 348 459 244 618 322 749 281 890 360 1021 246 1200 339V520H0Z" fill="#5b3e49"/>
    <path d="M0 390Q210 315 411 380T840 355T1200 345V520H0" fill="#3c242d"/>
    <path d="M420 520Q545 391 745 350L768 360Q591 435 611 520Z" fill="#b3aba2" opacity=".33"/>
    {!forest && <g transform={crypt ? 'translate(40 20)' : undefined}>
      <path d="M700 366 735 310H910L960 375Z" fill="#3d2830"/>
      <path d="M743 327V195H785V172H864V196H909V327Z" fill={`url(#${uid}stone)`}/>
      <path d="M756 198V144H778V112L793 86 808 112V144H833V198M858 207V147H878V124L891 99 904 124V147H921V323H895" fill="#3e2a32"/>
      <path d="M787 326V263Q826 203 866 263V326H848V267Q827 232 805 267V326Z" fill="#25171c"/>
      <path d="M803 326V266Q826 229 849 266V326Z" fill="#bbae7e" opacity=".48"/>
      <path d="M739 207H789M853 216H912M759 154H804M865 156H920" stroke="#ac9d8c" strokeWidth="3" opacity=".27"/>
      {[765, 787, 864, 891].map((x, i) => <path key={x} d={`M${x} ${i % 2 ? 176 : 226}v14h6v-14Z`} fill="#d9bc79" opacity=".7"/>)}
      <path d="M776 144Q762 188 774 220T760 311M890 145Q877 198 900 242" stroke="#734c5b" strokeWidth="7" opacity=".6" fill="none"/>
      <path d="M672 377Q752 338 839 347L841 361Q743 352 678 395Z" fill="#726469"/>
      <path d="M691 381 700 416M717 371 727 403M747 362 755 390M776 355 780 379" stroke="#4f3b43" strokeWidth="9"/>
    </g>}
    {forest && <g><path d="M806 395Q742 229 793 94L820 20 844 89Q824 224 866 370Z" fill="#3a242c"/><path d="m810 170-150-73m160 128 158-99m-155-53 91-84" stroke="#3a242c" strokeWidth="30"/><ellipse cx="818" cy="70" rx="231" ry="102" fill="#472c36"/><ellipse cx="669" cy="130" rx="105" ry="65" fill="#543440"/><ellipse cx="984" cy="124" rx="112" ry="70" fill="#4a2d38"/><path d="M788 355Q824 281 850 355" stroke="#c4b5a4" strokeWidth="3" fill="none" opacity=".8"/></g>}
    {[20, 95, 182, 1016, 1082, 1170].map((x, i) => <use key={x} href={`#${uid}pine`} transform={`translate(${x} ${200 + i % 3 * 42}) scale(${1.3 + i % 3 * .5})`} fill="#2e1c23"/>)}
    <defs><path id={`${uid}pine`} d={pine}/></defs>
    <path d="M0 450 129 393 220 421 317 404 408 458 535 448 643 505 841 450 985 424 1123 460 1200 398V520H0Z" fill="#26181d"/>
    <path d="M0 491Q340 463 460 504T890 481T1200 490" stroke="#624b54" strokeWidth="2" fill="none"/>
    <g transform="translate(663 419)" fill="#1e1217"><circle cy="-25" r="5"/><path d="m-5-20-10 30h24L5-20ZM-4 8-3 26H0L3 8M6 5l8 18h4L10 3"/><path d="M10-9 23 4M22-17v44" stroke="#1d1216" strokeWidth="3"/></g>
    <rect width="1200" height="520" fill={`url(#${uid}fade)`}/>
    {[...Array(14)].map((_, i) => <circle key={i} cx={580 + (i * 79) % 500} cy={320 + (i * 31) % 150} r="1.5" fill="#dfbf72" opacity={.2 + i % 3 * .2}/>)}
  </svg>;
}
