import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

interface BloomUniforms {
    baseTexture: { value: THREE.Texture | null };
    bloomTexture: { value: THREE.Texture | null };
    bloomStrength: { value: number };
    bloomRadius: { value: number };
}

export class TransparentBloomPass extends Pass {
    private bloomPass: UnrealBloomPass;
    private compositeMaterial: THREE.ShaderMaterial;
    private renderTargets: THREE.WebGLRenderTarget[];
    private fsQuad: FullScreenQuad;
    
    constructor(
        size: THREE.Vector2, 
        strength: number = 1, 
        radius: number = 0.4, 
        threshold: number = 0.85
    ) {
        super();
        
        this.bloomPass = new UnrealBloomPass(size, strength, radius, threshold);
        
        // Create render targets with floating point precision for HDR
        const renderTargetOptions: THREE.WebGLRenderTargetOptions = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false,
            depthBuffer: false,
            type: THREE.HalfFloatType,
            encoding: THREE.LinearEncoding
        };

        this.renderTargets = [
            new THREE.WebGLRenderTarget(size.x, size.y, renderTargetOptions),
            new THREE.WebGLRenderTarget(size.x, size.y, renderTargetOptions)
        ];
        
        // Enhanced composite shader with better alpha handling
        const uniforms: BloomUniforms = {
            baseTexture: { value: null },
            bloomTexture: { value: null },
            bloomStrength: { value: strength },
            bloomRadius: { value: radius }
        };

        this.compositeMaterial = new THREE.ShaderMaterial({
            defines: {
                'BLOOM_INTENSITY': '1.0'
            },
            uniforms,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D baseTexture;
                uniform sampler2D bloomTexture;
                uniform float bloomStrength;
                uniform float bloomRadius;
                varying vec2 vUv;
                
                float luminance(vec3 color) {
                    return dot(color, vec3(0.299, 0.587, 0.114));
                }

                void main() {
                    vec4 baseColor = texture2D(baseTexture, vUv);
                    vec4 bloomColor = texture2D(bloomTexture, vUv);
                    
                    // Only apply bloom to non-transparent areas
                    float alpha = baseColor.a;
                    if (alpha < 0.01) {
                        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                        return;
                    }
                    
                    // Apply bloom only to bright areas
                    float brightness = luminance(bloomColor.rgb);
                    float bloomFactor = smoothstep(0.0, 1.0, brightness) * bloomStrength;
                    
                    // Blend bloom with base color while preserving alpha
                    vec3 finalColor = mix(
                        baseColor.rgb,
                        baseColor.rgb + (bloomColor.rgb * bloomFactor),
                        alpha
                    );
                    
                    // HDR tone mapping
                    finalColor = finalColor / (finalColor + vec3(1.0));
                    
                    // Output with preserved alpha
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.SrcAlphaFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
            depthTest: false,
            depthWrite: false
        });

        this.fsQuad = new FullScreenQuad(this.compositeMaterial);
    }

    dispose(): void {
        // Clean up resources
        this.renderTargets.forEach(target => target.dispose());
        this.compositeMaterial.dispose();
        this.bloomPass.dispose();
        this.fsQuad.dispose();
    }

    setSize(width: number, height: number): void {
        this.bloomPass.setSize(width, height);
        this.renderTargets.forEach(target => target.setSize(width, height));
    }

    render(
        renderer: THREE.WebGLRenderer,
        writeBuffer: THREE.WebGLRenderTarget | null,
        readBuffer: THREE.WebGLRenderTarget
    ): void {
        // Store current renderer state
        const oldClearColor = renderer.getClearColor(new THREE.Color());
        const oldClearAlpha = renderer.getClearAlpha();
        const oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;

        try {
            // Render bloom effect to first render target
            renderer.setRenderTarget(this.renderTargets[0]);
            renderer.clear();
            this.bloomPass.render(renderer, this.renderTargets[0], readBuffer);

            // Final composite with transparency
            const finalBuffer = writeBuffer || this.renderTargets[1];
            renderer.setRenderTarget(finalBuffer);
            renderer.clear();

            this.compositeMaterial.uniforms.baseTexture.value = readBuffer.texture;
            this.compositeMaterial.uniforms.bloomTexture.value = this.renderTargets[0].texture;

            this.fsQuad.render(renderer);
        } finally {
            // Restore renderer state
            renderer.setRenderTarget(null);
            renderer.setClearColor(oldClearColor, oldClearAlpha);
            renderer.autoClear = oldAutoClear;
        }
    }

    // Getters and setters for bloom parameters
    get strength(): number {
        return this.compositeMaterial.uniforms.bloomStrength.value;
    }

    set strength(value: number) {
        this.compositeMaterial.uniforms.bloomStrength.value = value;
        this.bloomPass.strength = value;
    }

    get radius(): number {
        return this.compositeMaterial.uniforms.bloomRadius.value;
    }

    set radius(value: number) {
        this.compositeMaterial.uniforms.bloomRadius.value = value;
        this.bloomPass.radius = value;
    }

    get threshold(): number {
        return this.bloomPass.threshold;
    }

    set threshold(value: number) {
        this.bloomPass.threshold = value;
    }
}