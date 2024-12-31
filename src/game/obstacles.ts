import { GameEntity } from "./gameEntity";
import * as THREE from 'three';

export class Asteroid extends GameEntity {
    private velocity: THREE.Vector3;
    private readonly MAX_SCREEN_WIDTH: number;
    private readonly MAX_SCREEN_HEIGHT: number;
    private speedMultiplier: number;

    constructor(
        scene: THREE.Scene, 
        screenWidth: number, 
        screenHeight: number,
        scale: number = 1,
        speedMultiplier: number = 1
    ) {
        const geometry = new THREE.SphereGeometry(20, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
        super(geometry, material, scene);

        this.MAX_SCREEN_WIDTH = screenWidth;
        this.MAX_SCREEN_HEIGHT = screenHeight;
        this.speedMultiplier = speedMultiplier;

        // Initial positioning
        this.mesh.position.x = screenWidth / 2;
        this.mesh.position.y = Math.random() * screenHeight - screenHeight / 2;

        // Scale
        this.mesh.scale.set(scale, scale, scale);

        // Base velocity with random direction, affected by speed multiplier
        this.velocity = new THREE.Vector3(
            (Math.random() * -0.5 - 0.5) * this.speedMultiplier, // Faster horizontal movement
            (Math.random() - 0.5) * 0.3, // Keep vertical movement moderate
            0
        );
    }

    update() {
        // Move with velocity
        this.mesh.position.x += this.velocity.x;
        this.mesh.position.y += this.velocity.y;
    }

    isOffScreen(): boolean {
        return this.mesh.position.x < -this.MAX_SCREEN_WIDTH / 2;
    }

    getCollisionRadius(): number {
        return 16 * this.mesh.scale.x;
    }

    getScale(): number {
        return this.mesh.scale.x;
    }

    split(): Asteroid[] {
        const scale = this.mesh.scale.x;
        if (scale <= 0.5) return [];

        const newAsteroids: Asteroid[] = [];
        for (let i = 0; i < 2; i++) {
            const newScale = scale / 2;
            const angleOffset = i === 0 ? Math.PI / 12 : -Math.PI / 12;

            const newAsteroid = new Asteroid(
                this.scene, 
                this.MAX_SCREEN_WIDTH, 
                this.MAX_SCREEN_HEIGHT * 2,
                newScale,
                this.speedMultiplier // Pass the same speed multiplier to children
            );

            // Position the new asteroid at the original asteroid's position
            newAsteroid.mesh.position.copy(this.mesh.position);

            // Adjust velocity based on angle
            newAsteroid.velocity.x = this.velocity.x * Math.cos(angleOffset) - 
                                     this.velocity.y * Math.sin(angleOffset);
            newAsteroid.velocity.y = this.velocity.x * Math.sin(angleOffset) + 
                                     this.velocity.y * Math.cos(angleOffset);

            newAsteroids.push(newAsteroid);
        }

        return newAsteroids;
    }
}