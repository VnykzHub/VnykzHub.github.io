import React from 'react';
import '../styles/Education.css';

const Education = () => {
  const educationData = [
    {
      degree: "Master of Data Science (Global)",
      institution: "Deakin University",
      period: "September 2023 - October 2025 (Expected)"
    },
    {
      degree: "Post Graduate Program in Artificial Intelligence and Machine Learning",
      institution: "Texas McCombs School of Business",
      period: "September 2023 - October 2024"
    },
    {
      degree: "Bachelor of Technology in Computer Science with Specialization in Information Technology",
      institution: "SRM University",
      period: "2018 - 2022"
    }
  ];

  return (
    <section id="education" className="education">
      <h2>Education</h2>
      {educationData.map((edu, index) => (
        <div key={index} className="education-item">
          <h3>{edu.degree}</h3>
          <h4>{edu.institution}</h4>
          <p>{edu.period}</p>
        </div>
      ))}
    </section>
  );
};

export default Education;