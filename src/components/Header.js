import React from 'react';
import { Link } from 'react-scroll';
import { motion } from 'framer-motion';
import '../styles/Header.css';

const Header = () => {
  return (
    <header>
      <nav>
        <ul>
          {['about', 'experience', 'skills', 'education', 'projects', 'contact'].map((item, index) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                activeClass="active"
                to={item}
                spy={true}
                smooth={true}
                offset={-60}
                duration={500}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Link>
            </motion.li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header;