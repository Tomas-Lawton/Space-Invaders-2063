import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const asteroids = (() => {
  class AsteroidLoader {
    constructor(scene, paths) {
      this.scene = scene;
      this.paths = paths;
      this.loader = new GLTFLoader();
      this.loadedModels = [];
      this.asteroidSystem = [];
    }

    async initialiseSystem(systems) {
      try {
        // Load Asteroid Models
        const modelPromises = this.paths.map(async (path) => {
          const gltf = await this.loader.setPath(path).loadAsync("scene.gltf");
          const model = gltf.scene.clone(); 
          model.traverse((node) => {
            if (node.isMesh) {
              node.material.side = THREE.DoubleSide;
            }
          });
          return model; 
        });
        this.loadedModels = await Promise.all(modelPromises);

        // Now load the systems
        for (let i = 0; i < systems; i++) {
          const group = await this.loadAsteroids(); 
          this.asteroidSystem.push(group); 
        }
      } catch (error) {
        console.error("Error loading models:", error);
      }
    }

    async loadAsteroids() {
      try {
        let asteroidGroup = new THREE.Group();
        asteroidGroup.position.set(
          (Math.random() - 0.5) * 1000, 
          (Math.random() - 0.5) * 1000,
          (Math.random() - 0.5) * 1000
          );
        this.scene.add(asteroidGroup);
        const numberOfAsteroids = Math.floor(Math.random() * 90);
        let entropyCoefficient = (Math.random() -.5) * 3;
        // const entropyCoefficient = .5
        for (let i = 0; i < numberOfAsteroids; i++) {
          let selectedModel = Math.floor(Math.random() * this.loadedModels.length)
          const asteroidClone = this.loadedModels[selectedModel].clone(); // weighted selection
    
          asteroidClone.position.set(
            (Math.random() - 0.5) * 50 * entropyCoefficient,
            (Math.random() - 0.5) * 50 * entropyCoefficient,
            (Math.random() - 0.5) * 50 * entropyCoefficient
         );

          asteroidClone.rotation.set(
            Math.random() * Math.PI  * entropyCoefficient,
            Math.random() * Math.PI  * entropyCoefficient,
            Math.random() * Math.PI  * entropyCoefficient
          );
    
          asteroidClone.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.05  * entropyCoefficient,
            (Math.random() - 0.5) * 0.05  * entropyCoefficient,
            (Math.random() - 0.5) * 0.05  * entropyCoefficient
          );
    
          asteroidClone.type = selectedModel
          asteroidClone.health = 100; // Set health
          asteroidClone.healthBar = null
          const scale = Math.random() * 4 + 1; // Scale factor between 1 and 5
          asteroidClone.scale.set(scale, scale, scale); 
          asteroidGroup.add(asteroidClone); 
        }


        // LIGHT THE GROUP
        const pointLight = new THREE.PointLight(0xCC5500, 800, 400);
        pointLight.position.set(0, 0, 0);
        asteroidGroup.add(pointLight); 

        return asteroidGroup;
      } catch (error) {
        console.error("Error loading asteroids:", error);
      }
    }

    // destroyAsteroid(asteroid) {
    //   this.asteroidGroup.remove(asteroid); // Remove from the group
    //   console.log('Asteroid destroyed:', asteroid);
    // }

    animateAsteroids(playerPos, reposition) {
      if (this.asteroidSystem) {
        this.asteroidSystem.forEach(system => {

          //animate individual asteroid
          system.children.forEach((asteroid) => {
            if (asteroid instanceof THREE.Light) {
              return
            }
            asteroid.position.add(asteroid.velocity);
          }); 

          // check group distance
          const distance = playerPos.mesh.position.distanceTo(system.position);
          if (distance > 1000) {
            reposition(system.position, playerPos.mesh.position); 
          }
        })
      }
    
    }
  }

  return {
    AsteroidLoader: AsteroidLoader,
  };
})();
