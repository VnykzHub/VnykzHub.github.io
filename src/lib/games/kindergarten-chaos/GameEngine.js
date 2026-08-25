import * as PIXI from 'pixi.js';
import { GAME_CONFIG } from './config';
import { generatePlaceholders } from './placeholders';

class GameEngine {
  constructor(containerId) {
    // Game state
    this.state = {
      running: false,
      currentWave: 0,
      timeUntilNextWave: 0,
      score: 0,
      dogpileTimer: 0,
      gameOver: false,
    };

    // Game objects
    this.player = null;
    this.kindergartners = [];
    this.desks = [];
    this.puddles = [];
    this.projectiles = [];

    // Input tracking
    this.keys = {};

    // Pending classPet speed-boost restores, so they can be cancelled on
    // reset/teardown instead of firing against a dead game.
    this.boostTimers = new Set();
    this.destroyed = false;

    // Placeholder assets (until real ones are loaded)
    this.assets = generatePlaceholders();
    
    // Setup PIXI. In v8 the renderer is created asynchronously by app.init(),
    // so the canvas and ticker are not available until init() has resolved.
    this.app = new PIXI.Application();

    // Game containers (stage exists immediately; the renderer does not)
    this.gameContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    this.app.stage.addChild(this.gameContainer);
    this.app.stage.addChild(this.uiContainer);

    this.containerId = containerId;
    this.container = null;

    // Bind event handlers
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    
    // Bind game loop
    this.gameLoop = this.gameLoop.bind(this);
  }

  // Initialize the game. Pixi v8 builds the renderer asynchronously, so this
  // must be awaited before anything touches app.canvas or app.ticker.
  async init() {
    await this.app.init({
      width: GAME_CONFIG.width,
      height: GAME_CONFIG.height,
      backgroundColor: 0xD2B48C, // Tan classroom floor
      antialias: false,
    });

    // The caller may have torn us down while the renderer was initialising.
    if (this.destroyed) {
      this.app.destroy(true);
      return;
    }

    // Add canvas to DOM
    this.container = document.getElementById(this.containerId);
    if (this.container) {
      this.container.appendChild(this.app.canvas);
    } else {
      console.error(`Game container #${this.containerId} not found`);
    }

    // Add event listeners
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Load assets (using placeholders for now)
    this.loadAssets();
  }
  
  // Load game assets
  loadAssets() {
    // In a real implementation, we would load sprites and sounds here
    // For now, we'll use the placeholder assets
    
    // Setup initial game state after assets are loaded
    this.setupGame();
  }
  
  // Setup initial game state
  setupGame() {
    // Create player
    this.createPlayer();
    
    // Create classroom environment
    this.createClassroom();
    
    // Setup UI
    this.createUI();
    
    // Ready to start
    console.log('Game initialized and ready to start');
  }
  
  // Create player object
  createPlayer() {
    const playerConfig = GAME_CONFIG.player;
    
    this.player = {
      x: GAME_CONFIG.width / 2,
      y: GAME_CONFIG.height / 2,
      width: playerConfig.size,
      height: playerConfig.size,
      speed: playerConfig.walkSpeed,
      maxSpeed: playerConfig.walkSpeed,
      slowTimer: 0, // frames remaining of projectile-induced slow
      patience: GAME_CONFIG.startingPatience,
      maxPatience: GAME_CONFIG.startingPatience,
      stamina: GAME_CONFIG.startingStamina,
      maxStamina: GAME_CONFIG.startingStamina,
      facingDirection: 'down',
      isMoving: false,
      isRunning: false,
      isPushing: false,
      pushCooldown: 0,
      pushRange: playerConfig.pushRange,
      pushDuration: playerConfig.pushDuration,
      isDodging: false,
      dodgeSpeed: playerConfig.dodgeSpeed,
      dodgeDuration: playerConfig.dodgeDuration,
      dodgeCooldown: 0,
      invulnerable: false,
    };
    
    // Create player sprite
    this.playerSprite = new PIXI.Sprite(PIXI.Texture.from(this.assets.player.idle));
    this.playerSprite.anchor.set(0.5);
    this.playerSprite.x = this.player.x;
    this.playerSprite.y = this.player.y;
    this.gameContainer.addChild(this.playerSprite);
    
    // Direction indicator (temporary until we have proper sprites)
    this.directionIndicator = new PIXI.Graphics();
    this.gameContainer.addChild(this.directionIndicator);
    this.updateDirectionIndicator();
  }
  
  // Create classroom environment
  createClassroom() {
    // Create desks
    const deskRows = 3;
    const deskCols = 4;
    const deskSize = GAME_CONFIG.environment.deskSize;
    
    const startX = 150;
    const startY = 150;
    const spacingX = 120;
    const spacingY = 100;
    
    for (let row = 0; row < deskRows; row++) {
      for (let col = 0; col < deskCols; col++) {
        const desk = {
          x: startX + col * spacingX,
          y: startY + row * spacingY,
          width: deskSize,
          height: deskSize,
          isTipped: false
        };
        
        this.desks.push(desk);
        
        // Create desk sprite
        const deskSprite = new PIXI.Sprite(PIXI.Texture.from(this.assets.environment.desk));
        deskSprite.anchor.set(0.5);
        deskSprite.x = desk.x;
        deskSprite.y = desk.y;
        this.gameContainer.addChild(deskSprite);
      }
    }
  }
  
  // Create game UI
  createUI() {
    // UI Container positioned at the top
    this.uiContainer.position.set(0, 0);
    
    // Health/Patience bar
    this.healthBarBg = new PIXI.Graphics();
    this.healthBarBg.beginFill(0x000000, 0.5);
    this.healthBarBg.drawRect(20, 20, 200, 20);
    this.healthBarBg.endFill();
    
    this.healthBar = new PIXI.Graphics();
    this.updateHealthBar();
    
    // Stamina bar
    this.staminaBarBg = new PIXI.Graphics();
    this.staminaBarBg.beginFill(0x000000, 0.5);
    this.staminaBarBg.drawRect(20, 50, 200, 10);
    this.staminaBarBg.endFill();
    
    this.staminaBar = new PIXI.Graphics();
    this.updateStaminaBar();
    
    // Wave and score text
    this.waveText = new PIXI.Text(`Wave: ${this.state.currentWave}`, { 
      fontFamily: 'monospace',
      fontSize: 16,
      fill: 0xFFFFFF
    });
    this.waveText.position.set(20, 80);
    
    this.timerText = new PIXI.Text('Timer: 0:00', {
      fontFamily: 'monospace',
      fontSize: 16,
      fill: 0xFFFFFF
    });
    this.timerText.position.set(150, 80);
    
    this.scoreText = new PIXI.Text(`Score: ${this.state.score}`, {
      fontFamily: 'monospace',
      fontSize: 16,
      fill: 0xFFFFFF
    });
    this.scoreText.position.set(300, 80);
    
    // Add UI elements to container
    this.uiContainer.addChild(this.healthBarBg, this.healthBar);
    this.uiContainer.addChild(this.staminaBarBg, this.staminaBar);
    this.uiContainer.addChild(this.waveText, this.timerText, this.scoreText);
    
    // Dogpile meter (only shown when active)
    this.dogpileMeter = new PIXI.Container();
    this.dogpileMeter.visible = false;
    
    const dogpileBg = new PIXI.Graphics();
    dogpileBg.beginFill(0x000000, 0.7);
    dogpileBg.drawRect(0, 0, 100, 10);
    dogpileBg.endFill();
    
    this.dogpileFill = new PIXI.Graphics();
    this.dogpileFill.beginFill(0xFF0000, 0.7);
    this.dogpileFill.drawRect(0, 0, 0, 10);
    this.dogpileFill.endFill();
    
    const dogpileLabel = new PIXI.Text('DOGPILE', {
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0xFFFFFF
    });
    dogpileLabel.position.set(25, -15);
    
    this.dogpileMeter.addChild(dogpileBg, this.dogpileFill, dogpileLabel);
    this.uiContainer.addChild(this.dogpileMeter);
    
    // Game over screen (hidden by default)
    this.gameOverScreen = new PIXI.Container();
    this.gameOverScreen.visible = false;
    
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.7);
    overlay.drawRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    overlay.endFill();
    
    const gameOverText = new PIXI.Text('GAME OVER', {
      fontFamily: 'monospace',
      fontSize: 48,
      fill: 0xFFFFFF
    });
    gameOverText.position.set(GAME_CONFIG.width / 2 - gameOverText.width / 2, GAME_CONFIG.height / 2 - 80);
    
    this.finalScoreText = new PIXI.Text(`Final Score: 0`, {
      fontFamily: 'monospace',
      fontSize: 24,
      fill: 0xFFFFFF
    });
    this.finalScoreText.position.set(GAME_CONFIG.width / 2 - this.finalScoreText.width / 2, GAME_CONFIG.height / 2);
    
    this.finalWaveText = new PIXI.Text(`Waves Survived: 0`, {
      fontFamily: 'monospace',
      fontSize: 24,
      fill: 0xFFFFFF
    });
    this.finalWaveText.position.set(GAME_CONFIG.width / 2 - this.finalWaveText.width / 2, GAME_CONFIG.height / 2 + 40);
    
    this.gameOverScreen.addChild(overlay, gameOverText, this.finalScoreText, this.finalWaveText);
    this.app.stage.addChild(this.gameOverScreen);
  }
  
  // Start the game
  start() {
    // Reset game state
    this.resetGame();
    
    // Start the first wave
    this.startNextWave();
    
    // Start game loop
    this.state.running = true;
    this.app.ticker.add(this.gameLoop);
    
    console.log('Game started');
  }
  
  // Reset game to initial state
  resetGame() {
    this.state = {
      running: false,
      currentWave: 0,
      timeUntilNextWave: 0,
      score: 0,
      dogpileTimer: 0,
      gameOver: false,
    };
    
    // Reset player
    this.player.x = GAME_CONFIG.width / 2;
    this.player.y = GAME_CONFIG.height / 2;
    this.player.patience = GAME_CONFIG.startingPatience;
    this.player.stamina = GAME_CONFIG.startingStamina;
    this.player.isPushing = false;
    this.player.isDodging = false;
    this.player.pushCooldown = 0;
    this.player.dodgeCooldown = 0;
    this.player.slowTimer = 0;

    // Drop pending speed-boost restores from the previous run
    this.clearBoostTimers();

    // Clear enemies and effects
    this.kindergartners.forEach(k => {
      if (k.sprite) this.gameContainer.removeChild(k.sprite);
    });
    this.kindergartners = [];
    
    this.puddles.forEach(p => {
      if (p.sprite) this.gameContainer.removeChild(p.sprite);
    });
    this.puddles = [];
    
    this.projectiles.forEach(p => {
      if (p.sprite) this.gameContainer.removeChild(p.sprite);
    });
    this.projectiles = [];
    
    // Reset UI
    this.updateHealthBar();
    this.updateStaminaBar();
    this.waveText.text = `Wave: ${this.state.currentWave}`;
    this.scoreText.text = `Score: ${this.state.score}`;
    this.timerText.text = 'Timer: 0:00';
    this.dogpileMeter.visible = false;
    this.gameOverScreen.visible = false;
  }
  
  // Start next wave
  startNextWave() {
    this.state.currentWave++;
    this.updateUI();
    
    // Calculate wave difficulty
    const waveConfig = GAME_CONFIG.waveDifficulty;
    const totalKindergartners = Math.min(
      waveConfig.maxCount, 
      waveConfig.baseCount + waveConfig.countIncreasePerWave * (this.state.currentWave - 1)
    );
    
    // Determine available types for this wave
    let availableTypes = ['standard'];
    Object.keys(waveConfig.typesUnlockSchedule).forEach(wave => {
      if (this.state.currentWave >= wave) {
        availableTypes = [...waveConfig.typesUnlockSchedule[wave]];
      }
    });
    
    // Spawn kindergartners
    for (let i = 0; i < totalKindergartners; i++) {
      this.spawnKindergartner(availableTypes);
    }
    
    // Add class pet mini-boss on special waves
    if (waveConfig.classPetWaves.includes(this.state.currentWave)) {
      this.spawnKindergartner(['classPet']);
    }
    
    // Set timer for next wave
    this.state.timeUntilNextWave = GAME_CONFIG.waveDuration * GAME_CONFIG.fps;
  }
  
  // Spawn a kindergartner
  spawnKindergartner(types = ['standard']) {
    // Choose random type
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Choose random spawn position (edge of screen)
    let x, y;
    const edge = Math.floor(Math.random() * 4);
    const offset = 30; // Spawn just off-screen
    
    switch (edge) {
      case 0: // Top
        x = Math.random() * GAME_CONFIG.width;
        y = -offset;
        break;
      case 1: // Right
        x = GAME_CONFIG.width + offset;
        y = Math.random() * GAME_CONFIG.height;
        break;
      case 2: // Bottom
        x = Math.random() * GAME_CONFIG.width;
        y = GAME_CONFIG.height + offset;
        break;
      case 3: // Left
        x = -offset;
        y = Math.random() * GAME_CONFIG.height;
        break;
    }
    
    // Get type configuration
    const typeConfig = GAME_CONFIG.kindergartners[type];
    
    // Create kindergartner object
    const kindergartner = {
      x,
      y,
      width: typeConfig.size,
      height: typeConfig.size,
      speed: typeConfig.speed,
      health: typeConfig.health,
      damage: typeConfig.damage,
      state: 'chasing', // chasing, stunned, settled
      stunTime: 0,
      type,
      specialTimer: 0
    };
    
    // Create sprite
    const kidSprite = new PIXI.Sprite(PIXI.Texture.from(this.assets.kindergartners[type]));
    kidSprite.anchor.set(0.5);
    kidSprite.x = kindergartner.x;
    kidSprite.y = kindergartner.y;
    this.gameContainer.addChild(kidSprite);
    
    // Store sprite reference
    kindergartner.sprite = kidSprite;
    
    // Add to kindergartners array
    this.kindergartners.push(kindergartner);
    
    return kindergartner;
  }
  
  // Main game loop. Pixi v8 passes the Ticker itself, not a delta scalar.
  gameLoop(ticker) {
    if (!this.state.running) return;

    const delta = ticker.deltaTime;

    this.updatePlayer(delta);
    this.updateKindergartners(delta);
    this.updatePuddles(delta);
    this.updateProjectiles(delta);
    this.updateGameTimers(delta);
    this.updateUI();
    
    // Check for win/lose conditions
    this.checkWaveCompletion();
    this.checkGameOver();
  }
  
  // Update player state
  updatePlayer(delta) {
    // Get movement input
    let dx = 0;
    let dy = 0;
    
    if (this.keys['ArrowLeft'] || this.keys['a']) dx -= 1;
    if (this.keys['ArrowRight'] || this.keys['d']) dx += 1;
    if (this.keys['ArrowUp'] || this.keys['w']) dy -= 1;
    if (this.keys['ArrowDown'] || this.keys['s']) dy += 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const mag = Math.sqrt(dx * dx + dy * dy);
      dx /= mag;
      dy /= mag;
    }
    
    // Update player facing direction
    if (dx !== 0 || dy !== 0) {
      this.player.isMoving = true;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        this.player.facingDirection = dx > 0 ? 'right' : 'left';
      } else {
        this.player.facingDirection = dy > 0 ? 'down' : 'up';
      }
      
    } else {
      this.player.isMoving = false;
    }

    // Redraw every frame, not just while moving, so the push arc and dodge
    // ring still appear when the player acts while standing still.
    this.updateDirectionIndicator();

    // Environmental slow: puddles apply while standing in one, a projectile hit
    // lingers for a fixed number of frames. Both scale movement speed.
    const inPuddle = this.puddles.some(puddle => this.checkCollision(this.player, puddle));
    if (this.player.slowTimer > 0) {
      this.player.slowTimer = Math.max(0, this.player.slowTimer - delta);
    }
    const slowFactor = (inPuddle || this.player.slowTimer > 0)
      ? GAME_CONFIG.environment.puddleSlowFactor
      : 1;

    // Handle running
    this.player.isRunning = this.keys['Shift'] && this.player.stamina > 0;
    const baseSpeed = this.player.isRunning ? GAME_CONFIG.player.runSpeed : GAME_CONFIG.player.walkSpeed;
    let currentSpeed = baseSpeed * slowFactor;
    this.player.maxSpeed = currentSpeed;

    // Handle dodge roll (the dodge burst ignores the environmental slow)
    if (this.player.isDodging) {
      currentSpeed = this.player.dodgeSpeed;
      this.player.dodgeDuration--;
      
      if (this.player.dodgeDuration <= 0) {
        this.player.isDodging = false;
        this.player.dodgeDuration = GAME_CONFIG.player.dodgeDuration;
        this.player.invulnerable = false;
      }
    }
    
    // Apply movement
    this.player.x += dx * currentSpeed * delta;
    this.player.y += dy * currentSpeed * delta;
    
    // Keep player on screen
    this.player.x = Math.max(this.player.width/2, Math.min(GAME_CONFIG.width - this.player.width/2, this.player.x));
    this.player.y = Math.max(this.player.height/2, Math.min(GAME_CONFIG.height - this.player.height/2, this.player.y));
    
    // Update sprite position
    this.playerSprite.x = this.player.x;
    this.playerSprite.y = this.player.y;
    
    // Check for collision with desks
    this.desks.forEach(desk => {
      if (this.checkCollision(this.player, desk)) {
        // Simple collision resolution - push player back
        if (dx > 0) this.player.x = desk.x - desk.width/2 - this.player.width/2;
        if (dx < 0) this.player.x = desk.x + desk.width/2 + this.player.width/2;
        if (dy > 0) this.player.y = desk.y - desk.height/2 - this.player.height/2;
        if (dy < 0) this.player.y = desk.y + desk.height/2 + this.player.height/2;
        
        // Update sprite position after collision
        this.playerSprite.x = this.player.x;
        this.playerSprite.y = this.player.y;
      }
    });
    
    // Update push action
    if (this.player.isPushing) {
      this.player.pushDuration--;
      if (this.player.pushDuration <= 0) {
        this.player.isPushing = false;
        this.player.pushDuration = GAME_CONFIG.player.pushDuration;
      }
    }
    
    // Update cooldowns
    if (this.player.pushCooldown > 0) this.player.pushCooldown--;
    if (this.player.dodgeCooldown > 0) this.player.dodgeCooldown--;
    
    // Update stamina
    if (this.player.isRunning) {
      this.player.stamina = Math.max(0, this.player.stamina - GAME_CONFIG.staminaDrainRate * delta);
    } else {
      this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + GAME_CONFIG.staminaRegenRate * delta);
    }
  }
  
  // Update kindergartners
  updateKindergartners(delta) {
    // Store kindergartners to remove after update
    const settled = [];
    
    // Reset dogpile counter each frame
    let closeKidCount = 0;
    
    // Update each kindergartner
    this.kindergartners.forEach(kid => {
      if (kid.state === 'stunned') {
        kid.stunTime--;
        if (kid.stunTime <= 0) {
          kid.state = 'chasing';
        }
        return;
      }
      
      if (kid.state === 'settled') {
        kid.stunTime++;
        if (kid.stunTime > 180) { // Remove after 3 seconds
          settled.push(kid);
        }
        return;
      }
      
      // Move toward player
      const dx = this.player.x - kid.x;
      const dy = this.player.y - kid.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        kid.x += (dx / distance) * kid.speed * delta;
        kid.y += (dy / distance) * kid.speed * delta;
      }
      
      // Update sprite position
      kid.sprite.x = kid.x;
      kid.sprite.y = kid.y;
      
      // Special behaviors by type
      switch(kid.type) {
        case 'painter':
          kid.specialTimer++;
          if (kid.specialTimer > GAME_CONFIG.kindergartners.painter.puddleFrequency) {
            this.createPuddle(kid.x, kid.y);
            kid.specialTimer = 0;
          }
          break;
          
        case 'snackStealer':
          kid.specialTimer++;
          if (kid.specialTimer > GAME_CONFIG.kindergartners.snackStealer.projectileFrequency) {
            this.createProjectile(kid.x, kid.y);
            kid.specialTimer = 0;
          }
          break;
          
        case 'classPet':
          kid.specialTimer++;
          if (kid.specialTimer > GAME_CONFIG.kindergartners.classPet.commandFrequency) {
            this.boostNearbyKids(kid);
            kid.specialTimer = 0;
          }
          break;
      }
      
      // Check collision with player
      if (!this.player.invulnerable && distance < (kid.width + this.player.width) / 2) {
        this.player.patience -= kid.damage * delta;
        
        // Check if this kid is close enough for dogpile
        closeKidCount++;
      }
      
      // Check collision with push action
      if (this.player.isPushing) {
        const pushDistance = Math.sqrt(Math.pow(this.player.x - kid.x, 2) + Math.pow(this.player.y - kid.y, 2));
        
        if (pushDistance < this.player.pushRange) {
          // Direction from player to kindergartner
          const pushDirX = (kid.x - this.player.x) / pushDistance;
          const pushDirY = (kid.y - this.player.y) / pushDistance;
          
          // Push back kindergartner
          kid.x += pushDirX * 20;
          kid.y += pushDirY * 20;
          
          // Update sprite position after push
          kid.sprite.x = kid.x;
          kid.sprite.y = kid.y;
          
          // Stun kindergartner
          kid.state = 'stunned';
          kid.stunTime = 60; // 1 second stun
          
          // Damage kindergartner
          kid.health--;
          if (kid.health <= 0) {
            kid.state = 'settled';
            this.state.score += GAME_CONFIG.waveDifficulty.scoreMultiplier;
          }
        }
      }
    });
    
    // Handle dogpile timer
    if (closeKidCount >= GAME_CONFIG.dogpileThreshold) {
      this.state.dogpileTimer += delta;
      this.dogpileMeter.visible = true;
      this.dogpileMeter.position.set(
        this.player.x - 50,
        this.player.y - this.player.height/2 - 30
      );
      
      const maxDogpileTime = GAME_CONFIG.dogpileTime * GAME_CONFIG.fps;
      const fillWidth = (this.state.dogpileTimer / maxDogpileTime) * 100;
      
      this.dogpileFill.clear();
      this.dogpileFill.beginFill(0xFF0000, 0.7);
      this.dogpileFill.drawRect(0, 0, fillWidth, 10);
      this.dogpileFill.endFill();
      
      if (this.state.dogpileTimer >= maxDogpileTime) {
        this.handleGameOver();
      }
    } else {
      this.state.dogpileTimer = Math.max(0, this.state.dogpileTimer - delta);
      if (this.state.dogpileTimer === 0) {
        this.dogpileMeter.visible = false;
      }
    }
    
    // Remove settled kindergartners
    settled.forEach(kid => {
      const index = this.kindergartners.indexOf(kid);
      if (index !== -1) {
        this.kindergartners.splice(index, 1);
        this.gameContainer.removeChild(kid.sprite);
      }
    });
  }
  
  // Temporarily speed up kindergartners near the class pet. Boosts deliberately
  // do not stack: an already-boosted kid is skipped so repeated commands cannot
  // compound the multiplier.
  boostNearbyKids(petKid) {
    const { commandBoost, commandDuration } = GAME_CONFIG.kindergartners.classPet;

    this.kindergartners.forEach(otherKid => {
      if (otherKid === petKid || otherKid.state !== 'chasing' || otherKid.boosted) return;

      const kidDistance = Math.hypot(otherKid.x - petKid.x, otherKid.y - petKid.y);
      if (kidDistance >= 150) return;

      otherKid.boosted = true;
      otherKid.speed *= commandBoost;

      const timer = setTimeout(() => {
        this.boostTimers.delete(timer);
        if (otherKid.boosted) {
          otherKid.speed /= commandBoost;
          otherKid.boosted = false;
        }
      }, commandDuration * (1000 / GAME_CONFIG.fps));

      this.boostTimers.add(timer);
    });
  }

  // Cancel pending boost restores so they cannot fire against a reset or
  // destroyed game.
  clearBoostTimers() {
    this.boostTimers.forEach(clearTimeout);
    this.boostTimers.clear();
  }

  // Create a paint puddle
  createPuddle(x, y) {
    const puddle = {
      x,
      y,
      width: 24,
      height: 24,
      duration: GAME_CONFIG.kindergartners.painter.puddleDuration
    };
    
    // Create sprite
    const puddleSprite = new PIXI.Sprite(PIXI.Texture.from(this.assets.environment.puddle));
    puddleSprite.anchor.set(0.5);
    puddleSprite.x = puddle.x;
    puddleSprite.y = puddle.y;
    puddleSprite.alpha = 0.6;
    this.gameContainer.addChild(puddleSprite);
    
    puddle.sprite = puddleSprite;
    this.puddles.push(puddle);
  }
  
  // Create a food projectile
  createProjectile(x, y) {
    const direction = Math.atan2(this.player.y - y, this.player.x - x);
    
    const projectile = {
      x,
      y,
      width: 16,
      height: 16,
      speed: GAME_CONFIG.kindergartners.snackStealer.projectileSpeed,
      direction,
      duration: GAME_CONFIG.kindergartners.snackStealer.projectileDuration
    };
    
    // Create sprite
    const projSprite = new PIXI.Graphics();
    projSprite.beginFill(0xFFAA33);
    projSprite.drawCircle(0, 0, 8);
    projSprite.endFill();
    projSprite.x = projectile.x;
    projSprite.y = projectile.y;
    this.gameContainer.addChild(projSprite);
    
    projectile.sprite = projSprite;
    this.projectiles.push(projectile);
  }
  
  // Update puddles
  updatePuddles(delta) {
    const expiredPuddles = [];
    
    this.puddles.forEach(puddle => {
      puddle.duration -= delta;
      
      // Fade out as duration decreases
      if (puddle.duration < 60) {
        puddle.sprite.alpha = puddle.duration / 60 * 0.6;
      }
      
      if (puddle.duration <= 0) {
        expiredPuddles.push(puddle);
      }
    });
    
    // Remove expired puddles
    expiredPuddles.forEach(puddle => {
      const index = this.puddles.indexOf(puddle);
      if (index !== -1) {
        this.puddles.splice(index, 1);
        this.gameContainer.removeChild(puddle.sprite);
      }
    });
  }
  
  // Update projectiles
  updateProjectiles(delta) {
    const expiredProjectiles = [];
    
    this.projectiles.forEach(proj => {
      // Move projectile
      proj.x += Math.cos(proj.direction) * proj.speed * delta;
      proj.y += Math.sin(proj.direction) * proj.speed * delta;
      
      // Update sprite position
      proj.sprite.x = proj.x;
      proj.sprite.y = proj.y;
      
      // Decrease duration
      proj.duration -= delta;
      
      // Check for collision with player
      const dx = proj.x - this.player.x;
      const dy = proj.y - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (!this.player.invulnerable && distance < this.player.width/2 + 8) {
        // Slow the player for a fixed number of frames. Frame-based rather than
        // setTimeout so it pauses with the game and dies with it.
        this.player.slowTimer = GAME_CONFIG.environment.projectileSlowDuration;
        expiredProjectiles.push(proj);
      }
      
      // Check for out of bounds or expired
      if (
        proj.x < -50 || 
        proj.x > GAME_CONFIG.width + 50 || 
        proj.y < -50 || 
        proj.y > GAME_CONFIG.height + 50 ||
        proj.duration <= 0
      ) {
        expiredProjectiles.push(proj);
      }
    });
    
    // Remove expired projectiles
    expiredProjectiles.forEach(proj => {
      const index = this.projectiles.indexOf(proj);
      if (index !== -1) {
        this.projectiles.splice(index, 1);
        this.gameContainer.removeChild(proj.sprite);
      }
    });
  }
  
  // Update game timers
  updateGameTimers(delta) {
    // Count down to next wave
    if (this.state.timeUntilNextWave > 0) {
      this.state.timeUntilNextWave -= delta;
      
      const seconds = Math.ceil(this.state.timeUntilNextWave / GAME_CONFIG.fps);
      this.timerText.text = `Timer: 0:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  // Update UI elements
  updateUI() {
    // Update health bar
    this.updateHealthBar();
    
    // Update stamina bar
    this.updateStaminaBar();
    
    // Update wave and score text
    this.waveText.text = `Wave: ${this.state.currentWave}`;
    this.scoreText.text = `Score: ${this.state.score}`;
  }
  
  // Update player health bar
  updateHealthBar() {
    if (!this.healthBar) return;
    
    const barWidth = (this.player.patience / this.player.maxPatience) * 200;
    
    this.healthBar.clear();
    
    // Choose color based on health percentage
    let color;
    if (this.player.patience > this.player.maxPatience * 0.6) {
      color = 0x33CC33; // Green
    } else if (this.player.patience > this.player.maxPatience * 0.3) {
      color = 0xFFCC33; // Yellow
    } else {
      color = 0xFF3333; // Red
    }
    
    this.healthBar.beginFill(color);
    this.healthBar.drawRect(20, 20, barWidth, 20);
    this.healthBar.endFill();
  }
  
  // Update player stamina bar
  updateStaminaBar() {
    if (!this.staminaBar) return;
    
    const barWidth = (this.player.stamina / this.player.maxStamina) * 200;
    
    this.staminaBar.clear();
    this.staminaBar.beginFill(0x3388FF);
    this.staminaBar.drawRect(20, 50, barWidth, 10);
    this.staminaBar.endFill();
  }
  
  // Update player direction indicator
  updateDirectionIndicator() {
    if (!this.directionIndicator) return;
    
    this.directionIndicator.clear();
    this.directionIndicator.beginFill(0xFFFFFF);
    
    const size = 8;
    
    switch(this.player.facingDirection) {
      case 'up':
        this.directionIndicator.drawRect(this.player.x - size, this.player.y - this.player.height/2 - size*2, size*2, size);
        break;
      case 'down':
        this.directionIndicator.drawRect(this.player.x - size, this.player.y + this.player.height/2 + size, size*2, size);
        break;
      case 'left':
        this.directionIndicator.drawRect(this.player.x - this.player.width/2 - size*2, this.player.y - size, size, size*2);
        break;
      case 'right':
        this.directionIndicator.drawRect(this.player.x + this.player.width/2 + size, this.player.y - size, size, size*2);
        break;
    }
    
    this.directionIndicator.endFill();
    
    // Draw push action indicator
    if (this.player.isPushing) {
      this.directionIndicator.lineStyle(2, 0xFFFFFF, 0.7);
      
      switch(this.player.facingDirection) {
        case 'up':
          this.directionIndicator.arc(this.player.x, this.player.y - this.player.pushRange/2, this.player.pushRange/2, Math.PI, 0);
          break;
        case 'down':
          this.directionIndicator.arc(this.player.x, this.player.y + this.player.pushRange/2, this.player.pushRange/2, 0, Math.PI);
          break;
        case 'left':
          this.directionIndicator.arc(this.player.x - this.player.pushRange/2, this.player.y, this.player.pushRange/2, Math.PI/2, 3*Math.PI/2);
          break;
        case 'right':
          this.directionIndicator.arc(this.player.x + this.player.pushRange/2, this.player.y, this.player.pushRange/2, 3*Math.PI/2, Math.PI/2);
          break;
      }
    }
    
    // Draw dodge effect
    if (this.player.isDodging) {
      this.directionIndicator.lineStyle(2, 0xFFFFFF, 0.5);
      this.directionIndicator.drawCircle(this.player.x, this.player.y, this.player.width);
    }
  }
  
  // Check for wave completion
  checkWaveCompletion() {
    // Check if all kindergartners are defeated or settled
    const activeKids = this.kindergartners.filter(kid => kid.state !== 'settled');
    
    if (activeKids.length === 0 && this.state.currentWave > 0 && this.state.timeUntilNextWave <= 0) {
      // Award bonus points for completing wave
      this.state.score += this.state.currentWave * GAME_CONFIG.waveDifficulty.waveCompletionBonus;
      
      // Start next wave
      this.startNextWave();
    }
  }
  
  // Check game over conditions
  checkGameOver() {
    if (this.player.patience <= 0) {
      this.handleGameOver();
    }
  }
  
  // Handle game over
  handleGameOver() {
    console.log('Game over');
    
    // Update game state
    this.state.running = false;
    this.state.gameOver = true;
    
    // Stop game loop
    this.app.ticker.remove(this.gameLoop);
    
    // Update final score display
    this.finalScoreText.text = `Final Score: ${this.state.score}`;
    this.finalScoreText.position.set(GAME_CONFIG.width / 2 - this.finalScoreText.width / 2, GAME_CONFIG.height / 2);
    
    this.finalWaveText.text = `Waves Survived: ${this.state.currentWave}`;
    this.finalWaveText.position.set(GAME_CONFIG.width / 2 - this.finalWaveText.width / 2, GAME_CONFIG.height / 2 + 40);
    
    // Show game over screen
    this.gameOverScreen.visible = true;
    
    // Event callback
    if (this.onGameOver) {
      this.onGameOver({
        score: this.state.score,
        wave: this.state.currentWave
      });
    }
  }
  
  // Clean up game
  destroy() {
    this.destroyed = true;

    // Remove event listeners
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    this.clearBoostTimers();

    // Stop game loop. ticker.remove() is already a no-op when the callback was
    // never added, and the ticker only exists once init() has resolved.
    if (this.app.ticker) {
      this.app.ticker.remove(this.gameLoop);
    }

    // Clean up PIXI app. If init() is still in flight the renderer does not
    // exist yet; init() checks `destroyed` and tears it down itself.
    if (this.app.renderer) {
      this.app.destroy(true);
    }
  }
  
  // Utility: Check collision between two objects
  checkCollision(obj1, obj2) {
    return obj1.x - obj1.width/2 < obj2.x + obj2.width/2 &&
           obj1.x + obj1.width/2 > obj2.x - obj2.width/2 &&
           obj1.y - obj1.height/2 < obj2.y + obj2.height/2 &&
           obj1.y + obj1.height/2 > obj2.y - obj2.height/2;
  }
  
  // Input handlers.
  // Only single-character keys are lower-cased: holding Shift reports 'A'
  // rather than 'a', which otherwise makes movement impossible while running
  // and strands keys in the down state after keyup. Named keys ('Shift',
  // 'ArrowLeft', ...) must keep their casing.
  static normalizeKey(key) {
    return key.length === 1 ? key.toLowerCase() : key;
  }

  onKeyDown(e) {
    const key = GameEngine.normalizeKey(e.key);
    this.keys[key] = true;

    // Start pushing on Z key
    if (key === 'z' && !this.player.isPushing && this.player.pushCooldown <= 0) {
      this.player.isPushing = true;
      this.player.pushCooldown = GAME_CONFIG.player.pushCooldown;
    }
    
    // Start dodging on X key
    if (key === 'x' && !this.player.isDodging && this.player.dodgeCooldown <= 0 &&
        this.player.stamina >= GAME_CONFIG.player.dodgeStaminaCost) {
      this.player.isDodging = true;
      this.player.dodgeCooldown = GAME_CONFIG.player.dodgeCooldown;
      this.player.stamina -= GAME_CONFIG.player.dodgeStaminaCost;
      this.player.invulnerable = true;
    }
  }
  
  onKeyUp(e) {
    this.keys[GameEngine.normalizeKey(e.key)] = false;
  }
}

export default GameEngine;