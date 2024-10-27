import React from 'react';
import { Link } from 'react-scroll';
import Fade from 'react-reveal/Fade';
import '../styles/Header.css';

const Header = () => {
  return (
    <header>
      <nav>
        <ul>
          <Fade top cascade>
            <li><Link to="about" smooth={true} duration={500}>About</Link></li>
            <li><Link to="experience" smooth={true} duration={500}>Experience</Link></li>
            <li><Link to="skills" smooth={true} duration={500}>Skills</Link></li>
            <li><Link to="education" smooth={true} duration={500}>Education</Link></li>
            <li><Link to="projects" smooth={true} duration={500}>Projects</Link></li>
            <li><Link to="contact" smooth={true} duration={500}>Contact</Link></li>
          </Fade>
        </ul>
      </nav>
    </header>
  );
};

export default Header;