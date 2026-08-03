import { useEffect, useState } from 'react'
import Typewriter from 'typewriter-effect'

const phrases = [
  'Solves Problems',
  'Drives Innovation',
  'Builds Intelligence',
  'Creates Impact',
  'Transforms Data',
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
        <span className="text-accent-cyan inline-block">
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
