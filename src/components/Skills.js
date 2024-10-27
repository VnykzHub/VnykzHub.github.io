import React from 'react';
import { motion } from 'framer-motion';
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
        <motion.div 
        key={index}
        className="skill-category"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
          <div className="skill-category">
            <h3>{category.category}</h3>
            <ul>
              {category.skills.map((skill, idx) => (
                <li key={idx}>{skill}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      ))}
    </section>
  );
};


export default Skills;