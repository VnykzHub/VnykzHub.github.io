import { Section, Container, AnimatedSection, Grid } from '@/components/common'
import { Heading, Text, Card, Button } from '@/components/ui'
import { Code2, ExternalLink, ArrowUpRight, Cpu, Users, FileText } from 'lucide-react'
import { useState } from 'react'

const projects = [
  {
    id: 1,
    title: 'Autonomous Multi-Agent System',
    description: 'Enterprise-grade autonomous system with multiple specialized agents for workflow automation using Nvidia NIM framework',
    icon: Users,
    color: 'cyan',
    tech: ['Nvidia NIM', 'Langchain', 'RAG', 'Python'],
    metrics: { efficiency: '+85%', errors: '-65%' }
  },
  {
    id: 2,
    title: 'AI Interview Platform',
    description: 'Automated interview platform with GPT & Claude, real-time speech processing, achieving 99.9% uptime',
    icon: Cpu,
    color: 'purple',
    tech: ['OpenAI', 'Claude', 'Kubernetes', 'AWS'],
    metrics: { uptime: '99.9%', cost: '-40%' }
  },
  {
    id: 3,
    title: 'Big 4 Audit Automation',
    description: 'RAG-driven automation with multimodal document processing, reducing audit prep by 65%',
    icon: FileText,
    color: 'green',
    tech: ['RAG', 'NLP', 'Streamlit', 'Document AI'],
    metrics: { time: '-65%', accuracy: '+30%' }
  }
]

export function Projects() {
  const [hoveredProject, setHoveredProject] = useState<number | null>(null)

  return (
    <Section id="projects">
      <Container>
        <AnimatedSection animation="fadeIn">
          <Heading as="h2" size="3xl" gradient className="text-center mb-4">
            Featured Projects
          </Heading>
          <Text size="lg" muted className="text-center max-w-2xl mx-auto mb-12">
            21+ AI projects showcasing expertise in LLMs, Multi-Agent Systems, and Enterprise AI
          </Text>
        </AnimatedSection>

        <Grid cols={3} gap={6}>
          {projects.map((project, index) => {
            const Icon = project.icon
            const isHovered = hoveredProject === project.id
            
            return (
              <AnimatedSection key={project.id} animation="slideUp" delay={index * 0.1}>
                <Card 
                  hover 
                  className="relative h-full group"
                  onMouseEnter={() => setHoveredProject(project.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all
                    ${project.color === 'cyan' ? 'bg-accent-cyan/20 group-hover:bg-accent-cyan/30' : ''}
                    ${project.color === 'purple' ? 'bg-accent-purple/20 group-hover:bg-accent-purple/30' : ''}
                    ${project.color === 'green' ? 'bg-accent-green/20 group-hover:bg-accent-green/30' : ''}
                  `}>
                    <Icon className={`
                      ${project.color === 'cyan' ? 'text-accent-cyan' : ''}
                      ${project.color === 'purple' ? 'text-accent-purple' : ''}
                      ${project.color === 'green' ? 'text-accent-green' : ''}
                    `} size={24} />
                  </div>

                  {/* Content */}
                  <Heading as="h3" size="lg" className="mb-3">
                    {project.title}
                  </Heading>
                  <Text muted size="sm" className="mb-4">
                    {project.description}
                  </Text>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tech.map((tech) => (
                      <span key={tech} className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-400">
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Metrics */}
                  <div className="flex gap-4 text-sm">
                    {Object.entries(project.metrics).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-500 capitalize">{key}: </span>
                        <span className="text-accent-cyan font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hover Overlay */}
                  <div className={`absolute inset-0 bg-gray-900/95 rounded-xl flex items-center justify-center gap-4 transition-opacity ${
                    isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}>
                    <Button size="sm" variant="outline" icon={Code2}>
                      Code
                    </Button>
                    <Button size="sm" icon={ExternalLink}>
                      Demo
                    </Button>
                  </div>
                </Card>
              </AnimatedSection>
            )
          })}
        </Grid>

        <AnimatedSection animation="fadeIn" delay={0.4} className="text-center mt-8">
          <Button size="lg" variant="outline" icon={ArrowUpRight}>
            View All 21+ Projects
          </Button>
        </AnimatedSection>
      </Container>
    </Section>
  )
}
