import { Line2, LineGeometry, LineMaterial } from "three-stdlib";
import { GameEntity } from "./gameEntity";
import * as THREE from 'three';

export class GreenNatEntity extends GameEntity {
    protected readonly MAX_SCREEN_WIDTH: number;
    protected readonly MAX_SCREEN_HEIGHT: number;
    public boxGroup: THREE.Group;
    protected velocity: THREE.Vector3;
    protected speedMultiplier: number;

    constructor(
        scene: THREE.Scene, 
        screenWidth: number, 
        screenHeight: number,
        speedMultiplier: number = 6
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
        this.addNat(30, 0x6ffa3e);
    }

    protected getStarPositions(size: number): number[] {
        const halfSize = size / 2;
        const quarterSize = size / 4; 
    
        return [
            0, halfSize, 0,        // Top point
            quarterSize, quarterSize, 0,         // Right point
            size - quarterSize, quarterSize, 0,       // Bottom point
            size, halfSize, 0,        // Left point
            size - quarterSize, size - quarterSize, 0,         // Close the diamond
            quarterSize, size - quarterSize, 0,         // Close the diamond
            0, halfSize, 0,         // Close the diamond
        ];
    }

    protected createNat(size: number, color: number): Line2 {
        const material = new LineMaterial({
            color: color, // Purple color by default
            linewidth: 4,
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

    protected addNat(size: number = 30, color: number = 0x6ffa3e): void {
        const star = this.createNat(size, color);
        this.boxGroup.add(star);
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
        return 30;
    }

    public override removeFromScene(): void {
        this.createFlash(this.position);
        this.scene.remove(this.boxGroup);
        this.boxGroup.children.forEach(child => {
            if (child instanceof Line2) {
                child.geometry.dispose();
                (child.material as LineMaterial).dispose();
            }
        });
        super.removeFromScene();
    }

    protected createFlash(position: THREE.Vector3): void {
        // Create a sphere to represent the flash
        const flashGeometry = new THREE.SphereGeometry(45, 16, 16); 
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1,
        });
    
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.layers.set(1);
        flash.position.copy(position);
        this.scene.add(flash);
    
        // Animate the flash to fade and shrink
        const duration = 500; // Duration in milliseconds
        const startTime = performance.now();
    
        const animateFlash = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / duration;
    
            if (progress < 1) {
                // Fade and shrink the flash
                flashMaterial.opacity = 1 - progress;
                flash.scale.setScalar(1 - progress); // Shrink uniformly
                requestAnimationFrame(animateFlash);
            } else {
                // Remove the flash from the scene
                this.scene.remove(flash);
                flash.geometry.dispose();
                flash.material.dispose();
            }
        };
    
        animateFlash();
    }

}