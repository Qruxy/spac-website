/**
 * Animated Components
 *
 * Re-exports all animated components.
 * These components use Framer Motion for smooth animations.
 */

export { StarField } from './star-field';
export { SpotlightCard } from './spotlight-card';
export { FadeIn } from './fade-in';
export { AnimatedCounter } from './animated-counter';
export { CircularText } from './circular-text';
export { LogoBadge } from './logo-badge';
export { default as Galaxy } from './galaxy';
export { Lanyard } from './lanyard';

// React Bits components
export { BlurText } from './blur-text';
export { ShinyText } from './shiny-text';
export { CountUp } from './count-up';
export { ScrollFloat } from './scroll-float';
export { AnimatedList } from './animated-list';
export { GradientText } from './gradient-text';
export { RotatingText } from './rotating-text';
export { TiltedCard } from './tilted-card';
export { StarBorder } from './star-border';
export { GradualBlur } from './gradual-blur';
export { MagicBento, BentoTile } from './magic-bento';
export { ChromaGrid, type ChromaGridItem } from './chroma-grid';
export { ProfileCard } from './profile-card';
export { GooeyNav, type NavItem } from './gooey-nav';
export { DigitCounter } from './digit-counter';
export { Stepper } from './stepper';

// Background effects (use dynamic import with ssr: false for WebGL components)
export { default as Aurora } from './aurora';
export { default as Beams } from './beams';
export { default as ScrollReveal } from './scroll-reveal';

// Gallery components (use dynamic import with ssr: false for heavy components)
export { Masonry, type MasonryItem } from './masonry';
export { CircularGallery, type CircularGalleryProps } from './circular-gallery';
export { GlareHover } from './glare-hover';
