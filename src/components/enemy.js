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
        this.shootCooldown = 200
        this.lightSound = new Audio('public/audio/enemy_pew.mp3');
        this.firingDistance = 100
    }
  
      // Initialise enemies without promises, using callback in the loader
      initaliseEnemies(numEnemies) {
          for (let i = 0; i < numEnemies; i++) {
              this.createEnemy((enemyGroup) => {
                  enemyGroup.lastShotTime = 0;
                  this.scene.add(enemyGroup); 
                  this.enemies.push(enemyGroup);
                //   console.log("Enemy added:", enemyGroup);
              });
          }
      }
  
      createEnemy(callback) {
        this.loader.load(
          'scene.gltf',
          (gltf) => {
            const enemyGroup = new THREE.Group();
            enemyGroup.position.set(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 100
                // 100
            );
            
            const loadedModel = gltf.scene;
            loadedModel.traverse(
              (child) => child.isMesh && (child.castShadow = child.receiveShadow = true)
            );
            loadedModel.rotation.y = 1.5 * Math.PI;
            loadedModel.scale.set(.05, .05, .05);
            enemyGroup.add(loadedModel);
            
            // Add lights
            const ambientLightColor = 0x660099;
            const ambientLight = new THREE.PointLight(ambientLightColor, 3, 50);  // Increased intensity to 3
            ambientLight.position.set(0, 5, 0);
            enemyGroup.add(ambientLight);
            
            const spotLight = new THREE.SpotLight(0xff6600, 6, 10, Math.PI * 1.1, 0.2);  // Increased intensity to 6, range to 10
            spotLight.position.copy(enemyGroup.position);
            enemyGroup.add(spotLight);
            
            enemyGroup.rotation.y =  Math.PI;
            
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
            const phaseSpeed = 0.007;  // Adjust for smoothness
            
            // Calculate the direction to the player
            const directionToPlayer = new THREE.Vector3();
            directionToPlayer.subVectors(playerCurrentPosition, enemy.position).normalize();
    
            // Create a quaternion for the rotation towards the player
            const targetQuaternion = new THREE.Quaternion();
            targetQuaternion.setFromUnitVectors(
                new THREE.Vector3(0, 0, 1), // Default forward direction of the enemy
                directionToPlayer           // Target direction to the player
            );
    
            // Spherically interpolate (slerp) towards the target orientation
            enemy.quaternion.slerp(targetQuaternion, phaseSpeed);
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
        const currentTime = performance.now();  //laser cooldown

        const distanceThreshold = this.firingDistance;  // Distance threshold for firing
        const angleThreshold = Math.PI / 8;  // 5 degrees in radians      
        const distanceToPlayer = enemy.position.distanceTo(playerCurrentPosition);
      
        if (distanceToPlayer < distanceThreshold) {
          const enemyDirection = new THREE.Vector3();
          enemy.getWorldDirection(enemyDirection);  // Get the direction the enemy is facing
      
          const directionToPlayer = new THREE.Vector3();
          directionToPlayer.subVectors(playerCurrentPosition, enemy.position).normalize();  // Calculate direction to the player
      
          const angleToPlayer = enemyDirection.angleTo(directionToPlayer);  // Angle between enemy's direction and direction to player
      
        if (angleToPlayer < angleThreshold && (currentTime - enemy.lastShotTime) > this.shootCooldown) {
            this.createAndShootLight(enemy);
            enemy.lastShotTime = currentTime;  // Update last shot time
          }
        }
      }
    
      createAndShootLight(enemy) {
        const direction = new THREE.Vector3();
        enemy.getWorldDirection(direction);
      
        const laserBeam = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshStandardMaterial({
            emissive: 0xff0000,
            emissiveIntensity: 10,
            color: 0xff0000,
          })
        );
      
        laserBeam.position.copy(enemy.position);
        laserBeam.lookAt(laserBeam.position.clone().add(direction));
        this.scene.add(laserBeam);
      
        console.log(direction)
        const velocity = direction.multiplyScalar(1);  // higher is slower
        this.activeLasers.push({ laserBeam, velocity, direction });
      
        if (this.lightSound) {
          this.lightSound.currentTime = 0;
          this.lightSound.volume = 0.15;
          this.lightSound.play();
        }
      }

      updateLasers(playerCurrentPosition) {
        this.activeLasers.forEach((laserData, index) => {
          const { laserBeam, velocity } = laserData;
      
          laserBeam.position.add(velocity);
      
          const distanceToPlayer = laserBeam.position.distanceTo(playerCurrentPosition);
          if (distanceToPlayer > this.firingDistance) {
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
  