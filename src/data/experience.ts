export interface ExperienceItem {
  title: string
  company: string
  location: string
  duration: string
  current: boolean
  achievements: string[]
}

export const experiences: ExperienceItem[] = [
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
