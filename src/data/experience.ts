/**
 * Source of truth: resume (resume_faangpath.tex), corrected by Vinayak 2026-08-03.
 *
 * The previous version had Cognizant marked `current: true` running "July 2022 –
 * Present" and did not mention Deloitte at all. Deloitte has been the current
 * role since November 2025.
 *
 * Deloitte bullets describe the platform, not the client. The resume's SELECTED
 * PROJECTS section is deliberately NOT mirrored here — that is corporate work
 * and cannot back a live demo.
 */

export interface ExperienceItem {
  title: string
  company: string
  location: string
  duration: string
  current: boolean
  /** Earlier titles at the same employer, most recent first. */
  priorTitles?: { title: string; duration: string }[]
  achievements: string[]
  stack?: string[]
}

export const experiences: ExperienceItem[] = [
  {
    title: 'AI and Data Science Engineer',
    company: 'Deloitte',
    location: 'Hyderabad, India',
    duration: 'Nov 2025 — Present',
    current: true,
    achievements: [
      'Building Data Workbench, a GCP-native platform consolidating 8+ AI-powered tools for data engineering and analytics workflows across client engagements.',
      'Architected Python/FastAPI backend services on Cloud Run with Cloud SQL and Firestore, covering user, project and job orchestration, shipped through GitHub Actions and Cloud Build with SonarQube scanning.',
      'Designed a Pub/Sub parallel execution layer for long-running LLM workloads on Vertex AI — 100+ files processed concurrently per service with stable end-to-end latency under burst traffic.',
      'Built a multi-agent system on Google ADK performing any-to-any SQL translation across 8 dialects, eliminating manual rewrites during client migrations.',
      'Built a RAG service over Vertex AI vector search that auto-generates column descriptions and PII sensitivity classifications direct from BigQuery or ingested metadata.',
      'Refactored Azure OpenAI legacy tools onto a GCP-native stack, redesigning APIs and deployment topology to fit a unified platform architecture.',
    ],
    stack: ['Python', 'FastAPI', 'Google ADK', 'Vertex AI', 'Cloud Run', 'Pub/Sub', 'BigQuery', 'Firestore'],
  },
  {
    title: 'Associate AI Engineer',
    company: 'Cognizant',
    location: 'Gurugram, India',
    duration: 'Jan 2022 — Oct 2025',
    current: false,
    priorTitles: [
      { title: 'Junior Data Scientist', duration: 'Jul 2022 — Jul 2025' },
      { title: 'AI/ML Intern', duration: 'Jan 2022 — Jul 2022' },
    ],
    achievements: [
      'Architected a production GenAI data analyst for a global beverage leader using LangGraph and Azure OpenAI, orchestrating specialised agents for SQL generation, visualisation and Pandas computation against complex business rules (YTD, market share, channel splits).',
      'Engineered an autonomous multi-agent IT-support framework on Nvidia NIM, integrating MS Graph and a RAG debugging pipeline to triage and resolve tickets with near-zero human intervention.',
      'Built and deployed an automated interview platform on multi-cloud Kubernetes (GCP, Azure, AWS) integrating GPT-4 and Claude — 99.9% uptime and a 40% reduction in operational cost over the prior system.',
      'Delivered a RAG-powered audit-automation tool for a Big 4 client, cutting audit preparation time by 65%.',
      'Trained churn-prediction models (Random Forest, GBM, neural networks), improving baseline accuracy by 15%.',
    ],
    stack: ['LangGraph', 'Azure OpenAI', 'Nvidia NIM', 'Kubernetes', 'GPT-4', 'Claude', 'Streamlit'],
  },
  {
    title: 'PRISM Researcher',
    company: 'Samsung R&D Institute',
    location: 'Bangalore, India',
    duration: 'Oct 2020 — Mar 2021',
    current: false,
    achievements: [
      'Developed an anti-spoofing and speaker-verification model for on-device voice IoT using Residual Squeeze-and-Excitation networks in TensorFlow.',
      'Achieved 4.44% EER on the ASVspoof benchmark; work published at ICCNT 2021 (IEEE).',
    ],
    stack: ['TensorFlow', 'Speaker Verification', 'ASVspoof'],
  },
]

export interface EducationItem {
  degree: string
  institution: string
  duration: string
  note?: string
}

export const education: EducationItem[] = [
  {
    degree: 'M.S. Data Science (Global)',
    institution: 'Deakin University',
    duration: '2023 — 2025',
    note: 'Distance learning, completed alongside full-time work',
  },
  {
    degree: 'B.Tech, Computer Science (Information Technology)',
    institution: 'SRM Institute of Science and Technology',
    duration: '2018 — 2022',
  },
]

export const publication = {
  title:
    'Feature Genuinization based Residual Squeeze-and-Excitation for Audio Anti-Spoofing in Sound AI',
  venue:
    '12th International Conference on Computing, Communication and Networking Technologies (ICCNT), IEEE, 2021',
  authors: 'Ray, R., Karthik, S., Mathur, V., Kumar, P., Maragatham, G., Tiwari, S.',
  url: 'https://ieeexplore.ieee.org/document/9580127',
}

export const certifications = [
  'NVIDIA-Certified Associate — Generative AI LLMs (NCA GEN-L)',
  'Post Graduate Program in AI and Machine Learning — University of Texas at Austin (McCombs)',
]
