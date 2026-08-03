import { Section, Container, AnimatedSection, Grid } from '@/components/common'
import { Eyebrow, Heading, Text, Card } from '@/components/ui'
import { Code2, Brain, Cloud, Layers } from 'lucide-react'

const skillCategories = [
  {
    title: 'Programming',
    icon: Code2,
    color: 'cyan',
    skills: [
      { name: 'Python', level: 95 },
      { name: 'JavaScript/TypeScript', level: 85 },
      { name: 'SQL', level: 90 },
      { name: 'NoSQL', level: 85 }
    ]
  },
  {
    title: 'AI/ML',
    icon: Brain,
    color: 'purple',
    skills: [
      { name: 'LLMs & Generative AI', level: 95 },
      { name: 'Multi-Agent Systems', level: 90 },
      { name: 'RAG Systems', level: 95 },
      { name: 'NLP & Deep Learning', level: 90 }
    ]
  },
  {
    title: 'Frameworks',
    icon: Layers,
    color: 'green',
    skills: [
      { name: 'Langchain & Autogen', level: 95 },
      { name: 'PyTorch & HuggingFace', level: 85 },
      { name: 'FastAPI & Flask', level: 85 },
      { name: 'Nvidia NIM', level: 85 }
    ]
  },
  {
    title: 'Cloud & MLOps',
    icon: Cloud,
    color: 'blue',
    skills: [
      { name: 'AWS & Azure', level: 85 },
      { name: 'Docker & Kubernetes', level: 80 },
      { name: 'Git & CI/CD', level: 90 },
      { name: 'MLOps', level: 80 }
    ]
  }
]

export function Skills() {
  return (
    <Section id="skills">
      <Container>
        <AnimatedSection animation="fadeIn">
          <Eyebrow>Skills</Eyebrow>
          <Heading as="h2" size="3xl" gradient className="text-center mb-4">
            Technical Skills
          </Heading>
          <Text size="lg" muted className="text-center max-w-2xl mx-auto mb-12">
            Comprehensive expertise across the AI/ML technology stack
          </Text>
        </AnimatedSection>

        <Grid cols={2} gap={6}>
          {skillCategories.map((category, index) => {
            const Icon = category.icon
            
            return (
              <AnimatedSection key={category.title} animation="slideUp" delay={index * 0.1}>
                <Card hover className="h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                      ${category.color === 'cyan' ? 'bg-accent-amber/20' : ''}
                      ${category.color === 'purple' ? 'bg-accent-patina/20' : ''}
                      ${category.color === 'green' ? 'bg-accent-rust/20' : ''}
                      ${category.color === 'blue' ? 'bg-accent-amber/20' : ''}
                    `}>
                      <Icon className={`
                        ${category.color === 'cyan' ? 'text-accent-amber' : ''}
                        ${category.color === 'purple' ? 'text-accent-patina' : ''}
                        ${category.color === 'green' ? 'text-accent-rust' : ''}
                        ${category.color === 'blue' ? 'text-accent-amber' : ''}
                      `} size={20} />
                    </div>
                    <Heading as="h3" size="lg">
                      {category.title}
                    </Heading>
                  </div>

                  <div className="space-y-4">
                    {category.skills.map((skill) => (
                      <div key={skill.name}>
                        <div className="flex justify-between mb-1">
                          <Text size="sm">{skill.name}</Text>
                          <Text size="sm" muted>{skill.level}%</Text>
                        </div>
                        <div className="h-2 bg-[var(--bar-track)] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out
                              ${category.color === 'cyan' ? 'bg-gradient-to-r from-accent-amber to-accent-patina' : ''}
                              ${category.color === 'purple' ? 'bg-gradient-to-r from-accent-patina to-accent-amber' : ''}
                              ${category.color === 'green' ? 'bg-gradient-to-r from-accent-rust to-accent-amber' : ''}
                              ${category.color === 'blue' ? 'bg-gradient-to-r from-accent-amber to-accent-rust' : ''}
                            `}
                            style={{ width: `${skill.level}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </AnimatedSection>
            )
          })}
        </Grid>
      </Container>
    </Section>
  )
}
