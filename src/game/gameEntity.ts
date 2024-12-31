import * as THREE from 'three';

// Base class for game entities
export abstract class GameEntity {
    protected mesh: THREE.Mesh;
    protected scene: THREE.Scene;

    constructor(
        protected geometry: THREE.BufferGeometry, 
        protected material: THREE.Material, 
        scene: THREE.Scene
    ) {
        this.scene = scene;
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.layers.set(1);
        this.addToScene(); // Automatically add to scene on creation
    }

    get position() {
        return this.mesh.position;
    }

    abstract update(t: number): void;
    
    addToScene() {
        this.scene.add(this.mesh);
    }

    removeFromScene() {
        this.scene.remove(this.mesh);
    }
}