// src/components/projects/ProjectModal.tsx
import { motion } from 'framer-motion'
import { X, Github, Maximize2 } from 'lucide-react'
import { Heading, Text, Button } from '@/components/ui'
import { DemoLoader } from './DemoLoader'
import type { Project } from '@/data/projects'

interface ProjectModalProps {
  project: Project
  onClose: () => void
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[var(--paper)]/80 backdrop-blur-sm" />
      
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[90vh] bg-[var(--panel)] rounded-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between p-6 border-b border-[var(--rule)]">
          <div>
            <Heading as="h2" size="2xl" className="mb-2">
              {project.title}
            </Heading>
            <Text muted>{project.subtitle}</Text>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--panel2)] rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <div className="space-y-4">
            <div className="aspect-video bg-[var(--panel2)] rounded-lg overflow-hidden">
              <DemoLoader project={project} />
            </div>
            
            <div className="flex gap-4">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button fullWidth icon={Maximize2}>
                    Open Full Demo
                  </Button>
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button fullWidth variant="outline" icon={Github}>
                    View Code
                  </Button>
                </a>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <Heading as="h3" size="lg" className="mb-3">
                Overview
              </Heading>
              <Text muted>
                {project.longDescription || project.description}
              </Text>
            </div>
            
            {project.highlights && (
              <div>
                <Heading as="h3" size="lg" className="mb-3">
                  Key Features
                </Heading>
                <ul className="space-y-2">
                  {project.highlights.map((highlight, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-accent-cyan mt-1">•</span>
                      <Text size="sm" muted>{highlight}</Text>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {project.metrics && (
              <div>
                <Heading as="h3" size="lg" className="mb-3">
                  Impact Metrics
                </Heading>
                <div className="grid grid-cols-2 gap-4">
                  {project.metrics.map(metric => (
                    <div
                      key={metric.label}
                      className="bg-[var(--bar-track)]/80 rounded-lg p-3 text-center"
                    >
                      <Text size="xs" muted className="mb-1">
                        {metric.label}
                      </Text>
                      <Text
                        size="xl"
                        className={`font-bold ${
                          metric.improvement ? 'text-green-400' : 'text-accent-cyan'
                        }`}
                      >
                        {metric.value}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <Heading as="h3" size="lg" className="mb-3">
                Technologies Used
              </Heading>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map(tech => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-[var(--panel2)] rounded-full text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
