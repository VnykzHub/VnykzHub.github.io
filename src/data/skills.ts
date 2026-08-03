/**
 * Skills, framed by depth rather than by invented percentage.
 *
 * The version this replaces rendered 16 progress bars — "Python 95%",
 * "Langchain & Autogen 95%", "MLOps 80%". Those numbers had no source and could
 * not survive being asked about in an interview, which is the opposite of what
 * a skills section is for.
 *
 * Three tiers, each meaning something defensible out loud:
 *
 *   daily      — reached for without thinking; used this month
 *   production — shipped and operated in a real system with real users
 *   working    — productive in it, no claim to depth
 *
 * ML and AI Engineering are deliberately separate groups: they are hired for
 * differently, and conflating them reads as not knowing the difference.
 *
 * TIER PLACEMENT NEEDS REVIEW — derived from resume prominence, which is a
 * proxy and not a source. Anything not defensible in an interview should move
 * down a tier.
 *
 * Next step (PROJECT_REPO_PLAN Wave 2): populate `evidence` so each claim links
 * to the project that proves it, turning assertion into citation.
 */

export type SkillTier = 'daily' | 'production' | 'working'

export interface Skill {
  name: string
  tier: SkillTier
  /** Repo or demo demonstrating this. Wired up as projects land. */
  evidence?: { label: string; href: string }
}

export interface SkillGroup {
  id: string
  label: string
  /** One line on what this group is for — a stranger should get it instantly. */
  blurb: string
  accent: 'amber' | 'patina' | 'rust'
  skills: Skill[]
}

export const TIER_LABEL: Record<SkillTier, string> = {
  daily: 'Daily driver',
  production: 'Shipped to production',
  working: 'Working knowledge',
}

export const TIER_ORDER: SkillTier[] = ['daily', 'production', 'working']

export const skillGroups: SkillGroup[] = [
  {
    id: 'ai-engineering',
    label: 'AI Engineering',
    blurb: 'Getting language models to behave inside production systems.',
    accent: 'amber',
    skills: [
      { name: 'RAG pipelines', tier: 'daily' },
      { name: 'Multi-agent orchestration', tier: 'daily' },
      { name: 'LangGraph', tier: 'daily' },
      { name: 'Google ADK', tier: 'daily' },
      { name: 'Prompt & context engineering', tier: 'daily' },
      { name: 'Vertex AI', tier: 'daily' },
      { name: 'Azure OpenAI', tier: 'production' },
      { name: 'LangChain', tier: 'production' },
      { name: 'Autogen', tier: 'production' },
      { name: 'Nvidia NIM', tier: 'production' },
      { name: 'Vector search', tier: 'production' },
      { name: 'MCP / A2A', tier: 'production' },
      { name: 'LLM evaluation', tier: 'working' },
      { name: 'Guardrails & structured output', tier: 'working' },
    ],
  },
  {
    id: 'ml',
    label: 'Machine Learning & Research',
    blurb: 'Training and evaluating models, rather than calling someone else’s.',
    accent: 'patina',
    skills: [
      { name: 'PyTorch', tier: 'production' },
      { name: 'TensorFlow', tier: 'production' },
      { name: 'HuggingFace', tier: 'production' },
      { name: 'NLP', tier: 'production' },
      { name: 'Deep learning', tier: 'production' },
      { name: 'Classical ML (RF, GBM)', tier: 'production' },
      { name: 'Speaker verification', tier: 'production' },
      { name: 'Distributed training (DDP)', tier: 'working' },
      { name: 'Quantization', tier: 'working' },
      { name: 'Pretraining from scratch', tier: 'working' },
    ],
  },
  {
    id: 'platform',
    label: 'Platform & Backend',
    blurb: 'The services the models actually run inside.',
    accent: 'rust',
    skills: [
      { name: 'Python', tier: 'daily' },
      { name: 'FastAPI', tier: 'daily' },
      { name: 'SQL', tier: 'daily' },
      { name: 'REST API design', tier: 'daily' },
      { name: 'Pub/Sub & async pipelines', tier: 'production' },
      { name: 'Microservices', tier: 'production' },
      { name: 'PostgreSQL', tier: 'production' },
      { name: 'Firestore / MongoDB', tier: 'production' },
      { name: 'TypeScript', tier: 'production' },
      { name: 'Flask', tier: 'working' },
      { name: 'gRPC', tier: 'working' },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud & MLOps',
    blurb: 'Shipping it, running it, and knowing when it breaks.',
    accent: 'amber',
    skills: [
      { name: 'GCP (Cloud Run, Vertex AI, BigQuery)', tier: 'daily' },
      { name: 'Docker', tier: 'daily' },
      { name: 'GitHub Actions / CI-CD', tier: 'daily' },
      { name: 'Cloud Build', tier: 'production' },
      { name: 'Kubernetes', tier: 'production' },
      { name: 'Azure', tier: 'production' },
      { name: 'AWS', tier: 'production' },
      { name: 'SonarQube', tier: 'production' },
      { name: 'Observability & tracing', tier: 'working' },
    ],
  },
]
