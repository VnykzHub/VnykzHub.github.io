import { Section, Container, AnimatedSection, Grid } from '@/components/common'
import { Eyebrow, Heading, Text, Card } from '@/components/ui'
import { Boxes, Brain, Cloud, Server } from 'lucide-react'
import { skillGroups, TIER_LABEL, TIER_ORDER, type SkillGroup, type SkillTier } from '@/data/skills'

/**
 * Skills without progress bars.
 *
 * The previous version rendered 16 percentages ("Python 95%") that had no
 * source. Depth tiers replace them: each label is a claim that can be defended
 * in an interview, which a number cannot.
 */

const GROUP_ICON: Record<string, typeof Brain> = {
  'ai-engineering': Boxes,
  ml: Brain,
  platform: Server,
  cloud: Cloud,
}

const ACCENT_TEXT = {
  amber: 'text-accent-amber',
  patina: 'text-accent-patina',
  rust: 'text-accent-rust',
} as const

const ACCENT_BG = {
  amber: 'bg-[var(--accent-1)]/15',
  patina: 'bg-[var(--accent-2)]/15',
  rust: 'bg-[var(--accent-3)]/15',
} as const

/** Solid dot for daily, ringed for production, hollow for working knowledge. */
function TierMark({ tier, accent }: { tier: SkillTier; accent: SkillGroup['accent'] }) {
  const color = ACCENT_TEXT[accent]
  if (tier === 'daily') return <span className={`h-1.5 w-1.5 rounded-full bg-current ${color}`} />
  if (tier === 'production')
    return <span className={`h-1.5 w-1.5 rounded-full border border-current ${color}`} />
  return <span className="h-1.5 w-1.5 rounded-full border border-[var(--rule)]" />
}

function GroupCard({ group }: { group: SkillGroup }) {
  const Icon = GROUP_ICON[group.id] ?? Brain

  return (
    <Card hover className="h-full">
      <div className="mb-5 flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ACCENT_BG[group.accent]}`}
        >
          <Icon className={ACCENT_TEXT[group.accent]} size={20} />
        </div>
        <div>
          <Heading as="h3" size="lg">
            {group.label}
          </Heading>
          <Text size="sm" muted className="mt-0.5">
            {group.blurb}
          </Text>
        </div>
      </div>

      <div className="space-y-4">
        {TIER_ORDER.map((tier) => {
          const items = group.skills.filter((s) => s.tier === tier)
          if (items.length === 0) return null

          return (
            <div key={tier}>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                {TIER_LABEL[tier]}
              </p>
              <ul className="flex flex-wrap gap-x-2 gap-y-2">
                {items.map((skill) => (
                  <li
                    key={skill.name}
                    className="flex items-center gap-1.5 rounded-md border border-[var(--rule)] bg-[var(--panel2)] px-2.5 py-1"
                  >
                    <TierMark tier={tier} accent={group.accent} />
                    {skill.evidence ? (
                      <a
                        href={skill.evidence.href}
                        className="text-xs text-[var(--ink)] underline decoration-dotted underline-offset-2 hover:text-accent-patina"
                      >
                        {skill.name}
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--ink)]">{skill.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function Skills() {
  return (
    <Section id="skills">
      <Container>
        <AnimatedSection animation="fadeIn">
          <Eyebrow>Skills</Eyebrow>
          <Heading as="h2" size="3xl" gradient className="mb-4 text-center">
            Technical Skills
          </Heading>
          <Text size="lg" muted className="mx-auto mb-4 max-w-2xl text-center">
            Grouped by what they are for, and graded by how far I have actually taken them —
            not by a percentage I made up.
          </Text>

          {/* Legend. The tiers only mean something if they are stated. */}
          <ul className="mx-auto mb-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {TIER_ORDER.map((tier) => (
              <li key={tier} className="flex items-center gap-2">
                <TierMark tier={tier} accent="amber" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                  {TIER_LABEL[tier]}
                </span>
              </li>
            ))}
          </ul>
        </AnimatedSection>

        <Grid cols={2} gap={6}>
          {skillGroups.map((group, index) => (
            <AnimatedSection key={group.id} animation="slideUp" delay={index * 0.1}>
              <GroupCard group={group} />
            </AnimatedSection>
          ))}
        </Grid>
      </Container>
    </Section>
  )
}
