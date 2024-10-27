import React from 'react';
import '../styles/Projects.css';

const Projects = () => {
  const projectsData = [
    {
      title: "Automated Interview Platform",
      description: "Developed a GenAI-powered interview platform using OpenAI GPT-4 and Claude 3.5 Sonnet, integrating speech-to-text and text-to-speech services.",
      technologies: ["Python", "JavaScript", "React", "OpenAI API", "Kubernetes", "Azure"]
    },
    {
      title: "Big 4 Financial Audit Automation",
      description: "Engineered a Generative AI solution to streamline audit processes, including generation and review of financial documents.",
      technologies: ["Python", "GPT-4", "Streamlit", "Azure"]
    },
    {
      title: "Resume Screener for Specialized Resumes",
      description: "Executed an NLP project to extract essential information from specialized resumes and created knowledge graphs for complex relationship analysis.",
      technologies: ["Python", "Spacy", "NLTK", "Neo4j", "AWS"]
    }
  ];

  return (
    <section id="projects" className="projects">
      <h2>Projects</h2>
      {projectsData.map((project, index) => (
        <div key={index} className="project-item">
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <div className="technologies">
            {project.technologies.map((tech, idx) => (
              <span key={idx} className="tech-tag">{tech}</span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

export default Projects;