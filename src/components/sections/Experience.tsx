import { Section, Container, AnimatedSection } from '@/components/common'
import { Heading, Text, Card, Eyebrow } from '@/components/ui'
import { experiences } from "@/data/experience"
import { Building2, Calendar, MapPin, ChevronRight } from 'lucide-react'

export function Experience() {
  return (
    <Section id="experience" className="bg-[var(--panel)]/20">
      <Container>
        <AnimatedSection animation="fadeIn">
          <Eyebrow>Experience</Eyebrow>
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
                  <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-[var(--rule)]" />
                )}
                
                <Card hover className="mb-8 relative">
                  {/* Timeline dot */}
                  <div className={`absolute -left-2 top-6 w-4 h-4 rounded-full border-2 ${
                    exp.current 
                      ? 'bg-accent-cyan border-accent-cyan animate-pulse' 
                      : 'bg-[var(--ink-faint)] border-[var(--ink-faint)]'
                  }`} />

                  <div className="ml-8">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <Heading as="h3" size="xl" className="mb-1">
                          {exp.title}
                        </Heading>
                        <div className="flex items-center gap-4 text-[var(--ink-soft)]">
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
                        <Calendar size={16} className="text-[var(--ink-soft)]" />
                        <Text size="sm" className={exp.current ? 'text-accent-cyan' : 'text-[var(--ink-soft)]'}>
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
