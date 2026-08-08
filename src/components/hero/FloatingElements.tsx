'use client'

import { motion } from 'framer-motion'
import { Code2, Brain, Cpu, Database, Cloud, GitBranch } from 'lucide-react'

// Cycles the three accent tokens rather than six stock Tailwind hues. The old
// blue/purple/green/yellow/cyan/pink rainbow predated the design system.
const techIcons = [
  { Icon: Code2,     color: 'text-accent-amber',  delay: 0 },
  { Icon: Brain,     color: 'text-accent-patina', delay: 0.5 },
  { Icon: Cpu,       color: 'text-accent-rust',   delay: 1 },
  { Icon: Database,  color: 'text-accent-amber',  delay: 1.5 },
  { Icon: Cloud,     color: 'text-accent-patina', delay: 2 },
  { Icon: GitBranch, color: 'text-accent-rust',   delay: 2.5 },
]

export function FloatingElements() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {techIcons.map(({ Icon, color, delay }, index) => (
        <motion.div
          key={index}
          className={`absolute ${color} opacity-20`}
          style={{
            left: `${15 + (index * 15)}%`,
            top: `${20 + (index % 2) * 60}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.2, 1],
            y: [0, -20, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 10,
            delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Icon size={32} />
        </motion.div>
      ))}
    </div>
  )
}
