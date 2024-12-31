import { GameEntity } from "./gameEntity";
import * as THREE from "three";

export class Spaceship extends GameEntity {
    private readonly MAX_SCREEN_HEIGHT: number;
    private readonly MAX_SCREEN_WIDTH: number;
    private speed: number = 5;
    private active: boolean = true;
    private invulnerable: boolean = false; // Track if the spaceship is invulnerable
    private invulnerabilityDuration: number = 3000; // Duration of invulnerability in milliseconds
    private invulnerableEndTime: number = 0; // Track when invulnerability ends

    public health: number = 100; // Health starts at 100
    private maxHealth: number = 100; // Maximum health
    private shieldMesh: THREE.Mesh;

    constructor(scene: THREE.Scene, screenWidth: number, screenHeight: number) {
        const geometry = new THREE.SphereGeometry(20, 20, 20);
        const material = new THREE.MeshBasicMaterial({ color: 0xd2731a });
        super(geometry, material, scene);

        this.MAX_SCREEN_WIDTH = screenWidth;
        this.MAX_SCREEN_HEIGHT = screenHeight;

        // Initial positioning
        this.mesh.position.x = -screenWidth * 0.5 + 120;
        this.mesh.position.y = 0;

        this.mesh.layers.set(1);

        // Create shield as a semi-transparent sphere surrounding the spaceship
        const shieldGeometry = new THREE.SphereGeometry(25, 32, 32);
        const shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x4287f5, // Blue color for the shield
            transparent: true,
            opacity: 0.8, // Fully opaque by default
        });
        this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
        this.shieldMesh.position.copy(this.mesh.position);
        this.shieldMesh.layers.set(2);
        scene.add(this.shieldMesh);
    }

    moveUp() {
        this.mesh.position.y = THREE.MathUtils.lerp(
            this.mesh.position.y,
            this.mesh.position.y + this.speed,
            0.8
        );
    }

    moveDown() {
        this.mesh.position.y = THREE.MathUtils.lerp(
            this.mesh.position.y,
            this.mesh.position.y - this.speed,
            0.8
        );
    }

    update() {
        // Prevent the spaceship from going off-screen
        const maxY = this.MAX_SCREEN_HEIGHT / 2 - 30;
        const minY = -this.MAX_SCREEN_HEIGHT / 2 + 30;
        this.mesh.position.y = Math.max(Math.min(this.mesh.position.y, maxY), minY);

        // Update shield position to match spaceship position
        this.shieldMesh.position.copy(this.mesh.position);

        // If the invulnerability time has passed, reset the invulnerable state
        if (this.invulnerable && performance.now() > this.invulnerableEndTime) {
            console.log("invulnability turned off");
            this.invulnerable = false;
        }

        if (this.invulnerable) {
            const shieldMaterial = this.shieldMesh.material as THREE.MeshBasicMaterial;
            shieldMaterial.transparent = true;
            shieldMaterial.opacity = 0.5 + Math.abs(Math.sin(performance.now() * 5)) * 0.5; // Flashing effect
        } else {
            const shieldMaterial = this.shieldMesh.material as THREE.MeshBasicMaterial;
            shieldMaterial.transparent = true;
            shieldMaterial.opacity = this.health / this.maxHealth; // Normal opacity
        }
    }

    shootLaser(laserManager: LaserManager, direction: THREE.Vector3) {
        if (this.active) {
            laserManager.createLaser(this.mesh.position, direction);
        }
    }

    removeFromScene() {
        super.removeFromScene();
        this.active = false;
        this.scene.remove(this.shieldMesh);
    }

    takeDamage = (delta: number) => {
        // If the spaceship is invulnerable, return early and don't apply damage
        if (this.invulnerable) {
            return;
        }

        // Update health with delta and ensure it stays within the 0 to maxHealth range
        this.setHealth(this.health += delta);

        // Check if health is zero or less, and trigger game over
        if (this.health >= 0) {
            // Activate invulnerability after taking damage
            this.invulnerable = true;
            console.log("HARD TURN ON");
            this.invulnerableEndTime = performance.now() + this.invulnerabilityDuration;
        }
    };

    isActive(): boolean {
        return this.active;
    }

    // Public method to set health and update shield opacity
    setHealth(newHealth: number) {
        this.health = newHealth; 
        const healthPercentage = this.health / this.maxHealth;

        // Explicitly cast shield material to MeshBasicMaterial to access `opacity`
        const shieldMaterial = this.shieldMesh.material as THREE.MeshBasicMaterial;
        shieldMaterial.transparent = true;
        console.log(healthPercentage)
        shieldMaterial.opacity = healthPercentage;

        // Remove shield if health is 0
        if (healthPercentage <= 0.24) {
            this.scene.remove(this.shieldMesh);
        }
    }
}

interface LaserData {
    group: THREE.Group;
    direction: THREE.Vector3;
}

export class LaserManager {
    private lasers: LaserData[] = [];
    private scene: THREE.Scene;
    private lastLaserTime: number = 0;
    private readonly LASER_COOLDOWN: number = 250;
    private readonly LASER_SPEED: number = 20;
    private readonly SCREEN_WIDTH: number;
    public boostFactor: number = 1; // Default to 1 (no boost)
    private readonly SPREAD_ANGLE: number = Math.PI / 36; // 5 degree spread for lasers
    private laserboostDuration: number = 10000; // Duration of invulnerability in milliseconds
    private lasterboostEndtime: number = 0; // Track when invulnerability ends

    constructor(scene: THREE.Scene, screenWidth: number) {
        this.scene = scene;
        this.SCREEN_WIDTH = screenWidth;
    }

    // Create laser(s) with optional spread
    createLaser(startPosition: THREE.Vector3, direction: THREE.Vector3) {
        const currentTime = performance.now();

        if (currentTime - this.lastLaserTime >= this.LASER_COOLDOWN) {
            this.lastLaserTime = currentTime;

            // Create a new group for each laser fired
            for (let i = 0; i < this.boostFactor; i++) {
                const laserGroup = new THREE.Group();
                laserGroup.position.copy(startPosition);

                // Create the main laser beam
                const laserGeometry = new THREE.BoxGeometry(16, 6, 4);
                const laserMaterial = new THREE.MeshStandardMaterial({
                    color: 0xff0000,
                    emissive: 0xff0000,
                    emissiveIntensity: 2,
                    metalness: 0.5,
                    roughness: 0.2
                });

                const laserMesh = new THREE.Mesh(laserGeometry, laserMaterial);
                laserMesh.layers.set(1);
                laserGroup.add(laserMesh);

                // Add point light for glow effect
                const light = new THREE.PointLight(0xff0000, 2, 10);
                laserGroup.add(light);

                // Add multiple glow layers
                const glowColors = [
                    { color: 0xff0000, opacity: 0.4, scale: 1.2 },
                    { color: 0xff3333, opacity: 0.2, scale: 1.4 },
                    { color: 0xff6666, opacity: 0.1, scale: 1.6 }
                ];

                glowColors.forEach(({ color, opacity, scale }) => {
                    const glowMaterial = new THREE.MeshBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: opacity
                    });
                    const glowMesh = new THREE.Mesh(laserGeometry.clone(), glowMaterial);
                    glowMesh.scale.set(scale, scale, scale);
                    laserGroup.add(glowMesh);
                });

                // Spread the lasers based on the boost factor
                const spreadAngle = this.SPREAD_ANGLE * (i - Math.floor(this.boostFactor / 2)); // Calculate spread for each laser

                // Rotate the laser group to match the direction with spread
                const angle = Math.atan2(direction.y, direction.x) + spreadAngle;

                const laserDirection = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0).normalize().multiplyScalar(this.LASER_SPEED);

                // Store laser data
                this.lasers.push({
                    group: laserGroup,
                    direction: laserDirection
                });

                // Add the laser group to the scene
                this.scene.add(laserGroup);
            }
        }
    }

    update() {
        if (this.boostFactor >= 2 && performance.now() > this.lasterboostEndtime) {
            this.boostFactor = 1;
        }

        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];

            // Move laser in its direction
            laser.group.position.add(laser.direction);

            // Remove laser if it goes off screen
            if (
                laser.group.position.x > this.SCREEN_WIDTH / 2 ||
                laser.group.position.x < -this.SCREEN_WIDTH / 2 ||
                laser.group.position.y > this.SCREEN_WIDTH / 2 ||
                laser.group.position.y < -this.SCREEN_WIDTH / 2
            ) {
                this.scene.remove(laser.group);
                this.lasers.splice(i, 1);
            }
        }
    }

    boostLasers() {
        this.boostFactor += 1;
        if(this.boostFactor >= 2){
            this.lasterboostEndtime = performance.now() + this.laserboostDuration;
        }
    }

    getLasers() {
        return this.lasers.map(laser => ({
            position: laser.group.position,
            group: laser.group
        }));
    }

    removeLaser(laserGroup: THREE.Group) {
        const index = this.lasers.findIndex(l => l.group === laserGroup);
        if (index !== -1) {
            this.scene.remove(this.lasers[index].group);
            this.lasers.splice(index, 1);
        }
    }
}

