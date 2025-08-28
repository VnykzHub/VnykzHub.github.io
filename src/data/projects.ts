// src/data/projects.ts
export interface Project {
  id: string
  title: string
  subtitle: string
  description: string
  longDescription?: string
  category: 'ml' | 'dl' | 'genai'
  featured: boolean
  
  // URLs
  demoUrl?: string
  githubUrl?: string
  liveUrl?: string
  notebookUrl?: string
  
  // Display
  thumbnail: string
  images?: string[]
  videoDemo?: string
  
  // Tech & Metrics
  techStack: string[]
  metrics: {
    label: string
    value: string
    improvement?: boolean
  }[]
  
  // Features
  highlights: string[]
  challenges?: string[]
  learnings?: string[]
  
  // Integration
  embedStrategy?: 'iframe' | 'api' | 'component' | 'external'
  demoComponent?: string // Component name to lazy load
  
  // Meta
  duration?: string
  teamSize?: number
  role?: string
  impact?: string
}

export const projects: Project[] = [
  {
    id: 'multi-agent-system',
    title: 'Autonomous Multi-Agent System',
    subtitle: 'Enterprise Workflow Automation',
    description: 'Built enterprise-grade autonomous system with multiple specialized agents using Nvidia NIM framework',
    category: 'genai',
    featured: true,
    
    demoUrl: '/demos/multi-agent',
    githubUrl: 'https://github.com/VnykzHub/multi-agent-system',
    
    thumbnail: '/images/projects/multi-agent-thumb.jpg',
    
    techStack: ['Nvidia NIM', 'Langchain', 'Autogen', 'FastAPI', 'Docker', 'RAG'],
    
    metrics: [
      { label: 'Efficiency Gain', value: '+85%', improvement: true },
      { label: 'Error Reduction', value: '-65%', improvement: true },
      { label: 'Processing Time', value: '2.3s avg' },
      { label: 'Agents Deployed', value: '7' }
    ],
    
    highlights: [
      'Orchestrated 7 specialized AI agents for complex workflows',
      'Implemented inter-agent communication protocol',
      'Built custom memory management system',
      'Achieved 99.9% uptime in production'
    ],
    
    embedStrategy: 'iframe',
    impact: 'Saved 120+ hours/month of manual work'
  },
  
  // Add your other 20 projects here...
]

// Category metadata
export const categoryInfo = {
  ml: {
    label: 'Machine Learning',
    description: 'Classical ML algorithms and predictive modeling',
    icon: 'Brain',
    color: 'cyan'
  },
  dl: {
    label: 'Deep Learning', 
    description: 'Neural networks and computer vision',
    icon: 'Cpu',
    color: 'purple'
  },
  genai: {
    label: 'Generative AI',
    description: 'LLMs, RAG systems, and autonomous agents',
    icon: 'Sparkles',
    color: 'green'
  }
}
