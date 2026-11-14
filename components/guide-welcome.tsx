'use client';

import { HelpCircle, ArrowRight, X } from 'lucide-react';
import { useEffect } from 'react';
import './guide-welcome.css';

export function GuideWelcome({ onStart, onDismiss }: { onStart: () => void; onDismiss: () => void }) {
  useEffect(() => {
    // Let the clicked control act first, including the button that starts Finn.
    document.addEventListener('click', onDismiss);
    return () => document.removeEventListener('click', onDismiss);
  }, [onDismiss]);

  return <aside className="guide-welcome" aria-labelledby="guide-welcome-title">
    <button className="guide-welcome-close" aria-label="Закрыть приветственную подсказку" onClick={onDismiss}><X size={16}/></button>
    <div className="guide-welcome-heading"><HelpCircle size={22}/><h2 id="guide-welcome-title">Подсказки — здесь</h2></div>
    <p>Нажмите <span className="guide-welcome-question" aria-label="кнопку со знаком вопроса">?</span> в правом верхнем углу. Финн покажет меню и объяснит, для чего нужны кнопки.</p>
    <div className="guide-welcome-actions"><button onClick={onDismiss}>Понятно</button><button onClick={onStart}>Показать подсказки <ArrowRight size={13}/></button></div>
  </aside>;
}
