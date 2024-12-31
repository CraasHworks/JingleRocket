import { Line2, LineGeometry, LineMaterial } from "three-stdlib";
import { GameEntity } from "./gameEntity";
import * as THREE from 'three';

export class PowerUpEntity extends GameEntity {
    protected readonly MAX_SCREEN_WIDTH: number;
    protected readonly MAX_SCREEN_HEIGHT: number;
    public boxGroup: THREE.Group;
    protected velocity: THREE.Vector3;
    protected speedMultiplier: number;

    constructor(
        scene: THREE.Scene, 
        screenWidth: number, 
        screenHeight: number,
        speedMultiplier: number = 10
    ) {
        // Create an invisible mesh for collision detection
        const geometry = new THREE.SphereGeometry(1, 1, 1);
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
        this.createPup(40, 0xff2f2f);
    }

    protected createPup(size: number, color: number): void {
        const circle = this.createCircle(size, 0x2fdfff); // Black background
        const pSymbol = this.createPSymbol(size * 0.6, color); // "P" in green
        
        // Add both elements to the boxGroup
        this.boxGroup.add(circle);
        this.boxGroup.add(pSymbol);
    }

    protected createCircle(radius: number, color: number): THREE.Mesh {
        const geometry = new THREE.CircleGeometry(radius, 32);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4,
        });
        const circle = new THREE.Mesh(geometry, material);
        circle.layers.set(1); // Set to the bloom layer
        return circle;
    }

    protected createPSymbol(size: number, color: number): THREE.Mesh {
        const pShape = new THREE.Shape();
    
        // Start at the top-left of the "P"
        pShape.moveTo(-size / 2, size / 2);
    
        // Vertical line of "P"
        pShape.lineTo(-size / 2, -size / 2);
    
        // Close vertical stroke
        pShape.lineTo(size * 0.1, -size / 2);
        pShape.lineTo(size * 0.1, size / 6);
    
        // Circular part of "P"
        pShape.absarc(0, size / 4, size / 4, Math.PI * 1.5, Math.PI * 0.5, false);
    
        const geometry = new THREE.ShapeGeometry(pShape);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
        });
    
        const pSymbol = new THREE.Mesh(geometry, material);
        pSymbol.layers.set(2); // Set to the bloom layer
        return pSymbol;
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
        return 60;
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