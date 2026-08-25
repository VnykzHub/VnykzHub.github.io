// Placeholder sprite generation for development
// This creates colored rectangles to represent game objects until real sprites are available

// Returns the canvas itself, not a data URL. Pixi v8's Texture.from(string) is
// a Cache lookup rather than a loader, so a data URL that was never registered
// resolves to undefined and the sprite silently renders empty. A canvas element
// takes the resource path instead and works directly.
const generatePlaceholderSprite = (width, height, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  // Add a border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  return canvas;
};

const buildPlaceholders = () => ({
  player: {
    idle: generatePlaceholderSprite(32, 32, '#3ca5d9'),
    push: generatePlaceholderSprite(32, 32, '#2a95c9'),
    dodge: generatePlaceholderSprite(32, 32, '#1a85b9')
  },
  kindergartners: {
    standard: generatePlaceholderSprite(24, 24, '#FF6666'),
    painter: generatePlaceholderSprite(24, 24, '#4488FF'),
    napDodger: generatePlaceholderSprite(24, 24, '#FFCC33'),
    snackStealer: generatePlaceholderSprite(24, 24, '#66CC66'),
    classPet: generatePlaceholderSprite(32, 32, '#CC66CC')
  },
  environment: {
    floor: generatePlaceholderSprite(16, 16, '#D2B48C'),
    wall: generatePlaceholderSprite(16, 16, '#8B4513'),
    desk: generatePlaceholderSprite(30, 30, '#A5702A'),
    puddle: generatePlaceholderSprite(24, 24, 'rgba(0, 100, 255, 0.3)')
  },
  effects: {
    push: generatePlaceholderSprite(48, 48, 'rgba(255,255,255,0.5)'),
    stun: generatePlaceholderSprite(16, 16, '#FFFF00')
  },
  ui: {
    healthBar: generatePlaceholderSprite(100, 10, '#3c3'),
    staminaBar: generatePlaceholderSprite(100, 10, '#38f'),
    button: generatePlaceholderSprite(120, 40, '#444')
  }
});

let cached = null;

// Function to generate object with all placeholder assets.
// Built lazily and memoized — generation touches `document`, so running it at
// module scope would break any server-side import of this file.
export const generatePlaceholders = () => {
  if (!cached) cached = buildPlaceholders();
  return cached;
};

export default generatePlaceholders;
