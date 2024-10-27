import React from 'react';
import Fade from 'react-reveal/Fade';
import '../styles/Experience.css';

const Experience = () => {
  const experiences = [
    {
      title: "Programmer Analyst",
      company: "Cognizant",
      period: "July 2022 - Present",
      location: "Pune, Maharashtra, India",
      responsibilities: [
        "Developed and deployed an automated interview platform using OpenAI GPT-4 model/ Claude 3.5 Sonnet.",
        "Managed continuous integration and continuous deployment (CI/CD) pipelines.",
        "Engineered a Generative AI solution for Big 4 Financial Audit Automation.",
        "Created a user-centric interface with Python Streamlit for seamless integration."
      ]
    },
    {
      title: "Intern",
      company: "Cognizant",
      period: "January 2022 - July 2022",
      location: "Pune, Maharashtra, India",
      responsibilities: [
        "Specialized in AI/ML and worked on multiple projects involving AIML, NLP, and data analytics.",
        "Expanded skills in Pandas, Time Series Analysis, AWS SageMaker, and Machine Learning.",
        "Implemented machine learning algorithms to develop predictive models for customer churn."
      ]
    },
    {
      title: "Samsung PRISM Researcher",
      company: "Samsung Electronics",
      period: "October 2020 - March 2021",
      location: "Bangalore, India",
      responsibilities: [
        "Developed anti-spoofing, speaker verification, and false wakeup solutions for IoT devices.",
        "Gained deep understanding of voice technology and contributed to secure IoT device development."
      ]
    }
  ];

  return (
    <section id="experience" className="experience">
      <h2>Professional Experience</h2>
      {experiences.map((exp, index) => (
        <Fade bottom key={index}>
          <div className="experience-item">
            <h3>{exp.title}</h3>
            <h4>{exp.company}</h4>
            <p>{exp.period} | {exp.location}</p>
            <ul>
              {exp.responsibilities.map((resp, idx) => (
                <li key={idx}>{resp}</li>
              ))}
            </ul>
          </div>
        </Fade>
      ))}
    </section>
  );
};

export default Experience;