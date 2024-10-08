import * as THREE from "three";

// modules
import { Audio_Manager } from "./audio.js";
import { gameworld } from "./world.js";
import { spaceship } from "./spaceship.js";
import { setupGUI } from "./gui.js";
import { entity } from "./entity.js";
import { mapValue } from "./utils.js";
import { initRenderer, initComposer } from "./renderer.js";
import { updateVelocityBars, cursor } from "./dom.js";
import { player_input } from "./player-input.js";

// default physics
const maxVelocity = .7;
const acceleration = .2;
const deceleration = 0.15;
const verticalAcceleration = 0.0005;

class Game {
    constructor() {
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
      this.renderer = initRenderer();
      this.composer = initComposer(this.renderer, this.scene, this.camera);
      
      this.audioManager = null;
      this.world = new gameworld.World({ scene: this.scene });
      this.playerEntity = new entity.Entity();
      this.playerShip = new spaceship.Spaceship(this.scene, this.camera);
      
      this.initialize();
    }

    async initialize() {
        await this.setupAudio();
        this.world.addElements();
        this.playerMesh = this.playerShip.loadSpaceship();
    
        const playerInputComponent = new player_input.PlayerInput();
        this.playerEntity.AddComponent(playerInputComponent);
        this.playerEntity.InitEntity();
        
        setupGUI({
          camera: this.camera,
          renderer: this.renderer,
          audioManager: this.audioManager,
        });

        this.animate()
    }

    async setupAudio() {
        try {
          console.log("Starting audio context");
          const audioContext = new AudioContext();
          this.audioManager = new Audio_Manager(audioContext);
          await Promise.all([
            this.audioManager.loadSounds("./public/audio/sounds"),
            this.audioManager.loadSoundtrack("./public/audio/soundtrack.wav"),
            this.audioManager.loadSpaceshipSound("./public/audio/ship_rumble.wav")
          ]);
          this.audioManager.playSpaceshipSound();
          console.log("Started Audio Context.");
        } catch (error) {
          console.error("Failed to initialize sounds or audio context:", error);
        }
    }
    // MAIN LOOP
    animate(currentTime) {
      requestAnimationFrame((time) => this.animate(time)); // Use arrow function to maintain context
      const timeElapsed = (currentTime - this.previousTime) / 1000; // Calculate time elapsed
      this.previousTime = currentTime; // Update previousTime for the next frame
      this.update(timeElapsed); // Call the update method
  }
    update(timeElapsed) {
        if (this.playerEntity && this.playerEntity.GetComponent("PlayerInput")) {
          this.playerEntity.Update();
          const input = this.playerEntity.Attributes.InputCurrent;
    
          if (input) {
            this.updatePlayer(input, timeElapsed);
            this.updateAudioVolume(input);
            this.updateWorld();
          }
        }
        
        this.composer.render();
    }

    updateWorld() {
      if (this.world) {
          if (this.world.asteroidGroups) {
              this.world.asteroidGroups.forEach(asteroidGroup => {
                  asteroidGroup.animateAsteroidGroup(); // Assuming animateAsteroidGroup updates the position and state of asteroids
              });
          }
  
          this.world.rings.forEach(ring => {
              ring.update(); // Make sure to call update first
              if (ring.checkCollisionWithRing(this.playerShip.mesh)) {
                  console.log("Collision detected! Playing sound.");
                  this.audioManager.playNextSound(); // Play sound on collision
              }
          });
      }
    }

    updatePlayer(input, timeElapsed) {   
      if (!this.playerMesh) {
          console.log("Still Loading...");
          this.playerMesh = this.playerShip.mesh;
          if (!this.playerMesh) return;
          this.meshChild = this.playerMesh.children[0];
      } 

      let playerMesh = this.playerMesh;
      let meshChild = this.meshChild;
      let playerShip = this.playerShip

      if (playerShip.activeLasers) {
        playerShip.activeLasers.forEach(beam => {
          let { laserBeam, velocity, direction } = beam
          laserBeam.position.add(velocity.clone().multiplyScalar(0.2));
          playerShip.checkLaserCollision(laserBeam.position, direction);
          if (laserBeam.position.distanceTo(playerShip.mesh.position) > 200) {
            playerShip.scene.remove(laserBeam);
          }
        });
      }

      // Only allow rotation if there is forward velocity
      if (input.forwardVelocity > 0) {
          const continuousRotation = -(mouseX * 0.0001);
          playerMesh.rotation.y += continuousRotation;

          const targetX = meshChild.rotation.x + mouseY * 0.0001;
          const mappedTargetX = mapValue(
              targetX,
              -Math.PI,
              Math.PI,
              -Math.PI * 0.93,
              Math.PI * 0.93
          );
          meshChild.rotation.x = THREE.MathUtils.lerp(meshChild.rotation.x, mappedTargetX, 0.8);
      } else {
          console.log("No forward velocity; rotation is disabled.");
      }

      // Update upward velocity
    if (input.upwardAcceleration > 0) {
        input.upwardVelocity += input.upwardAcceleration * verticalAcceleration * timeElapsed;
        input.upwardVelocity = Math.min(input.upwardVelocity, maxVelocity);
    } else if (input.upwardAcceleration < 0) {
        input.upwardVelocity += input.upwardAcceleration * verticalAcceleration * timeElapsed;
        input.upwardVelocity = Math.max(input.upwardVelocity, -maxVelocity);
    } else {
        input.upwardVelocity = (Math.abs(input.upwardVelocity) <= 0.3 * timeElapsed) ? 0 : input.upwardVelocity - Math.sign(input.upwardVelocity) * 0.1 * timeElapsed;
    }

      // Update forward velocity
      if (input.forwardAcceleration > 0) {
        input.forwardVelocity += input.forwardAcceleration * acceleration * timeElapsed;
        input.forwardVelocity = Math.min(input.forwardVelocity, maxVelocity);
    } else if (input.forwardAcceleration < 0) {
        input.forwardVelocity += input.forwardAcceleration * deceleration * timeElapsed;
        input.forwardVelocity = Math.max(input.forwardVelocity, 0);
    }

    const moveVector = this.calculateMoveVector(input);
    playerMesh.position.add(moveVector);
    this.playerShip.thirdPersonCamera.Update(timeElapsed);
    this.playerShip.updateVelocityRectangle(input.forwardVelocity, maxVelocity);
    updateVelocityBars(input.forwardVelocity, maxVelocity);
}

  calculateMoveVector(input) {
    const moveVector = new THREE.Vector3();
    let meshChild = this.meshChild;

    const sinY = Math.sin(this.playerShip.mesh.rotation.y);
    const cosY = Math.cos(this.playerShip.mesh.rotation.y);
    const cosX = Math.cos(meshChild.rotation.x);

    moveVector.set(
        sinY * cosX * input.forwardVelocity,
        -Math.sin(meshChild.rotation.x) * input.forwardVelocity + input.upwardVelocity,
        cosY * cosX * input.forwardVelocity
    );

    return moveVector;
  }

    updateAudioVolume(input) {
      const spaceshipVolumeLevel = mapValue(input.forwardVelocity, 0, maxVelocity, 0, 1); // Map forward velocity to volume level
  
      if (this.audioManager) {
          this.audioManager.setSpaceshipVolume(spaceshipVolumeLevel); // Set the spaceship audio volume
      }
  }
  }



const game = new Game();

let mouseX = 0;
let mouseY = 0;
const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 2;

function handleMouseMove(event) {
mouseX = event.clientX - centerX;
mouseY = event.clientY - centerY;
cursor.style.left = event.pageX + "px";
cursor.style.top = event.pageY + "px";
}

function handleMouseClick() {
game.playerShip.createAndShootLight();
}

window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("mousedown", handleMouseClick);
  