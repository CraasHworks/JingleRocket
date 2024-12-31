import * as THREE from 'three';

export class BackgroundManager {
    private mainBackground: THREE.Mesh;
    private overlayBackground: THREE.Mesh;
    private readonly mainSpeed: number = 0.0005;
    private readonly overlaySpeed: number = 0.001;
    private textureLoader: THREE.TextureLoader;

    constructor(scene: THREE.Scene, width: number, height: number) {
        this.textureLoader = new THREE.TextureLoader();

        // Load textures
        const mainTexture = this.textureLoader.load('/src/game/spaceBackground.jpg');
        const overlayTexture = this.textureLoader.load('/src/game/bgOverlay.png');

        // Make textures repeat
        mainTexture.wrapS = mainTexture.wrapT = THREE.RepeatWrapping;
        overlayTexture.wrapS = overlayTexture.wrapT = THREE.RepeatWrapping;
        
        // Set initial texture repeat
        mainTexture.repeat.set(2, 1);
        overlayTexture.repeat.set(2, 1);

        // Create materials
        const mainMaterial = new THREE.MeshBasicMaterial({
            map: mainTexture,
            transparent: false,
        });

        const overlayMaterial = new THREE.MeshBasicMaterial({
            map: overlayTexture,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
        });

        // Create planes
        const planeGeometry = new THREE.PlaneGeometry(width*4, height);
        const planeGeometry2 = new THREE.PlaneGeometry(width*2, height);
        
        // Create meshes
        this.mainBackground = new THREE.Mesh(planeGeometry, mainMaterial);
        this.overlayBackground = new THREE.Mesh(planeGeometry2, overlayMaterial);

        // Position backgrounds at the back of the scene
        this.mainBackground.position.z = -100;
        this.overlayBackground.position.z = -99;

        // Set to layer 1 to avoid post-processing effects
        this.mainBackground.layers.set(0);
        this.overlayBackground.layers.set(0);

        // Add to scene
        scene.add(this.mainBackground);
        scene.add(this.overlayBackground);
    }

    update(): void {
        // Scroll main background
        const mainTexture = (this.mainBackground.material as THREE.MeshBasicMaterial).map;
        if (mainTexture) {
            mainTexture.offset.x += this.mainSpeed; 
        }

        // Scroll overlay background faster
        const overlayTexture = (this.overlayBackground.material as THREE.MeshBasicMaterial).map;
        if (overlayTexture) {
            overlayTexture.offset.x += this.overlaySpeed;
        }
    }

    dispose(): void {
        // Clean up resources
        const mainMaterial = this.mainBackground.material as THREE.MeshBasicMaterial;
        const overlayMaterial = this.overlayBackground.material as THREE.MeshBasicMaterial;

        mainMaterial.map?.dispose();
        overlayMaterial.map?.dispose();
        mainMaterial.dispose();
        overlayMaterial.dispose();
        this.mainBackground.geometry.dispose();
        this.overlayBackground.geometry.dispose();
    }
}