import { motion } from 'framer-motion'
import { Code2, Brain, Cpu, Database, Cloud, GitBranch } from 'lucide-react'

const techIcons = [
  { Icon: Code2, color: 'text-blue-400', delay: 0 },
  { Icon: Brain, color: 'text-purple-400', delay: 0.5 },
  { Icon: Cpu, color: 'text-green-400', delay: 1 },
  { Icon: Database, color: 'text-yellow-400', delay: 1.5 },
  { Icon: Cloud, color: 'text-cyan-400', delay: 2 },
  { Icon: GitBranch, color: 'text-pink-400', delay: 2.5 },
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
