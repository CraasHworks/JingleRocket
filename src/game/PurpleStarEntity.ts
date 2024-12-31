import { Line2, LineGeometry, LineMaterial } from "three-stdlib";
import { GameEntity } from "./gameEntity";
import * as THREE from 'three';
import { ParticleLine } from "./DiamonEntity";

export class PurpleStarEntity extends GameEntity {
    protected readonly MAX_SCREEN_WIDTH: number;
    protected readonly MAX_SCREEN_HEIGHT: number;
    public boxGroup: THREE.Group;
    protected velocity: THREE.Vector3;
    protected speedMultiplier: number;
    public health: number;
    private maxHealth: number;

    constructor(
        scene: THREE.Scene, 
        screenWidth: number, 
        screenHeight: number,
        speedMultiplier: number = 2
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
        this.health = 4; // Starting health
        this.maxHealth = 4; // Maximum health

        this.boxGroup = new THREE.Group();
        this.boxGroup.layers.set(1); // Set to layer 0 for bloom effects
        this.scene.add(this.boxGroup);
        
        // Initial positioning
        this.boxGroup.position.x = screenWidth / 2;
        this.boxGroup.position.y = Math.random() * screenHeight - screenHeight / 2;

        // Base velocity with random direction
        this.velocity = new THREE.Vector3(
            (Math.random() * -1.5 - 0.5) + this.speedMultiplier,
            (Math.random() - 0.5) * 0.3,
            0
        );

        // Set collision mesh position to match boxGroup
        this.position.copy(this.boxGroup.position);

        this.init();
    }

    protected init(): void {
        // Add the main star
        this.addStar(100, 0xfa4afc);

        // Pre-create smaller stars for damage visualization
        const starCount = this.maxHealth - 1;
        for (let i = 0; i < starCount; i++) {
            const size = 90 * ((starCount - i) / this.maxHealth); // Proportional sizes
            const star = this.createStar(size, 0x8A2BE2);
            star.visible = false; // Initially hidden
            this.boxGroup.add(star);
        }
    }

    protected getStarPositions(size: number): number[] {
        const points = [];
        const numPoints = 10; // 5 outer points + 5 inner points
        const outerRadius = size;
        const innerRadius = size / 2;

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            points.push(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0
            );
        }

        // Close the star shape
        points.push(points[0], points[1], points[2]);

        return points;
    }

    protected createStar(size: number, color: number): Line2 {
        const material = new LineMaterial({
            color: color, // Purple color by default
            linewidth: 6,
            opacity: 0.9,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });
        material.resolution.set(this.MAX_SCREEN_WIDTH, this.MAX_SCREEN_HEIGHT);

        const geometry = new LineGeometry();
        geometry.setPositions(this.getStarPositions(size));

        const star = new Line2(geometry, material);
        star.layers.set(1); // Set to layer 0 for bloom effects

        return star;
    }

    protected addStar(size: number = 100, color: number = 0x8A2BE2): void {
        const star = this.createStar(size, color);
        this.boxGroup.add(star);
    }

    public takeDamage(): void {
        if (this.health > 0) {
            this.health--;
            this.velocity.x -= 1.5;
            // Update the visibility of the smaller stars
            const starIndex = this.maxHealth - this.health;
            if (starIndex < this.boxGroup.children.length) {
                const star = this.boxGroup.children[starIndex];
                star.visible = true;
            }
        }
        // Create particle effect
        const intensity = 1 - (this.velocity.x * 0.05);
        this.createParticles(intensity);

        if (this.health <= 0) {
            this.destroy();
        }
    }

    public resetHealth(): void {
        this.health = this.maxHealth;

        // Hide all smaller stars
        for (let i = 1; i < this.boxGroup.children.length; i++) {
            this.boxGroup.children[i].visible = false;
        }
    }

    public update(t: number): void {
        // Update position
        this.boxGroup.position.add(this.velocity);

        // Update collision mesh position
        this.position.copy(this.boxGroup.position);
    }

    public isOffScreen(): boolean {
        return this.boxGroup.position.x < -this.MAX_SCREEN_WIDTH / 2;
    }

    public getCollisionRadius(): number {
        return 100;
    }

    public isPurpleStar(target: GameEntity): target is PurpleStarEntity {
        return target instanceof PurpleStarEntity;
    }

    public override removeFromScene(): void {
        this.scene.remove(this.boxGroup);
        this.boxGroup.children.forEach(child => {
            if (child instanceof Line2) {
                child.geometry.dispose();
                (child.material as LineMaterial).dispose();
            }
        });
        super.removeFromScene();
    }

    private destroy(): void {
        this.removeFromScene();
        console.log("PurpleStarEntity destroyed");
    }

    protected createParticles(intensity: number): void {
        const particlesCount = Math.floor(50 * intensity);
        const particles = new THREE.Group();
        particles.layers.set(1); // Set particles to layer 0 for bloom effects
        
        for (let i = 0; i < particlesCount; i++) {
            const lineGeometry = new LineGeometry();
            const size = Math.random() * 20 * intensity;
            lineGeometry.setPositions(this.getStarPositions(size));
            
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
}
