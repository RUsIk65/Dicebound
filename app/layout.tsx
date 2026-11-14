import type { Metadata } from 'next';
import './globals.css';
import './obsidian-theme.css';
import './world-lobby.css';
import './world-map.css';

export const metadata: Metadata = {
  title: 'Dicebound — Найди свой отряд',
  description: 'Находите приключения, собирайте друзей и играйте в настольные ролевые игры прямо в браузере.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
