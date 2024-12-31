import * as THREE from 'three';
import { GameEntity } from './gameEntity';

export class Bell extends GameEntity {
    private velocity: THREE.Vector3;
    private readonly MAX_SCREEN_WIDTH: number;
    private rotationSpeed: number;
    private outlineMesh: THREE.LineSegments;
    private glowMeshes: THREE.LineSegments[] = [];
    private bellGroup: THREE.Group;

    constructor(
        scene: THREE.Scene, 
        screenWidth: number, 
        screenHeight: number
    ) {
        // Create basic geometry for the body (for hit detection)
        const bodyGeometry = new THREE.CircleGeometry(16, 32);  // Double the size here
        const bodyMaterial = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.3
        });

        // Initialize with the body geometry for collision detection
        super(bodyGeometry, bodyMaterial, scene);

        // Create a group to hold all bell parts
        this.bellGroup = new THREE.Group();
        this.bellGroup.layers.set(1);
        this.mesh.add(this.bellGroup);
        this.mesh.layers.set(1);

        // Create bell outline shape
        const points = [
            // Bell dome (top part)
            new THREE.Vector2(0, 0),       // Top center
            new THREE.Vector2(6, 12),      // Right curve
            new THREE.Vector2(10, 18),     // Right side
            new THREE.Vector2(12, 24),     // Bell's curved edge
            new THREE.Vector2(12, 26),     // Bottom curve starts
            new THREE.Vector2(10, 28),     // Right side of the bottom curve
            new THREE.Vector2(6, 28),      // Left side of the bottom curve
            new THREE.Vector2(2, 26),      // Left curve
            new THREE.Vector2(0, 24),      // Left edge of the bell's body
            new THREE.Vector2(-2, 26),     // Left bottom curve
            new THREE.Vector2(-6, 28),     // Bottom left side of the bell
            new THREE.Vector2(-10, 28),    // Left edge at the bottom
            new THREE.Vector2(-12, 26),    // Bell's curved edge (left)
            new THREE.Vector2(-12, 24),    // Left side of the bell
            new THREE.Vector2(-10, 18),    // Left curve
            new THREE.Vector2(-6, 12),     // Left curve
            new THREE.Vector2(0, 0),       // Back to top center (close path)
            
            // Bell base (horizontal line)
            new THREE.Vector2(18, 20),     // Right end of the base
            new THREE.Vector2(-18, 20),    // Left end of the base
        ];

        // Create geometry for the outline
        const outlineGeometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < points.length - 1; i++) {
            vertices.push(points[i].x, points[i].y, 0);
            vertices.push(points[i + 1].x, points[i + 1].y, 0);
        }
        outlineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        // Create outline material with glow effect
        const outlineMaterial = new THREE.LineBasicMaterial({
            color: 0xffd700,
            linewidth: 7
        });

        // Create and add outline mesh
        this.outlineMesh = new THREE.LineSegments(outlineGeometry, outlineMaterial);
        this.outlineMesh.layers.set(1);
        this.bellGroup.add(this.outlineMesh);

        // Create multiple glow layers
        const glowLayers = [
            { scale: 1.1, opacity: 0.9, linewidth: 4, color: 0xffd700 },
            { scale: 1.2, opacity: 0.7, linewidth: 5, color: 0xffd700 },
        ];

        glowLayers.forEach(layer => {
            const glowGeometry = outlineGeometry.clone();
            const glowMaterial = new THREE.LineBasicMaterial({
                color: layer.color,
                transparent: true,
                opacity: layer.opacity,
                linewidth: layer.linewidth
            });
            const glowMesh = new THREE.LineSegments(glowGeometry, glowMaterial);
            glowMesh.layers.set(1);
            glowMesh.scale.set(layer.scale, layer.scale, layer.scale);
            this.glowMeshes.push(glowMesh);
            this.bellGroup.add(glowMesh);
        });

        // Add intense center glow
        const centerGlowGeometry = outlineGeometry.clone();
        const centerGlowMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,  // White core
            transparent: true,
            opacity: 0.8,
            linewidth: 4
        });
        const centerGlow = new THREE.LineSegments(centerGlowGeometry, centerGlowMaterial);
        centerGlow.scale.set(1.04, 1.04, 1.04); // Slightly adjusted for visual effect
        this.bellGroup.add(centerGlow);

        // Scale everything up
        this.bellGroup.scale.set(2, 2, 2);  // Double the overall scale

        this.MAX_SCREEN_WIDTH = screenWidth;

        // Initial positioning
        this.mesh.position.x = screenWidth / 2;
        this.mesh.position.y = Math.random() * screenHeight - screenHeight / 2;

        // Random rotation speed
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;

        // Velocity for movement
        this.velocity = new THREE.Vector3(-6, 0, 0);
    }

    update() {
        // Move left with smooth lerp
        this.mesh.position.x = THREE.MathUtils.lerp(
            this.mesh.position.x,
            this.mesh.position.x + this.velocity.x,
            0.7
        );

        // Add gentle swaying motion
        this.bellGroup.rotation.z += this.rotationSpeed;

        // Update glow opacity for pulsing effect
        const time = Date.now() * 0.02;
        this.glowMeshes.forEach((mesh, index) => {
            if (mesh.material instanceof THREE.LineBasicMaterial) {
                const baseOpacity = 0.9 - (index * 0.1);
                const pulseIntensity = 0.3;
                const phaseOffset = index * 0.5; // Offset each layer's pulse
                const glowPulse = (Math.sin(time + phaseOffset) + 1) * 0.5;
                mesh.material.opacity = baseOpacity + (glowPulse * pulseIntensity);
            }
        });
    }

    isOffScreen(): boolean {
        return this.mesh.position.x < -this.MAX_SCREEN_WIDTH / 2;
    }

    removeFromScene() {
        super.removeFromScene();
    }
}
