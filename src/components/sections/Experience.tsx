import { Section, Container, AnimatedSection } from '@/components/common'
import { Heading, Text, Card } from '@/components/ui'
import { Building2, Calendar, MapPin, ChevronRight } from 'lucide-react'

const experiences = [
  {
    title: 'Associate AI Engineer',
    company: 'Cognizant',
    location: 'Gurugram, Haryana',
    duration: 'July 2022 – Present',
    current: true,
    achievements: [
      'Architected autonomous multi-agent system using Nvidia NIM framework',
      'Developed automated interview platform with 99.9% uptime',
      'Deployed RAG-driven audit automation reducing prep time by 65%',
      'Led LLM benchmarking research (GPT, Claude, Llama, Gemini)'
    ]
  },
  {
    title: 'AI/ML Intern',
    company: 'Cognizant',
    location: 'Pune, Maharashtra',
    duration: 'Jan 2022 - Jul 2022',
    current: false,
    achievements: [
      'Developed predictive models using Random Forest, GBM, Neural Networks',
      'Conducted sentiment analysis for actionable insights extraction'
    ]
  },
  {
    title: 'Samsung PRISM Researcher',
    company: 'Samsung R&D',
    location: 'Bangalore, India',
    duration: 'Oct 2020 – Mar 2021',
    current: false,
    achievements: [
      'Built hybrid sound classification engine with 4.44% EER',
      'Implemented Residual Squeeze-and-Excitation Networks',
      'Published research at ICCNT 2021 conference'
    ]
  }
]

export function Experience() {
  return (
    <Section id="experience" className="bg-gray-900/50">
      <Container>
        <AnimatedSection animation="fadeIn">
          <Heading as="h2" size="3xl" gradient className="text-center mb-4">
            Experience
          </Heading>
          <Text size="lg" muted className="text-center max-w-2xl mx-auto mb-12">
            Building AI solutions that drive real business impact
          </Text>
        </AnimatedSection>

        <div className="max-w-4xl mx-auto">
          {experiences.map((exp, index) => (
            <AnimatedSection key={index} animation="slideUp" delay={index * 0.1}>
              <div className="relative">
                {/* Timeline line */}
                {index !== experiences.length - 1 && (
                  <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gray-800" />
                )}
                
                <Card hover className="mb-8 relative">
                  {/* Timeline dot */}
                  <div className={`absolute -left-2 top-6 w-4 h-4 rounded-full border-2 ${
                    exp.current 
                      ? 'bg-accent-cyan border-accent-cyan animate-pulse' 
                      : 'bg-gray-700 border-gray-600'
                  }`} />

                  <div className="ml-8">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <Heading as="h3" size="xl" className="mb-1">
                          {exp.title}
                        </Heading>
                        <div className="flex items-center gap-4 text-gray-400">
                          <span className="flex items-center gap-1">
                            <Building2 size={16} />
                            {exp.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={16} />
                            {exp.location}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <Text size="sm" className={exp.current ? 'text-accent-cyan' : 'text-gray-400'}>
                          {exp.duration}
                        </Text>
                      </div>
                    </div>

                    {/* Achievements */}
                    <ul className="space-y-2">
                      {exp.achievements.map((achievement, i) => (
                        <li key={i} className="flex gap-2">
                          <ChevronRight size={16} className="text-accent-cyan mt-0.5 flex-shrink-0" />
                          <Text size="sm" muted>
                            {achievement}
                          </Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </Container>
    </Section>
  )
}
