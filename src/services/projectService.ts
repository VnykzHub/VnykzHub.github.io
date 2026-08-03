// src/services/projectService.ts
import { projects, type Project } from '@/data/projects'

export class ProjectService {
  static getAll(): Project[] {
    return projects
  }
  
  static getFeatured(): Project[] {
    return projects.filter(p => p.featured)
  }
  
  static getByCategory(category: 'ml' | 'dl' | 'genai'): Project[] {
    return projects.filter(p => p.category === category)
  }
  
  static getById(id: string): Project | undefined {
    return projects.find(p => p.id === id)
  }
  
  static search(query: string): Project[] {
    const searchTerm = query.toLowerCase()
    return projects.filter(p => 
      p.title.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.techStack.some(tech => tech.toLowerCase().includes(searchTerm))
    )
  }
  
  static getRelated(projectId: string, limit = 3): Project[] {
    const project = this.getById(projectId)
    if (!project) return []
    
    return projects
      .filter(p => p.id !== projectId && p.category === project.category)
      .slice(0, limit)
  }
}