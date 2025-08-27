import { motion } from 'framer-motion'
import { Container, Section } from '@/components/common'
import { Heading, Text, Button } from '@/components/ui'
import { ArrowDown, Sparkles, Code2, Brain } from 'lucide-react'
import { Link as ScrollLink } from 'react-scroll'

export function Hero() {
  return (
    <Section id="home" fullHeight centered className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 via-transparent to-accent-cyan/10 opacity-30" />
      
      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700 mb-8"
          >
            <Sparkles className="w-4 h-4 text-accent-cyan" />
            <Text size="sm">AI Engineer | ML Specialist</Text>
          </motion.div>

          {/* Main heading */}
          <Heading as="h1" size="5xl" className="mb-6">
            Hi, I'm{' '}
            <span className="text-gradient">Vinayak Mathur</span>
          </Heading>

          {/* Animated text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Heading as="h2" size="2xl" className="mb-6 text-gray-300">
              I Build AI That{' '}
              <span className="text-accent-cyan">Solves Problems</span>
            </Heading>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Text size="lg" muted className="mb-8 max-w-2xl mx-auto">
              From Machine Learning to Generative AI, I create intelligent solutions 
              that drive innovation. Explore my journey through 21+ AI projects, 
              each telling a story of problem-solving and impact.
            </Text>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <ScrollLink to="projects" smooth duration={500} offset={-80}>
              <Button size="lg" icon={Code2}>
                Explore Projects
              </Button>
            </ScrollLink>
            <ScrollLink to="contact" smooth duration={500} offset={-80}>
              <Button size="lg" variant="outline" icon={Brain}>
                Let's Connect
              </Button>
            </ScrollLink>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, repeat: Infinity, duration: 2 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <ScrollLink to="about" smooth duration={500} offset={-80}>
              <div className="text-gray-400 hover:text-accent-cyan transition-colors cursor-pointer">
                <ArrowDown className="w-6 h-6 animate-bounce" />
              </div>
            </ScrollLink>
          </motion.div>
        </motion.div>
      </Container>
    </Section>
  )
}