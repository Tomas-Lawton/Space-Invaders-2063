import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const enemy = (() => {
    class EnemyLoader {
      constructor(scene, camera, health = 100) {
        this.scene = scene;
        this.camera = camera;
        this.health = health;
        this.mesh = null;
        this.forwardVelocity = 0;
        this.upwardVelocity = 0;
        this.enemies = [];
        this.loader = new GLTFLoader().setPath('public/ships/ship_0/');
      }
  
      // Initialise enemies without promises, using callback in the loader
      initaliseEnemies(numEnemies) {
          for (let i = 0; i < numEnemies; i++) {
              this.createEnemy((enemyGroup) => {
                  this.scene.add(enemyGroup); 
                  this.enemies.push(enemyGroup);
                  console.log("Enemy added:", enemyGroup);
              });
          }
      }
  
      createEnemy(callback) {
        this.loader.load(
          'scene.gltf',
          (gltf) => {
            const enemyGroup = new THREE.Group();
            enemyGroup.position.set(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000
            );
  
            const loadedModel = gltf.scene;
            loadedModel.traverse(
              (child) => child.isMesh && (child.castShadow = child.receiveShadow = true)
            );
            loadedModel.rotation.y = 1.5 * Math.PI;
            loadedModel.position.z += 22;
            loadedModel.scale.set(.1, .1, .1);
            enemyGroup.add(loadedModel);
  
            // Add lights
            const ambientLightColor = 0x660099;
            const ambientLight = new THREE.PointLight(ambientLightColor, 1, 50);
            ambientLight.position.set(0, 5, 0);
            enemyGroup.add(ambientLight);
  
            const spotLight = new THREE.SpotLight(0xff6600, 3, 5, Math.PI * 1.1, 0.2);
            spotLight.position.copy(enemyGroup.position);
            enemyGroup.add(spotLight);
  
            // Use the callback after the enemy is fully loaded
            if (callback) {
              callback(enemyGroup);
            }
          },
          undefined, 
          (error) => {
            console.error("Error loading enemy model:", error);
          }
        );
      }
  
      animateEnemies(playerCurrentPosition) {
        this.enemies.forEach(enemy => {
          this.animateForwardMovement(enemy);
          this.phaseTowardsPlayer(enemy, playerCurrentPosition);
        });
      }
  
      phaseTowardsPlayer(enemy, playerCurrentPosition) {
        if (enemy) {
            let phaseSpeed = 0.02;  // Speed at which the ship adjusts its direction towards the player
            
            // Calculate the direction towards the player
            let directionToPlayer = new THREE.Vector3();
            directionToPlayer.subVectors(playerCurrentPosition, enemy.position);
            
            // Normalize the direction vector and adjust it towards the player
            directionToPlayer.normalize();
            
            // The ship's current direction
            let currentDirection = new THREE.Vector3();
            enemy.getWorldDirection(currentDirection);
            
            // Gradually adjust the current direction to face the player, but retain some of the original direction
            let newDirection = currentDirection.lerp(directionToPlayer, phaseSpeed);
            
            // Set the ship's direction to the new interpolated direction
            enemy.lookAt(enemy.position.clone().add(newDirection));
        }
      }
  
      animateForwardMovement(enemy) {
        if (enemy) {
            let speed = 0.6; 
            let direction = new THREE.Vector3();  
            enemy.getWorldDirection(direction);  // Get the direction the ship is facing            
            direction.multiplyScalar(speed);
            enemy.position.add(direction);
        }
      }
  
      createAndShootLight() {
        // Implement the shooting functionality here
      }
    }
  
    return {
      EnemyLoader: EnemyLoader,
    };
  })();
  