import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { getRandomDeepColor } from "./utils.js"

export const planets = (() => {
class PlanetLoader {
    constructor(scene) {
        this.scene = scene;
        this.planets = [];
        this.planetLoader = new GLTFLoader();
        this.path = 'public/planet/';
    }

    // Method to load planets asynchronously
    async initialisePlanets(count) {
        const gltf = await this.planetLoader.setPath(this.path).loadAsync("scene.gltf");
        if (!gltf || !gltf.scene) {
            throw new Error(`Failed to load model from path: ${this.path}`);
        }

        for (let i = 0; i < count; i++) {
            const planetGroup = this.createPlanetGroup(gltf);
            this.scene.add(planetGroup); 
            this.planets.push(planetGroup);
        }
    }

    // Creates a group of planet objects, including model and fog sphere
    createPlanetGroup(gltf) {
        const planetGroup = new THREE.Group();
        const scale = 100;
        const model = this.createPlanetModel(gltf, scale);
        
        const randomColor = getRandomDeepColor(); 
        const fogSphere = this.createFog(model.position, randomColor, scale);
        
        planetGroup.add(model);
        planetGroup.add(fogSphere);
        
        planetGroup.position.set(
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000
        );

        this.scene.add(planetGroup); 
        this.planets.push(planetGroup);

        return planetGroup;
    }


    // Creates the planet model and scales it appropriately
    createPlanetModel(gltf, scale) {
        const model = gltf.scene.clone();
        model.scale.set(scale, scale, scale);
        return model;
    }

    // Creates a fog sphere around the planet model
    createFog(position, color, scale) {
        const fogGeometry = new THREE.SphereGeometry(scale * 1.3, 32, 32);
        const fogMaterial = new THREE.MeshPhysicalMaterial({
            color: color,
            opacity: 0.8,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            metalness: 0.5, 
            roughness: 0.01
        });

        const fogSphere = new THREE.Mesh(fogGeometry, fogMaterial);
        fogSphere.position.copy(position);
        return fogSphere;
    }

    // Optional: Creates lights around the planet (currently not used)
    createLights(position, color, scale) {
        const lightPositions = [
            { x: 30, y: 30, z: 30 },
            { x: -30, y: -30, z: 30 },
            { x: 50, y: 0, z: 0 }
        ];
        
        return lightPositions.map(pos => {
            const light = new THREE.PointLight(color, 10, 1000); 
            light.position.set(
                pos.x * scale / 2 + position.x, 
                pos.y * scale / 2 + position.y, 
                pos.z * scale / 2 + position.z  
            );
            return light;
        });
    }


  animatePlanets(playerPos, reposition) {
    if (this.planets) {
      this.planets.forEach(planet => {
        planet.children[0].rotation.y += 0.001; 
        
        const distance = playerPos.mesh.position.distanceTo(planet.position);
        if (distance > 1000) {
            reposition(planet.position, playerPos.mesh.position); 
        }
      });
    }
  }
}

return {
    PlanetLoader: PlanetLoader,
  };
})();
