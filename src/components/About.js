import React from 'react';
import Fade from 'react-reveal/Fade';
import '../styles/About.css';

const About = () => {
  return (
    <section id="about" className="about">
      <Fade bottom>
      <h1>Vinayak Mathur</h1>
      <h2>AI Software Engineer | Expert in Generative AI & Cloud Solutions</h2>
      <p>
        An engaged and curious professional with a passion for exploring machine learning 
        and artificial intelligence. I thrive in environments that offer opportunities for 
        growth and allow me to utilize my inherent leadership and communication abilities.
      </p>
      <div className="contact-info">
        <p>Email: vinayak.k.mathur@gmail.com</p>
        <p>LinkedIn: <a href="https://www.linkedin.com/in/vinayakmathur2000/" target="_blank" rel="noopener noreferrer">linkedin.com/in/vinayakmathur2000</a></p>
      </div>
      </Fade>
    </section>
  );
};

export default About;