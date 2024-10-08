/// create spaceships for user and enemies
import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { third_person_camera } from './camera.js';
import { mapValue } from './utils.js'; // Assuming you have a utility function for mapping values
import { progressContainer, progressText } from "./dom.js"
import { PHYSICS_CONSTANTS } from "./constants.js"
import { cursor } from "./dom.js";


export const spaceship = (() => {
  class Spaceship {
    constructor(scene, camera) {
      this.scene = scene;
      this.camera = camera;
      this.spaceshipParams = {
        positionX: 0,
        positionY: 0.7,
        positionZ: 0,
        scale: 0.08,
      };

      this.loader = new GLTFLoader().setPath('public/spaceship_-_cb1/');
      this.mesh = null; // 3d
      this.thirdPersonCamera = null; // follow cam

      this.velocityRectangle = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshStandardMaterial({
        emissive: 0xc87dff,
        emissiveIntensity: 3,
        color: 0x9400ff,
        side: THREE.DoubleSide,
      }));

      this.lightSound = new Audio('public/audio/pew.mp3');
      this.boomSound = new Audio('public/audio/boom.mp3');

      this.forwardVelocity = 0
      this.upwardVelocity = 0

      this.activeLasers = [];

      return this
    }

    loadSpaceship() {
      this.loader.load(
        'scene.gltf',
        (gltf) => {
          // PLAYER (it's a mesh in a mesh)
          this.mesh = new THREE.Group();
          const tempObjectGroup = new THREE.Group();
          const loadedModel = gltf.scene;
          // console.log(loadedModel)
          //REMOVE THESE LINES TO FIX MOUSE ROTATE CAMERA

          // Set shadow properties and initial rotation
          loadedModel.traverse(
            (child) => child.isMesh && (child.castShadow = child.receiveShadow = true)
          );
          loadedModel.rotation.y = 1.5 * Math.PI;
          loadedModel.position.z += 22;
          tempObjectGroup.add(loadedModel);

          // Add lights
          const ambientLightColor = 0x660099;
          const ambientLight = new THREE.PointLight(ambientLightColor, 1, 50);
          ambientLight.position.set(0, 5, 0);
          tempObjectGroup.add(ambientLight);

          const spotLight = new THREE.SpotLight(0xff6600, 3, 5, Math.PI * 1.1, 0.2);
          spotLight.position.copy(tempObjectGroup.position);
          tempObjectGroup.add(spotLight);

          // Add boosters (velocity rectangle)
          this.velocityRectangle.position.copy(tempObjectGroup.position);
          tempObjectGroup.add(this.velocityRectangle);

          this.mesh.add(tempObjectGroup);
          this.scene.add(this.mesh);

          // Initialize third-person camera
          this.thirdPersonCamera = new third_person_camera.ThirdPersonCamera({
            camera: this.camera,
            target: this.mesh,
          });

          this.updateSpaceshipPosition();

          // Hide loading screen
          progressContainer.style.display = 'none';
          return this.mesh
        },
        (xhr) => {
          let progressAmount = Math.max((xhr.loaded / xhr.total) * 100, 1)
          progressText.innerHTML = `LOADING ${progressAmount}/100`;
        },
        (error) => {
          console.error("An error happened", error);
        }
      );
    }

    updateSpaceshipPosition() {
      if (this.mesh) {
        this.mesh.position.set(
          this.spaceshipParams.positionX,
          this.spaceshipParams.positionY,
          this.spaceshipParams.positionZ
        );
        this.mesh.scale.set(
          this.spaceshipParams.scale,
          this.spaceshipParams.scale,
          this.spaceshipParams.scale
        );
        // console.log(this.spaceshipParams)
      }
    }

    createAndShootLight() {
      const direction = new THREE.Vector3();
      this.mesh.children[0].getWorldDirection(direction);
      const laserPosition = this.mesh.position.clone();
      const laserBeam = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({
        emissive: 0xc87dff,
        emissiveIntensity: 3,
        color: 0x9400ff,
      }));

      laserBeam.position.copy(laserPosition);
      laserBeam.lookAt(laserPosition.add(direction));
      this.scene.add(laserBeam);

      const velocity = direction.multiplyScalar(22);
      if (this.lightSound) {
        this.lightSound.currentTime = 0;
        this.lightSound.volume = 0.25;
        this.lightSound.play();
      }

      this.activeLasers.push({ laserBeam, velocity, direction });
      console.log("shot laser")
    }



    updateVelocityRectangle(currentVelocity, maxVelocity) {
      const rectangleLength = mapValue(currentVelocity, 0, maxVelocity, 0, -150);
      this.velocityRectangle.geometry.dispose(); // Dispose of the old geometry
      this.velocityRectangle.geometry = new THREE.BoxGeometry(3, 3, rectangleLength); // Adjust width and height as needed
      this.velocityRectangle.position.z = rectangleLength / 2;
    }

    checkLaserCollision(laserBeam, asteroid) {
      console.log(asteroid)
      const collisionDistance = 10; 
      if (laserBeam.position.distanceTo(asteroid.position) < collisionDistance) {    
        if (asteroid.parent) {
          asteroid.parent.remove(asteroid);
        }
        if (this.boomSound) {
          this.boomSound.currentTime = 0; // Reset to the start
          this.boomSound.volume = 0.5; // Set volume
          this.boomSound.play(); // Play sound
        }
        return true; // Collision detected
      }
      return false; // No collision detected
    }

    handleLaserMovement(asteroidSystem) {
      if (this.activeLasers) {
        this.activeLasers.forEach((beam, index) => {
          const { laserBeam, velocity } = beam;
          laserBeam.position.add(velocity.clone().multiplyScalar(0.2));
          if (asteroidSystem) {
            console.log(asteroidSystem)
            for (const system of asteroidSystem) {
              system.asteroidGroup.children.forEach(asteroid => {
                if (this.checkLaserCollision(laserBeam, asteroid)) {
                  console.log('HIT');
                  this.scene.remove(laserBeam);
                  this.activeLasers.splice(index, 1);
                  return; // Exit the loops after removing the laser
                }
              }) 
            }
          }
          if (laserBeam.position.distanceTo(this.mesh.position) > 30) {
            this.scene.remove(laserBeam);
            this.activeLasers.splice(index, 1); // Remove from activeLasers array
          }
        });
      }
    }
    

    Update(forwardAcceleration, upwardAcceleration, timeElapsed, audioManager, asteroidGroups) {
      this.calculateRotation();
      this.calculateVelocity(forwardAcceleration, upwardAcceleration, timeElapsed);
      this.moveSpaceship();
      this.handleLaserMovement(asteroidGroups);
      this.updateVelocityRectangle(this.forwardVelocity, PHYSICS_CONSTANTS.maxVelocity);
      this.thirdPersonCamera.Update(timeElapsed);
      audioManager.updateSpaceshipVolume(this.forwardVelocity)
    }

    calculateRotation() {
      if (this.forwardVelocity > 0) {
        const continuousRotation = -(mouseX * 0.0001);
        this.mesh.rotation.y += continuousRotation;
        const targetX = this.mesh.children[0].rotation.x + mouseY * 0.0001; // Assuming meshChild is the first child
        const mappedTargetX = mapValue(targetX, -Math.PI, Math.PI, -Math.PI * 0.93, Math.PI * 0.93);
        this.mesh.children[0].rotation.x = THREE.MathUtils.lerp(this.mesh.children[0].rotation.x, mappedTargetX, 0.8);
      }
    }

    calculateVelocity(forwardAcceleration, upwardAcceleration, timeElapsed) {
      this.updateUpwardVelocity(upwardAcceleration, timeElapsed); // update this.upwardVelocity
      this.updateForwardVelocity(forwardAcceleration, timeElapsed); // update this.forwardVelocty
    }
  
    updateUpwardVelocity(upwardAcceleration, timeElapsed) {
        if (upwardAcceleration > 0) {
            this.upwardVelocity += this.upwardVelocity * PHYSICS_CONSTANTS.verticalAcceleration * timeElapsed;
            this.upwardVelocity = Math.min(this.upwardVelocity, PHYSICS_CONSTANTS.maxVelocity);
        } else if (upwardAcceleration < 0) {
            this.upwardVelocity += this.upwardVelocity * PHYSICS_CONSTANTS.verticalAcceleration * timeElapsed;
            this.upwardVelocity = Math.max(this.upwardVelocity, -PHYSICS_CONSTANTS.maxVelocity);
        } 
        
        // else {
        //     this.upwardVelocity = (Math.abs(this.upwardVelocity) <= 0.3 * timeElapsed)
        //         ? 0
        //         : this.upwardVelocity - Math.sign(this.upwardVelocity) * 0.1 * timeElapsed;
        // }
    }
    
    updateForwardVelocity(forwardAcceleration, timeElapsed) {
        if (forwardAcceleration > 0) {
            this.forwardVelocity = Math.min(this.forwardVelocity + PHYSICS_CONSTANTS.acceleration * timeElapsed, PHYSICS_CONSTANTS.maxVelocity);
        }
        if (forwardAcceleration < 0) {
            this.forwardVelocity -= PHYSICS_CONSTANTS.deceleration * timeElapsed;
            this.forwardVelocity = Math.max(this.forwardVelocity, 0);
        }
    }

    moveSpaceship() {
      let moveVector = new THREE.Vector3();
      let sinY = Math.sin(this.mesh.rotation.y); // Calculate sine of Y rotation for movement along the Y axis
      let cosY = Math.cos(this.mesh.rotation.y); // Calculate cosine of Y rotation for movement along the Z axis
      let cosX = Math.cos(this.mesh.children[0].rotation.x); // Calculate cosine of X rotation for vertical movement
    
      moveVector.set(
        sinY * cosX * this.forwardVelocity, // Horizontal movement based on forward velocity and Y rotation
        -Math.sin(this.mesh.children[0].rotation.x) * this.forwardVelocity + this.upwardVelocity, // Vertical movement based on upward velocity and pitch
        cosY * cosX * this.forwardVelocity // Horizontal movement along the Z axis based on forward velocity and Y rotation
      );
    
      this.mesh.position.add(moveVector); // Update the spaceship's position based on the calculated move vector
    }



  }

  return {
    Spaceship: Spaceship,
  };
})();



const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 2;
let mouseX=0
let mouseY=0
function handleMouseMove(event) {
  mouseX = event.clientX - centerX;
  mouseY = event.clientY - centerY;
  cursor.style.left = event.pageX + "px";
  cursor.style.top = event.pageY + "px";
}


window.addEventListener("mousemove", handleMouseMove);
