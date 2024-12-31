import { Line2, LineGeometry, LineMaterial } from "three-stdlib";
import { GameEntity } from "./gameEntity";
import * as THREE from 'three';

export interface ParticleLine extends Line2 {
    material: LineMaterial;
    geometry: LineGeometry;
    userData: {
        velocity: THREE.Vector3;
    };
}

export class DiamonEntity extends GameEntity {
    protected readonly MAX_SCREEN_WIDTH: number;
    protected readonly MAX_SCREEN_HEIGHT: number;
    public boxGroup: THREE.Group;
    protected velocity: THREE.Vector3;
    protected speedMultiplier: number;
    public diamonds: UpdatableLine2[] = [];
    public readonly currentLevel: number; // 0 = outer, 1 = middle, 2 = inner

    constructor(
        scene: THREE.Scene, 
        screenWidth: number, 
        screenHeight: number,
        level: number = 0,
        speedMultiplier: number = 1
    ) {
        // Create an invisible mesh for collision detection
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ 
            visible: false,
            transparent: true,
            opacity: 0
        });
        super(geometry, material, scene);

        this.MAX_SCREEN_WIDTH = screenWidth;
        this.MAX_SCREEN_HEIGHT = screenHeight;
        this.speedMultiplier = speedMultiplier;
        this.currentLevel = level;

        this.boxGroup = new THREE.Group();
        this.boxGroup.layers.set(1); // Set to layer 0 for bloom effects
        this.scene.add(this.boxGroup);
        
        // Initial positioning
        this.boxGroup.position.x = screenWidth / 2;
        this.boxGroup.position.y = Math.random() * screenHeight - screenHeight / 2;

        // Base velocity with random direction
        this.velocity = new THREE.Vector3(
            (Math.random() * -0.5 - 0.5) * this.speedMultiplier,
            (Math.random() - 0.5) * 0.3,
            0
        );

        // Set collision mesh position to match boxGroup
        this.position.copy(this.boxGroup.position);

        this.init();
    }

    protected init(): void {
        // Only create diamonds from current level onwards
        const numDiamonds = 3 - this.currentLevel;
        this.addBoxes(numDiamonds);
    }

    protected createParticles(intensity: number): void {
        const particlesCount = Math.floor(50 * intensity);
        const particles = new THREE.Group();
        particles.layers.set(1); // Set particles to layer 0 for bloom effects
        
        for (let i = 0; i < particlesCount; i++) {
            const lineGeometry = new LineGeometry();
            const size = Math.random() * 20 * intensity;
            lineGeometry.setPositions(this.getDiamondPositions(size, size));
            
            const material = new LineMaterial({
                color: 0xffffff,
                linewidth: 2,
                opacity: Math.random() * 0.5 + 0.5,
                transparent: true,
                blending: THREE.AdditiveBlending,
            });
            material.resolution.set(this.MAX_SCREEN_WIDTH, this.MAX_SCREEN_HEIGHT);

            const particle = new Line2(lineGeometry, material) as ParticleLine;
            particle.layers.set(1);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 50;
            particle.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0
            );
            
            const speed = Math.random() * 5 + 2;
            particle.userData.velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                0
            );
            
            particles.add(particle);
        }
        
        particles.position.copy(this.boxGroup.position);
        this.scene.add(particles);
        
        const animate = () => {
            if (particles.children.length === 0) return;

            const particleLines = particles.children as ParticleLine[];
            let allFaded = true;

            particleLines.forEach(particle => {
                particle.position.add(particle.userData.velocity);
                particle.material.opacity *= 0.95;
                if (particle.material.opacity >= 0.01) {
                    allFaded = false;
                }
            });
            
            if (allFaded) {
                this.scene.remove(particles);
                particleLines.forEach(particle => {
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    protected getDiamondPositions(width: number, height: number): number[] {
        const halfWidth = width / 2;
        const halfHeight = height / 2;
    
        return [
            0, halfHeight, 0,        // Top point
            halfWidth, 0, 0,         // Right point
            0, -halfHeight, 0,       // Bottom point
            -halfWidth, 0, 0,        // Left point
            0, halfHeight, 0         // Close the diamond
        ];
    }

    protected createDiamond(index: number): UpdatableLine2 {
        const hue = 0.8 - index * 0.1;
        const material = new LineMaterial({
            color: new THREE.Color().setHSL(hue, 1.0, 0.5).getHex(),
            linewidth: 4 - index,
            opacity: 0.9 - (index * 0.2),
        });
        
        material.transparent = true;
        material.blending = THREE.AdditiveBlending;
        material.resolution.set(this.MAX_SCREEN_WIDTH, this.MAX_SCREEN_HEIGHT);
      
        const geometry = new LineGeometry();
        const size = 100 - (index * 20);
        geometry.setPositions(this.getDiamondPositions(size, size));
        const mesh = new UpdatableLine2(geometry, material, index);
        mesh.layers.set(1); // Set to layer 0 for bloom effects
        this.diamonds.push(mesh);
        return mesh;
    }

    protected addBoxes(numBoxes: number): void {
        for (let i = 0; i < numBoxes; i += 1) {
            let box = this.createDiamond(i);
            this.boxGroup.add(box);
        }
    }

    public update(t: number): void {
        // Update position
        this.boxGroup.position.add(this.velocity);
        
        // Update collision mesh position
        this.position.copy(this.boxGroup.position);
        
        // Update diamond animations
        this.diamonds.forEach((diamond, i) => {
            diamond.update(t, i);
        });
    }

    public split(): DiamonEntity[] {
        
        // Create particle effect
        const intensity = 1 - (this.currentLevel * 0.3);
        this.createParticles(intensity);
        if (this.currentLevel >= 2) return []; // Inner diamond doesn't split

        // Create next level diamond
        const newDiamond = new DiamonEntity(
            this.scene,
            this.MAX_SCREEN_WIDTH,
            this.MAX_SCREEN_HEIGHT,
            this.currentLevel + 1,
            this.speedMultiplier
        );

        // Copy position and adjust velocity
        newDiamond.boxGroup.position.copy(this.boxGroup.position);
        newDiamond.velocity.copy(this.velocity).multiplyScalar(1.2);

        return [newDiamond];
    }

    public isOffScreen(): boolean {
        return this.boxGroup.position.x < -this.MAX_SCREEN_WIDTH / 2;
    }

    public getCollisionRadius(): number {
        return 50 - (this.currentLevel * 10);
    }

    public isDiamond(target: GameEntity): target is DiamonEntity {
        return target instanceof DiamonEntity;
    }

    public override removeFromScene(): void {
        this.scene.remove(this.boxGroup);
        this.diamonds.forEach(diamond => {
            diamond.geometry.dispose();
            (diamond.material as LineMaterial).dispose();
        });
        super.removeFromScene();
    }
}

class UpdatableLine2 extends Line2 {
    update: (t: number, i: number) => void;
    private rotationSpeed: number;
    private baseScale: number;
    private static readonly PULSE_SPEED = 0.003;
  
    constructor(geometry: LineGeometry, material: LineMaterial, index: number) {
        super(geometry, material);
        
        this.rotationSpeed = 0.02 - (index * 0.005);
        this.baseScale = 1.0 - (index * 0.2);
        
        this.position.set(0, 0, 0);
      
        this.update = (t: number, i: number) => {
            this.rotation.z += this.rotationSpeed;
            const pulseFactor = Math.sin(t * UpdatableLine2.PULSE_SPEED) * 0.2 + 1;
            const finalScale = this.baseScale * pulseFactor;
            this.scale.set(finalScale, finalScale, finalScale);
        };
    }
}