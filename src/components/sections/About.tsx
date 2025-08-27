import { Section, Container, AnimatedSection, Grid } from '@/components/common'
import { Heading, Text, Card } from '@/components/ui'
import { GraduationCap, Award, Target, Sparkles } from 'lucide-react'

export function About() {
  return (
    <Section id="about" className="bg-gray-900/50">
      <Container>
        <AnimatedSection animation="fadeIn">
          <Heading as="h2" size="3xl" gradient className="text-center mb-4">
            About Me
          </Heading>
          <Text size="lg" muted className="text-center max-w-2xl mx-auto mb-12">
            Transforming ideas into intelligent solutions
          </Text>
        </AnimatedSection>

        <Grid cols={3} gap={6}>
          <AnimatedSection animation="slideUp" delay={0.1}>
            <Card hover className="text-center h-full">
              <div className="w-12 h-12 bg-accent-cyan/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="text-accent-cyan" size={24} />
              </div>
              <Heading as="h3" size="lg" className="mb-3">
                Mission Driven
              </Heading>
              <Text muted size="sm">
                Generative AI expert with hands-on experience in fine-tuning LLMs and building autonomous multi-agent systems
              </Text>
            </Card>
          </AnimatedSection>

          <AnimatedSection animation="slideUp" delay={0.2}>
            <Card hover className="text-center h-full">
              <div className="w-12 h-12 bg-accent-purple/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="text-accent-purple" size={24} />
              </div>
              <Heading as="h3" size="lg" className="mb-3">
                Continuous Learning
              </Heading>
              <Text muted size="sm">
                Pursuing Master's in Data Science at Deakin University while staying updated with latest AI advancements
              </Text>
            </Card>
          </AnimatedSection>

          <AnimatedSection animation="slideUp" delay={0.3}>
            <Card hover className="text-center h-full">
              <div className="w-12 h-12 bg-accent-green/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Award className="text-accent-green" size={24} />
              </div>
              <Heading as="h3" size="lg" className="mb-3">
                Industry Certified
              </Heading>
              <Text muted size="sm">
                NVIDIA-Certified Associate in Generative AI LLMs with expertise across cloud platforms
              </Text>
            </Card>
          </AnimatedSection>
        </Grid>

        <AnimatedSection animation="fadeIn" delay={0.4} className="mt-12">
          <Card gradient className="text-center p-8">
            <Sparkles className="text-accent-cyan mx-auto mb-4" size={32} />
            <Text size="lg" className="max-w-3xl mx-auto">
              Seeking to leverage deep expertise in generative AI, NLP, and ML model development to solve complex problems 
              and build cutting-edge intelligent systems across industries.
            </Text>
          </Card>
        </AnimatedSection>
      </Container>
    </Section>
  )
}
