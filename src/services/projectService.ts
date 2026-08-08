// src/services/projectService.ts
import { projects, type Project } from '@/data/projects'

export function getAllProjects(): Project[] {
  return projects
}

export function getFeaturedProjects(): Project[] {
  return projects.filter(p => p.featured)
}

export function getProjectsByCategory(category: 'ml' | 'dl' | 'genai'): Project[] {
  return projects.filter(p => p.category === category)
}

export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id)
}

export function getProjectCount(): number {
  return projects.length
}
