import { Line2, LineGeometry, LineMaterial } from "three-stdlib";
import { GameEntity } from "./gameEntity";
import * as THREE from 'three';


export class TestObject{
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
        (this.boxGroup.children as UpdatableLine2[] ).forEach((box) => {
            box.update(t);
          });
    }

    init(){
        this.addBoxes(8);
    }

    getPositions() {
        const points = [];
        points.push(0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0); // face
        points.push(0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1); // face
        points.push(0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1); // the rest
        const arr = points.map(v => v -= 0.5);
        return arr;
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
        geometry.setPositions(this.getPositions());
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
    update: (t: number) => void;
  
    constructor(geometry: LineGeometry, material: LineMaterial, index: number) {
      super(geometry, material);
  
      this.scale.setScalar(200.0 + index * 4);
      const rotationSpeed = 0.0005;
      const offset = 2.0 - index * 0.1;
  
      this.update = (t: number) => {
        this.rotation.x = Math.sin(offset + t * rotationSpeed) * 2;
        this.rotation.y = Math.sin(offset + t * rotationSpeed) * 2;
      };
    }
  }