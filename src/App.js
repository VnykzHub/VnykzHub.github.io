import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from './components/Header';
import About from './components/About';
import Experience from './components/Experience';
import Skills from './components/Skills';
import Education from './components/Education';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Chatbot from './components/Chatbot';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <About />
          <Experience />
          <Skills />
          <Education />
          <Projects />
          <Contact />
        </main>
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;