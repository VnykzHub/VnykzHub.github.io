'use client'

import { useEffect, useState } from 'react'
import Typewriter from 'typewriter-effect'

// Concrete properties of a shipped system, not adjectives. The previous set
// ("Drives Innovation", "Creates Impact", "Transforms Data") said nothing a
// reader could check or an interviewer could ask about.
const phrases = [
  'Ships to Production',
  'Cites Its Sources',
  'Survives Real Traffic',
  'Degrades Gracefully',
  'Runs on a Budget',
]

export function TypedHeadline() {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])
  
  return (
    <div className="text-4xl md:text-5xl lg:text-6xl font-bold">
      <span className="text-[var(--heading)]">I Build AI That </span>
      {isVisible && (
        <span className="text-accent-amber inline-block">
          <Typewriter
            options={{
              strings: phrases,
              autoStart: true,
              loop: true,
              deleteSpeed: 50,
              delay: 80,
            }}
          />
        </span>
      )}
    </div>
  )
}
