import type { ReactElement } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { STICKERS } from '../../utils/stickerData';

interface StickerPickerProps { selected: string[]; onToggle: (sticker: string) => Promise<void> }

/** Lets a creator decorate each date with a playful mood and content-life sticker palette. */
export function StickerPicker({ selected, onToggle }: StickerPickerProps): ReactElement {
  return <section className="panel-section sticker-section"><div className="section-title"><div><h3><Sparkles size={15}/> Decorate your day</h3><p className="sticker-prompt">How are you feeling today? Pick your little vibe.</p></div><span>{selected.length} vibes</span></div><div className="sticker-strip" aria-label="Day stickers">{STICKERS.map((sticker) => <motion.button whileHover={{ y: -4, rotate: 7 }} whileTap={{ scale: 1.3, rotate: 12 }} className={selected.includes(sticker) ? 'selected' : ''} key={sticker} onClick={() => void onToggle(sticker)} aria-label={`Toggle ${sticker} sticker`} aria-pressed={selected.includes(sticker)}>{sticker}</motion.button>)}</div></section>;
}
