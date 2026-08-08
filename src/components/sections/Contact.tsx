import { Section, Container, AnimatedSection, Grid } from '@/components/common'
import { Heading, Text, Card, Button, Eyebrow } from '@/components/ui'
import { Mail, Phone, Linkedin, Github, Send, MapPin } from 'lucide-react'
import { useState } from 'react'

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    if (import.meta.env.DEV) console.log('Form submitted:', formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <Section id="contact" className="bg-[var(--panel)]/20">
      <Container>
        <AnimatedSection animation="fadeIn">
          <Eyebrow>Contact</Eyebrow>
          <Heading as="h2" size="3xl" gradient className="text-center mb-4">
            Let's Connect
          </Heading>
          <Text size="lg" muted className="text-center max-w-2xl mx-auto mb-12">
            Ready to build something amazing with AI? Let's discuss how we can work together
          </Text>
        </AnimatedSection>

        <Grid cols={2} gap={8}>
          {/* Contact Info */}
          <AnimatedSection animation="slideRight" delay={0.2}>
            <div className="space-y-6">
              <Card hover>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--accent-1)]/20 rounded-lg flex items-center justify-center">
                    <Mail className="text-accent-amber" size={24} />
                  </div>
                  <div>
                    <Text size="sm" muted>Email</Text>
                    <a href="mailto:vinayak.k.mathur@gmail.com" className="text-lg hover:text-accent-amber transition-colors">
                      vinayak.k.mathur@gmail.com
                    </a>
                  </div>
                </div>
              </Card>

              <Card hover>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--accent-2)]/20 rounded-lg flex items-center justify-center">
                    <Phone className="text-accent-patina" size={24} />
                  </div>
                  <div>
                    <Text size="sm" muted>Phone</Text>
                    <Text size="lg">+91 9460041703</Text>
                  </div>
                </div>
              </Card>

              <Card hover>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--accent-3)]/20 rounded-lg flex items-center justify-center">
                    <MapPin className="text-accent-rust" size={24} />
                  </div>
                  <div>
                    <Text size="sm" muted>Location</Text>
                    <Text size="lg">Hyderabad, India</Text>
                  </div>
                </div>
              </Card>

              <div className="flex gap-4 mt-6">
                <a
                  href="https://linkedin.com/in/vinayakmathur2000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" fullWidth icon={Linkedin}>
                    LinkedIn
                  </Button>
                </a>
                <a
                  href="https://github.com/VnykzHub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" fullWidth icon={Github}>
                    GitHub
                  </Button>
                </a>
              </div>
            </div>
          </AnimatedSection>

          {/* Contact Form */}
          <AnimatedSection animation="slideLeft" delay={0.3}>
            <Card>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-[var(--panel)] border border-[var(--card-border)] rounded-lg focus:outline-none focus:border-accent-amber transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-[var(--panel)] border border-[var(--card-border)] rounded-lg focus:outline-none focus:border-accent-amber transition-colors"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-2 bg-[var(--panel)] border border-[var(--card-border)] rounded-lg focus:outline-none focus:border-accent-amber transition-colors resize-none"
                    placeholder="Tell me about your project..."
                  />
                </div>

                <Button type="submit" fullWidth size="lg" icon={Send}>
                  Send Message
                </Button>
              </form>
            </Card>
          </AnimatedSection>
        </Grid>
      </Container>
    </Section>
  )
}
