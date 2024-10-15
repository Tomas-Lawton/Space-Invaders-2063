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
        this.activeLasers = []

        this.lightSound = new Audio('public/audio/pew.mp3');
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
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                // (Math.random() - 0.5) * 1000
                300
            );
  
            const loadedModel = gltf.scene;
            loadedModel.traverse(
              (child) => child.isMesh && (child.castShadow = child.receiveShadow = true)
            );
            loadedModel.rotation.y = 1.5 * Math.PI;
            loadedModel.position.z += 22;
            loadedModel.scale.set(.05, .05, .05);
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
          this.checkFiringPosition(enemy, playerCurrentPosition);
        this.updateLasers(playerCurrentPosition)
          
        });
      }
  
      phaseTowardsPlayer(enemy, playerCurrentPosition) {
        if (enemy) {
            let phaseSpeed = 0.05;  // Speed at which the ship adjusts its direction towards the player
            
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
            let speed = .4; 
            let direction = new THREE.Vector3();  
            enemy.getWorldDirection(direction);  // Get the direction the ship is facing            
            direction.multiplyScalar(speed);
            enemy.position.add(direction);
        }
      }

      checkFiringPosition(enemy, playerCurrentPosition) {
        const distanceThreshold = 1000;  // Distance threshold for firing
        const angleThreshold = Math.PI / 8;  // 5 degrees in radians      
        const distanceToPlayer = enemy.position.distanceTo(playerCurrentPosition);
      
        if (distanceToPlayer < distanceThreshold) {
          const enemyDirection = new THREE.Vector3();
          enemy.getWorldDirection(enemyDirection);  // Get the direction the enemy is facing
      
          const directionToPlayer = new THREE.Vector3();
          directionToPlayer.subVectors(playerCurrentPosition, enemy.position).normalize();  // Calculate direction to the player
      
          const angleToPlayer = enemyDirection.angleTo(directionToPlayer);  // Angle between enemy's direction and direction to player
      
        //   If the enemy is facing the player within the angle threshold
          if (angleToPlayer < angleThreshold) {
            this.createAndShootLight(enemy);  // Fire the laser
          }
        }
      }
    
      createAndShootLight(enemy) {
        const direction = new THREE.Vector3();
        enemy.getWorldDirection(direction);  // Get the direction the ship is facing
    
        const laserBeam = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshStandardMaterial({
            emissive: 0xff0000,        // Red emissive color
            emissiveIntensity: 3,      // Intensity of the red glow
            color: 0xff0000,      
          })
        );
    
        laserBeam.position.copy(enemy.position);  // Start the laser at the enemy's position
        laserBeam.lookAt(laserBeam.position.clone().add(direction));  // Make the laser face the direction the enemy is facing
        this.scene.add(laserBeam);
    
        const velocity = direction.multiplyScalar(300);  // The velocity of the laser
        this.activeLasers.push({ laserBeam, velocity, direction });
    
        if (this.lightSound) {
          this.lightSound.currentTime = 0;
          this.lightSound.volume = 0.25;
          this.lightSound.play();
        }
      }
    
      updateLasers(playerCurrentPosition) {
        this.activeLasers.forEach((laserData, index) => {
          const { laserBeam, velocity } = laserData;
      
          laserBeam.position.add(velocity);
      
          const distanceToPlayer = laserBeam.position.distanceTo(playerCurrentPosition);
          if (distanceToPlayer > 200) {
            this.scene.remove(laserBeam);  
            this.activeLasers.splice(index, 1); 
          }
        });
      }
    }
    return {
      EnemyLoader: EnemyLoader,
    };
  })();
  