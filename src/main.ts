import * as THREE from 'three';
import { Bell } from './game/bells';
import { LaserManager, Spaceship } from './game/rocket';
import { EffectComposer, RenderPass, UnrealBloomPass } from 'three-stdlib';
import { DiamonEntity } from './game/DiamonEntity';
import { LoaderScreen } from './game/LoaderScreen';
import { BackgroundManager } from './game/BackgroundManager';
import { SoundManager } from './game/soundManager';
import { PurpleStarEntity } from './game/PurpleStarEntity';
import { GreenNatEntity } from './game/GreenNatEntity';
import { PowerUpEntity } from './game/PowerUpEntity';

// Development mode flag - set to true to skip loader
const DEV_MODE = false;

enum GameState {
    LOADING,
    MENU,
    PLAYING,
    ENTER_INITIALS
}

interface HighScore {
    initials: string;
    score: number;
    date: number;
}

class SpaceShooterGame {
  private initScene: () => void = () => {};
  private setupControls: () => void = () => {};
  private setupResizeHandler: () => void = () => {};
  private createCursorSight: () => void = () => {};
  private updateHighScoresDisplay: () => void = () => {};
  private startRenderLoop: () => void = () => {};
  private updateCursorPosition: (event: MouseEvent) => void = () => {};
  private getHighScores: () => HighScore[] = () => [];
  private saveHighScore: (initials: string, score: number) => void = () => {};
  private updateDifficulty: () => void = () => {};
  private startGame: () => void = () => {};
  private stopGameLoop: () => void = () => {};
  private returnToMenu: () => void = () => {};
  private submitHighScore: () => void = () => {};
  private spawnBell: () => void = () => {};
  private spawnDiamond: () => void = () => {};
  private spawnStar: () => void = () => {};
  private spawnNat: () => void = () => {};
  private spawnPup: () => void = () => {};
  private updateEntities: () => void = () => {};
  private checkCollisions: () => void = () => {};
  private gameOver: () => void = () => {};
  private flash: (delta: number) => void = () => {};
  private updateScore: (delta: number) => void = () => {};
  private takeDamage: (delta: number) => void = () => {};

  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private backgroundManager!: BackgroundManager;
  public soundManager!: SoundManager;

  private spaceship!: Spaceship;
  private bells: Bell[] = [];
  private diamonds: DiamonEntity[] = [];
  private stars: PurpleStarEntity[] = [];
  private nats: GreenNatEntity[] = [];
  private Pups: PowerUpEntity[] = [];
  private laserManager!: LaserManager;
  private loader: LoaderScreen;

  private mousePosition: THREE.Vector2 = new THREE.Vector2();
  private cursorSight!: THREE.LineSegments;

  private keys: Record<string, boolean> = {};
  private score: number = 0;
  private isGameOver: boolean = false;
  private gameLoopIntervals: number[] = [];
  private animationFrameId: number | null = null;
  
  private gameStartTime: number = 0;
  private difficultyMultiplier: number = 1;
  private readonly DIFFICULTY_INCREASE_RATE: number = 0.1;
  private readonly MAX_DIFFICULTY_MULTIPLIER: number = 5;

  private gameState: GameState = GameState.LOADING;
  private menuOverlay: HTMLElement;
  private scoreDisplay: HTMLElement;
  private initialsOverlay: HTMLElement;
  private initialsInput: HTMLInputElement;
  private finalScoreDisplay: HTMLElement;
  private highScoresList: HTMLElement;
  private readonly MAX_HIGH_SCORES: number = 5;
  private gameEndedByCollision: boolean = false;

  constructor() {
      this.menuOverlay = document.getElementById('menu-overlay')!;
      this.initialsOverlay = document.getElementById('initials-overlay')!;
      this.initialsInput = document.getElementById('initials-input') as HTMLInputElement;
      this.finalScoreDisplay = document.getElementById('final-score')!;
      this.highScoresList = document.getElementById('high-scores-list')!;
      this.scoreDisplay = document.getElementById('score-display')!;
      this.loader = new LoaderScreen(DEV_MODE);

      // Hide menu until loading is complete
      this.menuOverlay.classList.add('menu-hidden');
      this.initialsOverlay.classList.add('menu-hidden');

      this.initializeGameMethods();
  }

  private async initialize(): Promise<void> {
      // Start loading sequence
      this.soundManager = new SoundManager();
      // Load sound effects
      this.soundManager.loadSound('missedBell', 'sounds/bellMissed.wav');
      this.soundManager.loadSound('diamondHit', 'sounds/diamondHit.mp3');
      this.soundManager.loadSound('lasers', 'sounds/lasers.mp3');
      this.soundManager.loadSound('pickupBell', 'sounds/pickUpBell.wav');
      this.soundManager.loadSound('sparkle', 'sounds/sparkle.mp3');
      this.soundManager.loadSound('gameOver', 'sounds/gameOver.mp3');
      this.soundManager.loadSound('starHit', 'sounds/starhit.mp3');
      this.soundManager.loadSound('starend', 'sounds/starend.mp3');
      this.soundManager.loadSound('nathit', 'sounds/nat.mp3');
      this.soundManager.loadSound('shieldDown', 'sounds/shieldDown.mp3');
      this.soundManager.loadSound('powerUp', 'sounds/powerUp.mp3');
      this.soundManager.loadMusic('menu', 'music/menumusic.mp3');
      this.soundManager.loadMusic('game', 'music/gameMusic.mp3');
      // Adjust volumes
      this.soundManager.setMusicVolume(0.3);
      this.soundManager.setSoundVolume(0.6);
      await this.loader.startLoading();

      // Show menu after loading
      this.gameState = GameState.MENU;
      this.menuOverlay.classList.remove('menu-hidden');

      // Initialize game systems
      this.initScene();
      this.setupControls();
      this.setupResizeHandler();
      this.createCursorSight();
      this.updateHighScoresDisplay();
      this.startRenderLoop();
  }

  private initializeGameMethods(): void {
      this.initScene = () => {
          const SCREEN_WIDTH = window.innerWidth;
          const SCREEN_HEIGHT = window.innerHeight;

          this.scene = new THREE.Scene();
          
          this.camera = new THREE.OrthographicCamera(
              -SCREEN_WIDTH / 2,
              SCREEN_WIDTH / 2,
              SCREEN_HEIGHT / 2,
              -SCREEN_HEIGHT / 2,
              -500,
              1000
          );
          this.camera.position.z = 5;
          this.camera.layers.enable(0);
          this.camera.layers.enable(1);
          this.camera.layers.enable(2);

          this.renderer = new THREE.WebGLRenderer({
            alpha: true,  // This is the key option
            });
          this.renderer.autoClear = false;
          this.renderer.setClearColor(0x000000, 0);
          this.renderer.setSize(SCREEN_WIDTH * 0.95, SCREEN_HEIGHT * 0.95);
          document.body.appendChild(this.renderer.domElement);

          const renderScene = new RenderPass(this.scene, this.camera);
          const bloomPass = new UnrealBloomPass(new THREE.Vector2(SCREEN_WIDTH, SCREEN_HEIGHT), 1.5, 0.4, 100);
          bloomPass.threshold = 0.1;
          bloomPass.strength = 3;
          bloomPass.radius = 0.9;
          bloomPass.renderToScreen = true;
          this.composer = new EffectComposer(this.renderer);
          this.composer.addPass(renderScene);
          this.composer.addPass(bloomPass);

          this.backgroundManager = new BackgroundManager(this.scene, SCREEN_WIDTH, SCREEN_HEIGHT);
          this.spaceship = new Spaceship(this.scene, SCREEN_WIDTH, SCREEN_HEIGHT);
          this.laserManager = new LaserManager(this.scene, SCREEN_WIDTH);

          this.soundManager.playMusic("menu");
      };

      this.setupControls = () => {
          document.addEventListener('keydown', (e) => {
              this.keys[e.key] = true;
              
              if (e.code === 'Enter') {
                  if (this.gameState === GameState.MENU) {
                      this.startGame();
                  } else if (this.gameState === GameState.ENTER_INITIALS) {
                      this.submitHighScore();
                  }
              } else if (e.code === 'Space' && this.gameState === GameState.PLAYING) {
                  const direction = new THREE.Vector3()
                      .copy(this.cursorSight.position)
                      .sub(this.spaceship.position)
                      .normalize();
                  direction.z = 0;
                  this.spaceship.shootLaser(this.laserManager, direction);
                  this.soundManager.playSound("lasers");
              } else if (e.code === 'Escape' && this.gameState === GameState.PLAYING) {
                  this.returnToMenu();
              }
          });

          document.addEventListener('keyup', (e) => {
              this.keys[e.key] = false;
          });

          this.renderer.domElement.addEventListener('mousemove', (e) => {
              this.updateCursorPosition(e);
          });

          this.renderer.domElement.style.cursor = 'none';
      };

      this.setupResizeHandler = () => {
          window.addEventListener('resize', () => {
              const SCREEN_WIDTH = window.innerWidth;
              const SCREEN_HEIGHT = window.innerHeight;

              this.camera.left = -SCREEN_WIDTH / 2;
              this.camera.right = SCREEN_WIDTH / 2;
              this.camera.top = SCREEN_HEIGHT / 2;
              this.camera.bottom = -SCREEN_HEIGHT / 2;
              this.camera.updateProjectionMatrix();

              this.renderer.setSize(SCREEN_WIDTH * 0.95, SCREEN_HEIGHT * 0.95);
          });
      };

      this.createCursorSight = () => {
          const size = 10;
          const vertices = new Float32Array([
              -size, 0, 0,
              size, 0, 0,
              0, -size, 0,
              0, size, 0,
              ...Array.from({ length: 24 }, (_, i) => {
                  const angle = (i / 12) * Math.PI;
                  const radius = size * 1.5;
                  return i % 2 === 0 
                      ? [Math.cos(angle) * radius, Math.sin(angle) * radius, 0]
                      : [Math.cos(angle + Math.PI/12) * radius, Math.sin(angle + Math.PI/12) * radius, 0];
              }).flat()
          ]);

          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

          const material = new THREE.LineBasicMaterial({
              color: 0xff0000,
              transparent: true,
              opacity: 0.6
          });

          this.cursorSight = new THREE.LineSegments(geometry, material);
          this.cursorSight.renderOrder = 999;
          this.cursorSight.layers.set(2);
          this.scene.add(this.cursorSight);
      };

      this.updateCursorPosition = (event: MouseEvent) => {
          const rect = this.renderer.domElement.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          
          this.mousePosition.x = (x / rect.width) * 2 - 1;
          this.mousePosition.y = -(y / rect.height) * 2 + 1;

          const vector = new THREE.Vector3(this.mousePosition.x, this.mousePosition.y, 0);
          vector.unproject(this.camera);
          
          this.cursorSight.position.copy(vector);
      };

      this.getHighScores = () => {
          try {
              const scoresJson = localStorage.getItem('highScores');
              if (!scoresJson) return [];
              
              const scores = JSON.parse(scoresJson);
              if (!Array.isArray(scores)) return [];
              
              return scores
                  .filter(score => 
                      typeof score === 'object' && 
                      typeof score.initials === 'string' && 
                      typeof score.score === 'number'
                  )
                  .map(score => ({
                      initials: score.initials.toUpperCase().slice(0, 3),
                      score: Math.floor(score.score),
                      date: score.date || Date.now()
                  }))
                  .sort((a, b) => b.score - a.score || b.date - a.date)
                  .slice(0, this.MAX_HIGH_SCORES);
          } catch (error) {
              console.error('Error loading high scores:', error);
              return [];
          }
      };

      this.saveHighScore = (initials: string, score: number) => {
          try {
              const scores = this.getHighScores();
              const newScore: HighScore = {
                  initials: initials.toUpperCase().slice(0, 3),
                  score: Math.floor(score),
                  date: Date.now()
              };
              
              scores.push(newScore);
              scores.sort((a, b) => b.score - a.score || b.date - a.date);
              scores.splice(this.MAX_HIGH_SCORES);
              
              localStorage.setItem('highScores', JSON.stringify(scores));
              this.updateHighScoresDisplay();
          } catch (error) {
              console.error('Error saving high score:', error);
          }
      };

      this.updateHighScoresDisplay = () => {
        const scores = this.getHighScores();
    
        if (scores.length > 0) {
            const scoreHtml = scores.map((score, index) => `
                <div class="score-item">
                    <span>#${index + 1} <strong>${score.initials}</strong></span>
                    <span style="display: inline-block; width: 150px; text-align: right;">${score.score.toLocaleString()}</span>
                </div>
            `).join('');
            this.highScoresList.innerHTML = scoreHtml;
        } else {
            this.highScoresList.innerHTML = '<div class="score-item">No scores yet</div>';
        }
    };

    this.updateScore = (delta:number) => {
        this.score += delta;
        this.scoreDisplay.textContent = `Score: ${this.score}`;
        this.flash(delta);
      }

    this.takeDamage = (delta: number) => {
        // Update health with delta and ensure it stays within the 0 to maxHealth range
        this.spaceship.takeDamage(delta);
        this.soundManager.playSound("shieldDown");
    
        // Check if health is zero or less, and trigger game over
        if (this.spaceship.health <= 0) {
            this.gameEndedByCollision = true;
            this.soundManager.playSound("gameOver");
            this.gameOver();
        }
    };

    this.flash = (delta: number) => {
        if (delta > 0) {
          this.scoreDisplay.classList.add('flash-green');
          setTimeout(() => this.scoreDisplay.classList.remove('flash-green'), 200);
        } else {
            this.scoreDisplay.classList.add('flash-red');
          setTimeout(() => this.scoreDisplay.classList.remove('flash-red'), 200);
        }
      }
    
    this.updateDifficulty = () => {
        const gameTimeInMinutes = (Date.now() - this.gameStartTime) / (1000 * 60);
        this.difficultyMultiplier = Math.min(
            1 + (gameTimeInMinutes * this.DIFFICULTY_INCREASE_RATE),
            this.MAX_DIFFICULTY_MULTIPLIER
        );
    };

      this.startGame = () => {
          this.gameState = GameState.PLAYING;
          this.soundManager.stopMusic();
          this.soundManager.setMusicVolume(0.8);
          this.soundManager.playMusic("game");
          this.menuOverlay.classList.add('menu-hidden');
          this.initialsOverlay.classList.add('menu-hidden');

          this.isGameOver = false;
          this.score = 0;
          this.updateScore(0);
          this.difficultyMultiplier = 4;
          this.gameStartTime = Date.now();
          this.gameEndedByCollision = false;

          this.bells.forEach(bell => bell.removeFromScene());
          this.diamonds.forEach(diamond => diamond.removeFromScene());
          this.stars.forEach(star => star.removeFromScene());
          this.nats.forEach(star => star.removeFromScene());
          this.bells = [];
          this.diamonds = [];
          this.stars = [];
          this.nats = [];

          if (!this.spaceship.isActive()) {
            console.log("lets fly");
              this.spaceship = new Spaceship(this.scene, window.innerWidth, window.innerHeight);
          }

          this.gameLoopIntervals.push(
              window.setInterval(() => this.spawnBell(), 4000),
              window.setInterval(() => this.spawnNat(), 350),
              window.setInterval(() => this.spawnPup(), 25000),
              window.setInterval(() => this.spawnDiamond(), 3000),
              window.setInterval(() => this.spawnStar(), 5500),
              window.setInterval(() => this.updateDifficulty(), 1000)
          );
      };

      this.stopGameLoop = () => {
          this.gameLoopIntervals.forEach(interval => window.clearInterval(interval));
          this.gameLoopIntervals = [];
          if (this.animationFrameId !== null) {
              cancelAnimationFrame(this.animationFrameId);
              this.animationFrameId = null;
          }
      };

      this.returnToMenu = () => {
          this.gameState = GameState.MENU;
          this.soundManager.stopMusic();
          this.soundManager.setMusicVolume(0.3);
          this.soundManager.playMusic("menu");
          this.menuOverlay.classList.remove('menu-hidden');
          this.initialsOverlay.classList.add('menu-hidden');
          this.gameOver();
      };

      this.submitHighScore = () => {
          let initials = this.initialsInput.value.trim().toUpperCase();
          if (!initials) {
              initials = 'AAA';
          }
          
          initials = initials.padEnd(3, 'A').slice(0, 3);
          
          this.saveHighScore(initials, this.score);
          
          this.initialsOverlay.classList.add('menu-hidden');
          this.menuOverlay.classList.remove('menu-hidden');
          this.initialsInput.value = '';
          this.gameState = GameState.MENU;
      };

      this.spawnBell = () => {
          if (this.gameState !== GameState.PLAYING) return;
          
          const bell = new Bell(
              this.scene, 
              window.innerWidth, 
              window.innerHeight
          );
          this.bells.push(bell);
      };

      this.spawnDiamond = () => {
          if (this.gameState !== GameState.PLAYING) return;

          const diamond = new DiamonEntity(
              this.scene, 
              window.innerWidth, 
              window.innerHeight,
              0,
              this.difficultyMultiplier
          );
          this.diamonds.push(diamond);
      };

      this.spawnStar = () => {
          if (this.gameState !== GameState.PLAYING) return;

          const star = new PurpleStarEntity(
              this.scene, 
              window.innerWidth, 
              window.innerHeight,
              0,
          );
          this.stars.push(star);
      };

      this.spawnNat = () => {
          if (this.gameState !== GameState.PLAYING) return;

          const nat = new GreenNatEntity(
              this.scene, 
              window.innerWidth, 
              window.innerHeight,
              0,
          );
          this.nats.push(nat);
      };

      this.spawnPup = () => {
          if (this.gameState !== GameState.PLAYING) return;
          if (this.laserManager.boostFactor >= 4) return; 

          const pp = new PowerUpEntity(
              this.scene, 
              window.innerWidth, 
              window.innerHeight,
              0,
          );
          this.Pups.push(pp);
      };

      this.updateEntities = () => {
          if (this.gameState !== GameState.PLAYING) return;

          this.updateDifficulty();

          this.spaceship.update();
          if (this.keys["w"]) this.spaceship.moveUp();
          if (this.keys["s"]) this.spaceship.moveDown();

          const currentTime = performance.now() * 0.001;

          for (let i = this.bells.length - 1; i >= 0; i--) {
              const bell = this.bells[i];
              bell.update();
              if (bell.isOffScreen()) {
                this.soundManager.playSound("missedBell");
                  bell.removeFromScene();
                  this.bells.splice(i, 1);
                  this.updateScore(-500);
              }
          }

          for (let i = this.diamonds.length - 1; i >= 0; i--) {
              const diamond = this.diamonds[i];
              diamond.update(currentTime);
              if (diamond.isOffScreen()) {
                  diamond.removeFromScene();
                  this.diamonds.splice(i, 1);
                  this.updateScore(-200);
              }
          }

          for (let i = this.stars.length - 1; i >= 0; i--) {
              const star = this.stars[i];
              star.update(currentTime);
              if (star.isOffScreen()) {
                  star.removeFromScene();
                  this.stars.splice(i, 1);
                  this.updateScore(-350);
              }
          }

          for (let i = this.nats.length - 1; i >= 0; i--) {
              const nat = this.nats[i];
              nat.update(currentTime);
              if (nat.isOffScreen()) {
                  nat.removeFromScene();
                  this.nats.splice(i, 1);
                  this.updateScore(-20);
              }
          }

          for (let i = this.Pups.length - 1; i >= 0; i--) {
              const pup = this.Pups[i];
              pup.update(currentTime);
              if (pup.isOffScreen()) {
                  pup.removeFromScene();
                  this.Pups.splice(i, 1);
              }
          }

          this.laserManager.update();
      };

      this.checkCollisions = () => {
          if (this.gameState !== GameState.PLAYING) return;
          const lasers = this.laserManager.getLasers();
          
          for (let i = lasers.length - 1; i >= 0; i--) {
            const laser = lasers[i];
            const laserSphere = new THREE.Sphere(laser.position, 8);
    
            for (let targetType of [this.diamonds, this.stars, this.nats]) {
                for (let j = targetType.length - 1; j >= 0; j--) {
                    const target = targetType[j];
                    const targetSphere = new THREE.Sphere(
                        target.boxGroup.position,
                        target.getCollisionRadius()
                    );
    
                    if (targetSphere.intersectsSphere(laserSphere)) {
                        // Handle laser removal
                        this.laserManager.removeLaser(laser.group);
    
                        
    
                        // Play sound effects based on the target type
                        if (target instanceof DiamonEntity) {
                            this.soundManager.playSound("diamondHit");
                            // Process the hit target
                            const newTargets = target.split();
                            target.removeFromScene();
                            targetType.splice(j, 1);

                            // Handle scoring and spawning
                            if (newTargets.length > 0) {
                                this.soundManager.playSound("sparkle");
                                targetType.push(...newTargets);
                                this.updateScore(150 * (target.currentLevel + 1))
                            } else {
                                this.updateScore(300)
                            }
        
                            break;
                        } else if (target instanceof PurpleStarEntity) {
                            target.takeDamage();
                            if(target.health === 0)
                            {
                                target.removeFromScene();
                                targetType.splice(j, 1);
                               // this.score += 500;
                                this.updateScore(500);
                                this.soundManager.playSound("starend");
                            }
                            else{
                                this.soundManager.playSound("starHit");
                            }
                            this.updateScore(50);
                        }
                        else if (target instanceof GreenNatEntity) {
                            target.removeFromScene();
                            targetType.splice(j, 1);
                            this.soundManager.playSound("nathit");
                            this.updateScore(25);
                            
                        }
                    }
                }
            }
          }

          for (let i = this.Pups.length - 1; i >= 0; i--) {
              const pup = this.Pups[i];
              const distance = this.spaceship.position.distanceTo(pup.boxGroup.position);
              if (distance < 60) {
                  pup.removeFromScene();
                  this.laserManager.boostLasers();
                  this.soundManager.playSound("powerUp");
                  this.Pups.splice(i, 1);
              }
          }
          for (let i = this.bells.length - 1; i >= 0; i--) {
              const bell = this.bells[i];
              const distance = this.spaceship.position.distanceTo(bell.position);
              if (distance < 70) {
                  bell.removeFromScene();
                  this.soundManager.playSound("pickupBell");
                  this.bells.splice(i, 1);
                  this.score += 500;
              }
          }

          for (const diamond of this.diamonds) {
              const distance = this.spaceship.position.distanceTo(diamond.boxGroup.position);
              if (distance < 45) {
                  this.takeDamage(-25);
                  break;
              }
          }

          for (const star of this.stars) {
              const distance = this.spaceship.position.distanceTo(star.position);
              if (distance < 120) {
                  this.takeDamage(-25);
                  break;
              }
          }

          for (const nat of this.nats) {
              const distance = this.spaceship.position.distanceTo(nat.boxGroup.position);
              if (distance < 35) {
                  this.takeDamage(-25);
                  break;
              }
          }
      };

      this.gameOver = () => {
          this.isGameOver = true;
          this.spaceship.removeFromScene();
          this.stopGameLoop();
          this.soundManager.stopMusic();
          this.soundManager.setMusicVolume(0.3);
          this.soundManager.playMusic("menu3");

          if (this.gameEndedByCollision) {
              this.gameState = GameState.ENTER_INITIALS;
              this.finalScoreDisplay.textContent = this.score.toString();
              this.initialsOverlay.classList.remove('menu-hidden');
              this.menuOverlay.classList.add('menu-hidden');
              this.initialsInput.focus();
          } else {
              this.gameState = GameState.MENU;
              this.menuOverlay.classList.remove('menu-hidden');
          }
      };

      this.startRenderLoop = () => {
          const animate = (timeStamp: number = 0) => {
              requestAnimationFrame(animate);

              
            // Only render if game is in PLAYING state
            if (this.gameState === GameState.PLAYING) {
                // Clear the renderer completely before starting

                // Layer 0 Rendering (Base Layer)
                this.camera.layers.set(0);
                this.backgroundManager.update();
                this.updateEntities();
                this.checkCollisions();
                this.renderer.render(this.scene, this.camera);

                // Layer 1 Rendering (Potentially Post-Processing)
                this.renderer.clearDepth();
                this.camera.layers.set(1);
                this.composer.render();

                // Layer 2 Rendering (Overlay/UI Layer)
                this.renderer.clearDepth();
                this.camera.layers.set(2);
                this.renderer.render(this.scene, this.camera);
            }
                
          };
          animate();
      };
  }

  public start(): void {
      this.initialize();
  }
}

const game = new SpaceShooterGame();
game.start();