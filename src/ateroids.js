import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader_asteroids = new GLTFLoader().setPath("public/asteroids/");

export async function loadAsteroids(scene) {
    const asteroidGroup = new THREE.Group();
    scene.add(asteroidGroup); // Add the group to the scene
  
    try {
      // Use await to wait for the model to load
      const gltf = await loader_asteroids.loadAsync("scene.gltf");
      const loadedModel = gltf.scene;
      const numberOfAsteroids = 50;
  
      // Create a single PointLight for the entire asteroid group
      const pointLight = new THREE.PointLight(0xffa500, 2, 50); // Set intensity and distance
      scene.add(pointLight); // Add the light to the scene
  
      for (let i = 0; i < numberOfAsteroids; i++) {
        const asteroidClone = loadedModel.clone();
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
  
        // Apply random scaling to the asteroid
        const scale = Math.random() * 2 + 0.5; // Scale factor between 0.5 and 2.5
        asteroidClone.scale.set(scale, scale, scale); // Apply uniform scaling
  
        asteroidGroup.add(asteroidClone);
      }
  
      pointLight.position.set(0, 0, 0);
    } catch (error) {
      console.error("Error loading asteroids:", error);
    }
  
    // Return the asteroid group (populated after loading)
    return asteroidGroup;
}

export function animateAsteroids(asteroids) {
    asteroids.children.forEach((asteroid) => {
      asteroid.position.add(asteroid.velocity);
    });
  }