// src/components/projects/ProjectCard.tsx
import { motion } from 'framer-motion'
import { Card, Heading, Text, Button } from '@/components/ui'
import { Github, Play, ChevronRight } from 'lucide-react'
import type { Project } from '@/data/projects'
import { useState } from 'react'

interface ProjectCardProps {
  project: Project
  index?: number
  onOpenDemo?: () => void
}

export function ProjectCard({ project, index = 0, onOpenDemo }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full"
    >
      <Card hover className="h-full flex flex-col relative overflow-hidden group">
        <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20" />
          
          <motion.div
            className="absolute inset-0 bg-gray-900/90 flex items-center justify-center gap-4 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {project.demoUrl && (
              <Button
                size="sm"
                icon={Play}
                onClick={onOpenDemo}
                className="z-20"
              >
                Demo
              </Button>
            )}
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" icon={Github}>
                  Code
                </Button>
              </a>
            )}
          </motion.div>
          
          <div className="absolute top-4 left-4 z-20">
            <span className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${project.category === 'ml' ? 'bg-cyan-500/20 text-cyan-400' : ''}
              ${project.category === 'dl' ? 'bg-purple-500/20 text-purple-400' : ''}
              ${project.category === 'genai' ? 'bg-green-500/20 text-green-400' : ''}
            `}>
              {project.category.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <Heading as="h3" size="lg" className="mb-2">
            {project.title}
          </Heading>
          
          <Text size="sm" muted className="mb-4 flex-1">
            {project.description}
          </Text>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {project.techStack.slice(0, 4).map(tech => (
              <span
                key={tech}
                className="text-xs px-2 py-1 bg-gray-800/50 rounded-full text-gray-400"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 4 && (
              <span className="text-xs px-2 py-1 text-gray-500">
                +{project.techStack.length - 4} more
              </span>
            )}
          </div>
          
          {project.metrics && (
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-800">
              {project.metrics.slice(0, 2).map(metric => (
                <div key={metric.label} className="text-center">
                  <Text size="xs" muted>
                    {metric.label}
                  </Text>
                  <Text
                    size="sm"
                    className={`font-semibold ${
                      metric.improvement ? 'text-green-400' : 'text-accent-cyan'
                    }`}
                  >
                    {metric.value}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <motion.div
          className="absolute bottom-4 right-4"
          animate={{ x: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
        >
          <ChevronRight className="text-accent-cyan" size={20} />
        </motion.div>
      </Card>
    </motion.div>
  )
}
