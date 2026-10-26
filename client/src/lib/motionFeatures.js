// Движок анимаций framer-motion (включая layout/layoutId) — отдельным чанком.
// Его подгружает LazyMotion в App после первой отрисовки; до этого m.* рендерятся без анимаций.
export { domMax as default } from 'framer-motion';
