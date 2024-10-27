import React from 'react';
import { motion } from 'framer-motion';
import '../styles/About.css';

const About = () => {
  return (
    <motion.section 
      id="about" 
      className="about"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >

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
      </motion.section>
  );
};

export default About;