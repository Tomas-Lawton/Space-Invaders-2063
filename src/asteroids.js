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
          const gltf = await this.loader.setPath(path).loadAsync("scene.gltf");
          if (!gltf || !gltf.scene) {
            throw new Error(`Failed to load model from path: ${path}`);
          }
    
          const model = gltf.scene.clone(); // Clone the loaded model
          model.traverse((node) => {
            if (node.isMesh) {
              node.material.side = THREE.DoubleSide;
            }
          });
          // console.log("Loaded model:", model);
          return model; // Return the cloned model
        });
    
        this.loadedModels = await Promise.all(modelPromises);
      } catch (error) {
        console.error("Error loading models:", error);
      }
    }
    async loadAsteroids() {
      try {
        this.asteroidGroup = new THREE.Group();
        this.scene.add(this.asteroidGroup);

        const numberOfAsteroids = Math.floor(Math.random()+.1 * 90);

        const originX = (Math.random() - 0.5) * 1000; // Random X between -50 and 50
        const originY = (Math.random() - 0.5) * 1000; // Random Y between -50 and 50
        const originZ = (Math.random() - 0.5) * 1000; // Random Z between -50 and 50

        // const randomColor = Math.floor(Math.random() * 16777215).toString(16); //0xffa500
        const pointLight = new THREE.PointLight(0xffa500, 2, 150);
        pointLight.position.set(originX, originY, originZ);

        this.scene.add(pointLight); // Add the light to the scene


        let entropyCoefficient = (Math.random() -.5) * 3;

        for (let i = 0; i < numberOfAsteroids; i++) {
          let selectedModel = Math.floor(Math.random() * this.loadedModels.length)
          const asteroidClone = this.loadedModels[selectedModel].clone(); // weighted selection
    
          // Set position relative to the random origin
          asteroidClone.position.set(
            originX + (Math.random() - 0.5) * 50 * entropyCoefficient, 
            originY + (Math.random() - 0.5) * 50 * entropyCoefficient,
            originZ + (Math.random() - 0.5) * 50 * entropyCoefficient
          );
    
          asteroidClone.rotation.set(
            Math.random() * Math.PI  * entropyCoefficient,
            Math.random() * Math.PI  * entropyCoefficient,
            Math.random() * Math.PI  * entropyCoefficient
          );
    
          asteroidClone.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.02  * entropyCoefficient,
            (Math.random() - 0.5) * 0.02  * entropyCoefficient,
            (Math.random() - 0.5) * 0.02  * entropyCoefficient
          );
    
          asteroidClone.type = selectedModel
          asteroidClone.health = 100; // Set health
          asteroidClone.healthBar = null
          const scale = Math.random() * 4 + 1; // Scale factor between 1 and 5
          asteroidClone.scale.set(scale, scale, scale); // Apply uniform scaling
    
          this.asteroidGroup.add(asteroidClone); // Add the asteroid to the group
        }

        return this; // Return the instance of AsteroidLoader
      } catch (error) {
        console.error("Error loading asteroids:", error);
      }
    }


    // destroyAsteroid(asteroid) {
    //   this.asteroidGroup.remove(asteroid); // Remove from the group
    //   console.log('Asteroid destroyed:', asteroid);
    // }

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
