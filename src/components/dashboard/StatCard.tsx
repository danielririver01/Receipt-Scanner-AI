'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgFrom: string;
  iconBgTo: string;
  glowColor: string;
  badge: string;
  badgeVariant: string;
  title: string;
  value: string;
  subtitle?: string;
  delay?: number;
  colSpan?: string;
  children?: React.ReactNode;
}

const badgeVariantClasses: Record<string, string> = {
  orange: 'badge badge-orange',
  emerald: 'badge badge-emerald',
  ruby: 'badge badge-ruby',
};

export default function StatCard({
  icon: Icon,
  iconColor,
  iconBgFrom,
  iconBgTo,
  glowColor,
  badge,
  badgeVariant,
  title,
  value,
  subtitle,
  delay = 0,
  colSpan = '',
  children
}: StatCardProps) {
  return (
    <motion.div
      className={`stat-card rounded-3xl p-6 group relative overflow-hidden ${colSpan}`}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }
      }}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${glowColor} rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`} />

      <div className="flex items-center justify-between mb-6 relative">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconBgFrom} to-${iconBgTo} flex items-center justify-center glow-icon`}>
          <Icon className={`w-7 h-7 ${iconColor}`} />
        </div>
        <span className={badgeVariantClasses[badgeVariant] || 'badge badge-emerald'}>{badge}</span>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-4xl font-black tracking-tight">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      {children}
    </motion.div>
  );
}
