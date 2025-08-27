import { Container } from '@/components/common/Container'
import { Section } from '@/components/common/Section'
import { Grid } from '@/components/common/Grid'
import { AnimatedSection } from '@/components/common/AnimatedSection'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useScrollProgress, useIsMobile } from '@/hooks'
import { Rocket, Github, Mail } from 'lucide-react'

function App() {
  const scrollProgress = useScrollProgress()
  const isMobile = useIsMobile()

  return (
    <>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-800 z-50">
        <div 
          className="h-full bg-gradient-to-r from-accent-cyan to-accent-purple transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <Section fullHeight centered>
        <Container>
          <AnimatedSection animation="fadeIn">
            <Heading as="h1" size="5xl" gradient className="text-center mb-6">
              Portfolio v2.0
            </Heading>
          </AnimatedSection>
          
          <AnimatedSection animation="slideUp" delay={0.2}>
            <Text size="xl" muted className="text-center mb-8">
              Component Library Test - {isMobile ? 'Mobile' : 'Desktop'} View
            </Text>
          </AnimatedSection>

          <AnimatedSection animation="scale" delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button icon={Rocket} size="lg">
                Get Started
              </Button>
              <Button variant="secondary" icon={Github} size="lg">
                View Code
              </Button>
              <Button variant="outline" icon={Mail} size="lg">
                Contact
              </Button>
            </div>
          </AnimatedSection>

          <Grid cols={3} gap={6}>
            <AnimatedSection animation="slideUp" delay={0.6}>
              <Card hover>
                <Heading as="h3" size="lg" className="mb-2">
                  Feature 1
                </Heading>
                <Text muted>
                  This is a test card with hover effects
                </Text>
              </Card>
            </AnimatedSection>

            <AnimatedSection animation="slideUp" delay={0.7}>
              <Card hover gradient>
                <Heading as="h3" size="lg" className="mb-2">
                  Feature 2
                </Heading>
                <Text muted>
                  This card has a gradient background
                </Text>
              </Card>
            </AnimatedSection>

            <AnimatedSection animation="slideUp" delay={0.8}>
              <Card hover>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6" />
              </Card>
            </AnimatedSection>
          </Grid>
        </Container>
      </Section>
    </>
  )
}

export default App