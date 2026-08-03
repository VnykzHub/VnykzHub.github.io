// src/components/projects/ProjectGrid.tsx
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid } from '@/components/common'
import { ProjectCard } from './ProjectCard'
import { ProjectModal } from './ProjectModal'
import { categoryInfo } from '@/data/projects'
import type { Project } from '@/data/projects'

interface ProjectGridProps {
  projects: Project[]
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  
  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'all') return projects
    return projects.filter(p => p.category === selectedCategory)
  }, [projects, selectedCategory])
  
  return (
    <>
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg transition-all ${
            selectedCategory === 'all'
              ? 'bg-accent-cyan text-gray-900'
              : 'bg-[var(--bar-track)] text-[var(--ink-soft)] hover:bg-[var(--panel-border)]'
          }`}
        >
          All Projects ({projects.length})
        </button>
        
        {Object.entries(categoryInfo).map(([key, info]) => {
          const count = projects.filter(p => p.category === key).length
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedCategory === key
                  ? `bg-accent-${info.color} text-gray-900`
                  : 'bg-[var(--bar-track)] text-[var(--ink-soft)] hover:bg-[var(--panel-border)]'
              }`}
            >
              {info.label} ({count})
            </button>
          )
        })}
      </div>
      
      {/* Projects Grid with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Grid cols={3} gap={6}>
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onOpenDemo={() => setSelectedProject(project)}
              />
            ))}
          </Grid>
        </motion.div>
      </AnimatePresence>
      
      {/* Project Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
