'use client';

import { motion } from 'framer-motion';

interface MotionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function MotionHeader({ children, className }: MotionHeaderProps) {
  return (
    <motion.header
      className={className}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.header>
  );
}

interface MotionCardProps {
  children: React.ReactNode;
  className?: string;
  variants?: Record<string, unknown>;
  style?: React.CSSProperties;
}

export function MotionCard({ children, className, variants, style }: MotionCardProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      style={style}
    >
      {children}
    </motion.div>
  );
}

interface MotionSectionProps {
  children: React.ReactNode;
  className?: string;
  initial?: Record<string, unknown>;
  animate?: Record<string, unknown>;
  transition?: Record<string, unknown>;
}

export function MotionSection({ children, className, initial, animate, transition }: MotionSectionProps) {
  return (
    <motion.div
      className={className}
      initial={initial}
      animate={animate}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}