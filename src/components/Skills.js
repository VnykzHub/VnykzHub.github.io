import React from 'react';
import Fade from 'react-reveal/Fade';
import '../styles/Skills.css';

const Skills = () => {
  const skillCategories = [
    {
      category: "Programming Languages",
      skills: ["Python", "JavaScript", "C++", "SQL", "Java", "HTML/CSS"]
    },
    {
      category: "Frameworks & Libraries",
      skills: ["FAST API", "LangChain", "AutoGen", "React", "Node.js", "Flask", "Django", "Streamlit"]
    },
    {
      category: "AI/ML Technologies",
      skills: ["OpenAI GPT-4", "Anthropic Claude", "BERT", "NLTK", "TensorFlow", "PyTorch"]
    },
    {
      category: "Cloud & DevOps",
      skills: ["Azure", "AWS", "GCP", "Docker", "Kubernetes", "Git", "CI/CD pipelines"]
    },
    {
      category: "Other Skills",
      skills: ["Prompt Engineering", "NLP", "Computer Vision", "Knowledge Graphs"]
    }
  ];

  return (
    <section id="skills" className="skills">
      <h2>Technical Skills</h2>
      {skillCategories.map((category, index) => (
        <Fade bottom key={index}>
          <div className="skill-category">
            <h3>{category.category}</h3>
            <ul>
              {category.skills.map((skill, idx) => (
                <li key={idx}>{skill}</li>
              ))}
            </ul>
          </div>
        </Fade>
      ))}
    </section>
  );
};


export default Skills;