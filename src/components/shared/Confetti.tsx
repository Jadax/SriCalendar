import { useEffect, type ReactElement } from 'react';
import { motion } from 'framer-motion';
import { useUiStore } from '../../store/uiStore';

const pieces = Array.from({ length: 42 }, (_, index) => ({ id: index, x: (index * 37) % 100, delay: (index % 9) * 0.08, emoji: ['🌸', '✨', '💖', '🎉'][index % 4] ?? '✨' }));

/** Renders a short celebratory emoji rain after completing the final task. */
export function Confetti(): ReactElement | null {
  const { confetti, stopCelebrating } = useUiStore();
  useEffect(() => { if (!confetti) return; const timer = window.setTimeout(stopCelebrating, 3200); return () => window.clearTimeout(timer); }, [confetti, stopCelebrating]);
  if (!confetti) return null;
  return <div className="confetti" aria-hidden>{pieces.map((piece) => <motion.span key={piece.id} initial={{ y: -80, x: `${piece.x}vw`, rotate: 0, opacity: 1 }} animate={{ y: '105vh', rotate: 540, opacity: 0.4 }} transition={{ duration: 2.4, delay: piece.delay, ease: 'easeIn' }}>{piece.emoji}</motion.span>)}</div>;
}
