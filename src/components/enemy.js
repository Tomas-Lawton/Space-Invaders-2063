import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const enemy = (() => {
  class EnemyLoader {
    constructor(scene, camera, health = 80) {
      this.scene = scene;
      this.camera = camera;
      this.health = health;
      this.mesh = null;
      this.forwardVelocity = 0;
      this.upwardVelocity = 0;
      this.enemies = [];
      this.loader = new GLTFLoader().setPath("public/ships/ship_5/");
      this.activeLasers = [];
      this.shootCooldown = 200;
      this.lightSound = new Audio("public/audio/enemy_pew.mp3");
      this.firingDistance = 100;
    }

    // Initialise enemies without promises, using callback in the loader
    initaliseEnemies(numEnemies, aroundPoint) {
      for (let i = 0; i < numEnemies; i++) {
        this.createEnemy(aroundPoint, (enemyObject) => {
          enemyObject.lastShotTime = 0;
          this.scene.add(enemyObject);
          this.enemies.push(enemyObject);
        });
      }
    }

    createEnemy(aroundPoint, callback) {
      this.loader.load(
        "scene.gltf",
        (gltf) => {
          const enemyObject = new THREE.Group();
    
          const angle = Math.random() * Math.PI * 2;
          const distance = 600;    
          const x = aroundPoint.x + Math.cos(angle) * distance;
          const z = aroundPoint.z + Math.sin(angle) * distance;
          const y = aroundPoint.y;
          console.log(x, y, z)
          enemyObject.position.set(x, y, z);
    
          // Add variation within the group itself for smaller offsets
          enemyObject.position.add(new THREE.Vector3(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50
          ));
    
          const loadedModel = gltf.scene;
          loadedModel.traverse(
            (child) =>
              child.isMesh && (child.castShadow = child.receiveShadow = true)
          );
          loadedModel.rotation.y = 1.5 * Math.PI;
          loadedModel.scale.set(0.1, 0.1, 0.1);
          enemyObject.add(loadedModel);
    
          const glowGeometry = new THREE.SphereGeometry(0.3, 8, 8);
          const glowMaterial = new THREE.MeshStandardMaterial({
            emissive: 0xff4500,
            emissiveIntensity: 10,
            color: 0xff4500,
          });
    
          const glowPoint = new THREE.Mesh(glowGeometry, glowMaterial);
          glowPoint.position.set(0, 0, -5);
          enemyObject.add(glowPoint);
    
          const redLight = new THREE.PointLight(0xff0000, 15, 200);
          redLight.position.set(0, 1, -1);
          enemyObject.add(redLight);
    
          enemyObject.rotation.y = Math.PI;
          enemyObject.health = this.health;
    
          if (callback) {
            callback(enemyObject);
          }
        },
        undefined,
        (error) => {
          console.error("Error loading enemy model:", error);
        }
      );
    }

    animateEnemies(playerCurrentPosition) {
      this.enemies.forEach((enemy) => {
        this.animateForwardMovement(enemy);
        this.phaseTowardsPlayer(enemy, playerCurrentPosition);
        this.checkFiringPosition(enemy, playerCurrentPosition);
        this.updateLasers(playerCurrentPosition);
      });
    }

    phaseTowardsPlayer(enemy, playerCurrentPosition) {
      // Add the phasing for toward the planet, how to maintain minimum distance?

      if (enemy) {
        const phaseSpeed = 0.004; // Adjust for smoothness

        // Calculate the direction to the player
        const directionToPlayer = new THREE.Vector3();
        directionToPlayer
          .subVectors(playerCurrentPosition, enemy.position)
          .normalize();

        // Create a quaternion for the rotation towards the player
        const targetQuaternion = new THREE.Quaternion();
        targetQuaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1), // Default forward direction of the enemy
          directionToPlayer // Target direction to the player
        );

        // Spherically interpolate (slerp) towards the target orientation
        enemy.quaternion.slerp(targetQuaternion, phaseSpeed);
      }
    }

    animateForwardMovement(enemy) {
      if (enemy) {
        let speed = 0.6;
        let direction = new THREE.Vector3();
        enemy.getWorldDirection(direction); // Get the direction the ship is facing
        direction.multiplyScalar(speed);
        enemy.position.add(direction);
      }
    }

    checkFiringPosition(enemy, playerCurrentPosition) {
      const currentTime = performance.now(); //laser cooldown

      const distanceThreshold = this.firingDistance; // Distance threshold for firing
      const angleThreshold = Math.PI / 6; // 5 degrees in radians
      const distanceToPlayer = enemy.position.distanceTo(playerCurrentPosition);

      if (distanceToPlayer < distanceThreshold) {
        const enemyDirection = new THREE.Vector3();
        enemy.getWorldDirection(enemyDirection); // Get the direction the enemy is facing

        const directionToPlayer = new THREE.Vector3();
        directionToPlayer
          .subVectors(playerCurrentPosition, enemy.position)
          .normalize(); // Calculate direction to the player

        const angleToPlayer = enemyDirection.angleTo(directionToPlayer); // Angle between enemy's direction and direction to player

        if (
          angleToPlayer < angleThreshold &&
          currentTime - enemy.lastShotTime > this.shootCooldown
        ) {
          this.fireLaser(enemy);
          enemy.lastShotTime = currentTime; // Update last shot time
        }

        // To do add this to shoot the laser at the planet
        // if (angleToPlayer < angleThreshold && (currentTime - enemy.lastShotTime) > this.shootCooldown) {
        //   this.fireLaser(enemy);
        //   enemy.lastShotTime = currentTime;  // Update last shot time
        // }
      }
    }

    fireLaser(enemy) {
      const direction = new THREE.Vector3();
      enemy.getWorldDirection(direction);

      const laserBeam = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 20, 20),
        new THREE.MeshStandardMaterial({
          emissive: 0xff0000,
          emissiveIntensity: 18,
          color: 0xff0000,
        })
      );

      laserBeam.position.copy(enemy.position);
      laserBeam.lookAt(laserBeam.position.clone().add(direction));
      this.scene.add(laserBeam);

      console.log(direction);
      const velocity = direction.multiplyScalar(1); // higher is slower
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

        const distanceToPlayer = laserBeam.position.distanceTo(
          playerCurrentPosition
        );
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
