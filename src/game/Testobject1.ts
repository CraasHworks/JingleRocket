import { Line2, LineGeometry, LineMaterial } from "three-stdlib";
import { GameEntity } from "./gameEntity";
import * as THREE from 'three';


export class TestObject1{
    private readonly MAX_SCREEN_WIDTH: number;
    private readonly MAX_SCREEN_HEIGHT: number;
    private boxGroup: THREE.Group;
    // protected mesh: UpdatableLine2;
    // protected scene: THREE.Scene;

    constructor(
        scene: THREE.Scene, 
        screenWidth: number, 
        screenHeight: number,
        scale: number = 1,
        speedMultiplier: number = 1
    ) {
        const geometry = new THREE.SphereGeometry(20, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
        //super(geometry, material, scene);

        // Initial positioning
        // this.mesh.position.x = 0;
        // this.mesh.position.y = 0;

        this.MAX_SCREEN_WIDTH = screenWidth;
        this.MAX_SCREEN_HEIGHT = screenHeight;

        this.boxGroup = new THREE.Group();
        this.init();
        scene.add(this.boxGroup);

        // this.mesh.scale.set(scale, scale, scale);
    }

    update(t: number) {
        (this.boxGroup.children as UpdatableLine2[]).forEach((box, i) => {
            box.update(t, i);
        });
    }

    init(){
        this.addBoxes(2);
    }

    getPositions() {
        const points = [];
        points.push(0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0); // face
        const arr = points.map(v => v -= 0.5);
        return arr;
    }

    getTrianglePositions(size: number): number[] {
        const halfSize = size / 2;
        const height = Math.sqrt(size * size - halfSize * halfSize); // Height of the equilateral triangle
    
        // Define the triangle points relative to the centroid at the origin
        return [
            0, height / 3, 0,            // Top point (above centroid)
            -halfSize, -2 * height / 3, 0, // Bottom-left point
            halfSize, -2 * height / 3, 0,  // Bottom-right point
            0, height / 3, 0             // Close the triangle
        ];
    }

    createBox(index: number) {
        const hue = 0.8 - index / 19;
        const material = new LineMaterial({
          color: new THREE.Color().setHSL(hue, 1.0, 0.5).getHex(),
          linewidth: 9,
          opacity: 0.25,
        });
        // Set blending mode manually
        material.transparent = true; // Ensure transparency for additive blending
        material.blending = THREE.AdditiveBlending;
        material.resolution.set(this.MAX_SCREEN_WIDTH, this.MAX_SCREEN_HEIGHT);
      
        const geometry = new LineGeometry();
        geometry.setPositions(this.getTrianglePositions(350 / (index + 1 )));
        const mesh = new UpdatableLine2(geometry, material, index);
        return mesh;
    }

    addBoxes(numBoxes: number) {
        for (let i = 0; i < numBoxes; i += 1) {
          let box = this.createBox(i);
          this.boxGroup.add(box);
        }
    }
};

class UpdatableLine2 extends Line2 {
    update: (t: number, i: number) => void;
    private rotationSpeed: number;
  
    constructor(geometry: LineGeometry, material: LineMaterial, index: number) {
        super(geometry, material);
        
        // Scale the inner triangle to be smaller
      //  this.scale.setScalar(index === 0 ? 1.0 : 0.5);
        
        // Set different rotation speeds for outer and inner triangles
        this.rotationSpeed = index === 0 ? 0.02 : -0.03;
        
        // Center both triangles at the origin
        //this.position.set(0, 0, 0);
      
        this.update = (t: number, i: number) => {
            if(i === 1){
          //      this.position.set(0,-40,0);
                // Rotate each triangle in opposite directions
                this.rotation.z += this.rotationSpeed;
            }
        };
    }
}