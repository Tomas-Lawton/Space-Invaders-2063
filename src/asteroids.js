import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const asteroids = (() => {
  class AsteroidLoader {
    constructor(scene, paths) {
      this.scene = scene;
      this.paths = paths;
      this.loader = new GLTFLoader();
      this.loadedModels = []; // Initialize as an empty array
    }

    async initialiseSystem() {
      try {
        const modelPromises = this.paths.map(async (path) => {
          console.log("Loading path:", path);
    
          // Set the path and load the GLTF model
          const gltf = await this.loader.setPath(path).loadAsync("scene.gltf");
    
          // Ensure the loaded model exists and is a valid GLTF structure
          if (!gltf || !gltf.scene) {
            throw new Error(`Failed to load model from path: ${path}`);
          }
    
          const model = gltf.scene.clone(); // Clone the loaded model
          model.traverse((node) => {
            if (node.isMesh) {
              node.material.side = THREE.DoubleSide;
            }
          });
          console.log("Loaded model:", model);
          return model; // Return the cloned model
        });
    
        // Wait for all promises to resolve, then assign the models to loadedModels
        this.loadedModels = await Promise.all(modelPromises);
    
        console.log("All models loaded:", this.loadedModels);
      } catch (error) {
        console.error("Error loading models:", error);
      }
    }
    async loadAsteroids() {
      try {
        this.asteroidGroup = new THREE.Group();
        this.scene.add(this.asteroidGroup);

        const numberOfAsteroids = 100;

        const pointLight = new THREE.PointLight(0xffa500, 2, 50);
        this.scene.add(pointLight); // Add the light to the scene

        for (let i = 0; i < numberOfAsteroids; i++) {
          const asteroidClone = this.loadedModels[Math.floor(Math.random() * Math.random() * this.loadedModels.length)].clone(); // weighed selection
          asteroidClone.position.set(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
          );
          asteroidClone.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          );
          asteroidClone.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
          );

          const scale = Math.random() * 2 + .5; // Scale factor between 0.5 and 2.5
          asteroidClone.scale.set(scale, scale, scale); // Apply uniform scaling

          this.asteroidGroup.add(asteroidClone);
        }

        return this; // Return the instance of AsteroidLoader
      } catch (error) {
        console.error("Error loading asteroids:", error);
      }
    }

    animateAsteroidGroup() {
      this.asteroidGroup.children.forEach((asteroid) => {
        asteroid.position.add(asteroid.velocity);
      });
    }
  }

  return {
    AsteroidLoader: AsteroidLoader,
  };
})();
