'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type VoiceStatus = 'loading' | 'speaking' | 'finished' | 'muted' | 'blocked' | 'error';

function releaseAudio(audio: HTMLAudioElement) {
  audio.pause();
  audio.removeAttribute('src');
  // Abort loading and any outstanding play() request, including on a detached node.
  audio.load();
}

export function useFinnVoice(source: string) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const generation = useRef(0);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [status, setStatus] = useState<VoiceStatus>('loading');
  const [progress, setProgress] = useState(0);

  const stop = useCallback(() => {
    generation.current++;
    if (audioRef.current) releaseAudio(audioRef.current);
  }, []);

  const attachAudio = useCallback((audio: HTMLAudioElement | null) => {
    audioRef.current = audio;
    if (!audio) return;
    // React runs ref cleanup synchronously when the tour leaves the DOM.
    return () => {
      generation.current++;
      releaseAudio(audio);
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    try { setEnabled((localStorage.getItem('dicebound-finn-voice') ?? localStorage.getItem('partyquest-finn-voice')) !== 'off'); }
    catch { setEnabled(true); }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || enabled === null) return;
    const ticket = ++generation.current;
    const update = (next: VoiceStatus) => { if (generation.current === ticket) setStatus(next); };
    const onPlaying = () => {
      if (generation.current !== ticket) { audio.pause(); return; }
      update('speaking');
    };
    const onEnded = () => { if (generation.current === ticket) { update('finished'); setProgress(100); } };
    const onError = () => update('error');
    const onTime = () => {
      if (generation.current === ticket) setProgress(Number.isFinite(audio.duration) && audio.duration > 0 ? Math.min(100, audio.currentTime / audio.duration * 100) : 0);
    };
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('timeupdate', onTime);
    releaseAudio(audio);
    setProgress(0);
    if (enabled) {
      setStatus('loading');
      audio.src = source;
      audio.load();
      void audio.play().catch((error: DOMException) => {
        if (error.name !== 'AbortError') update(error.name === 'NotAllowedError' ? 'blocked' : 'error');
      });
    } else setStatus('muted');
    return () => {
      generation.current++;
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('timeupdate', onTime);
      releaseAudio(audio);
    };
  }, [source, enabled]);

  useEffect(() => {
    window.addEventListener('pagehide', stop);
    return () => window.removeEventListener('pagehide', stop);
  }, [stop]);

  function toggle() {
    const next = !enabled;
    // Stop synchronously, including before the state update/unmount is committed.
    if (!next) stop();
    setEnabled(next);
    try { localStorage.setItem('dicebound-finn-voice', next ? 'on' : 'off'); } catch { /* Session-only preference. */ }
  }
  function repeat() {
    const audio = audioRef.current;
    if (!audio || !enabled) return;
    const ticket = generation.current;
    audio.pause();
    if (audio.error) audio.load();
    audio.currentTime = 0;
    setProgress(0);
    setStatus('loading');
    void audio.play().catch((error: DOMException) => {
      if (generation.current === ticket && error.name !== 'AbortError') setStatus(error.name === 'NotAllowedError' ? 'blocked' : 'error');
    });
  }
  return { attachAudio, stop, enabled: enabled === true, status, progress, toggle, repeat };
}
