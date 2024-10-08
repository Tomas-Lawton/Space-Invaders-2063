import * as THREE from "three";

// modules
import { Audio_Manager } from "./audio.js";
import { gameworld } from "./world.js";
import { spaceship } from "./spaceship.js";
import { setupGUI } from "./gui.js"

import { entity } from "./entity.js";
import { mapValue } from "./utils.js";
import { initRenderer, initComposer } from "./renderer.js"
import { updateVelocityBars, cursor } from "./dom.js"
import { player_input } from "./player-input.js";

// 1 Setup Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
const renderer = initRenderer()
const composer = initComposer(renderer, scene, camera)
let audioManager
let world
let playerShip
let playerEntity

// Setup Audio (refactor more clean!)
async function startAudioContext() {
  try {
    console.log("Starting audio context")
    const audioContext = new AudioContext();
    audioManager = new Audio_Manager(audioContext);
    await audioManager.loadSounds("./public/audio/sounds");
    await audioManager.loadSoundtrack("./public/audio/soundtrack.wav");
    await audioManager.loadSpaceshipSound("./public/audio/ship_rumble.wav");
    audioManager.playSpaceshipSound();
    console.log("Started Audio Context.")
  } catch (error) {
    console.error("Failed to initialize sounds or audio context:", error);
  }
}
startAudioContext()

// 2 Create World 
world = new gameworld.World({ scene: scene });
world.addElements();

// 3 Create User
playerShip = new spaceship.Spaceship(scene, camera) // position the camera behind user
playerShip.loadSpaceship()

// 4 Create User Input
const playerInputComponent = new player_input.PlayerInput();
playerEntity = new entity.Entity();
playerEntity.AddComponent(playerInputComponent);
playerEntity.InitEntity();

// 5 Create GUI
setupGUI({
  camera,
  renderer,
  audioManager,
});

const currentSpeed = 0.1;
const maxVelocity = .5;
const acceleration = .0025;
const deceleration = 0.01;
const verticalAcceleration = 0.0005;
let continuousRotation = 0;
let playerMesh, meshChild;
let moveVector = new THREE.Vector3();

function animate(currentTime, previousTime=0) {
  requestAnimationFrame(animate);
  let timeElapsed = (currentTime - previousTime) / 1000;
  previousTime = currentTime;

  if (!playerMesh || playerShip) { // caching to currentSpeed up loop
    playerMesh = playerShip.mesh;
    if (!playerMesh) return
    meshChild = playerMesh.children[0];
  }
  
  // The player user
  if (playerEntity && playerEntity.GetComponent("PlayerInput")) {
    playerEntity.Update();
    let input = playerEntity.Attributes.InputCurrent;
    if (input) {
      playerMesh.rotation.y =
        ((((playerMesh.rotation.y + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) %
          (2 * Math.PI)) -
        Math.PI;

      continuousRotation = -(mouseX * 0.0001); // follow mouse
      let rotateTarget = playerMesh.rotation.y + continuousRotation;

      // pitch
      const targetX = meshChild.rotation.x + mouseY * 0.0001;
      const mappedTargetX = mapValue(
        targetX,
        -Math.PI,
        Math.PI,
        -Math.PI * 0.93,
        Math.PI * 0.93
      );

      // yaw
      const targetYaw = playerMesh.rotation.z + mouseX * 0.001;
      const mappedTargetYaw = mapValue(
        targetYaw,
        -Math.PI,
        Math.PI,
        -Math.PI / 2,
        Math.PI / 2
      );

      if (input.forwardVelocity > 0) {
        playerMesh.rotation.y = THREE.MathUtils.lerp(
          playerMesh.rotation.y,
          rotateTarget,
          0.5
        );
        meshChild.rotation.x = THREE.MathUtils.lerp(
          meshChild.rotation.x,
          mappedTargetX,
          0.8
        );
        playerMesh.rotation.z = THREE.MathUtils.lerp(
          playerMesh.rotation.z,
          mappedTargetYaw,
          0.8
        );
      }

      if (input.upwardAcceleration > 0) {
        input.upwardVelocity = Math.min(
          input.upwardVelocity +
          input.upwardAcceleration * verticalAcceleration,
          maxVelocity
        );
      } else if (input.upwardAcceleration < 0) {
        input.upwardVelocity = Math.max(
          input.upwardVelocity +
          input.upwardAcceleration * verticalAcceleration,
          -maxVelocity
        );
      } else {
        input.upwardVelocity =
          Math.abs(input.upwardVelocity) <= 0.3 * timeElapsed
            ? 0
            : input.upwardVelocity -
            Math.sign(input.upwardVelocity) * 0.1 * timeElapsed;
      }

      if (input.forwardAcceleration > 0) {
        input.forwardVelocity = Math.min(
          input.forwardVelocity + input.forwardAcceleration * acceleration,
          maxVelocity
        );
      } else if (input.forwardAcceleration < 0) {
        input.forwardVelocity = Math.max(
          input.forwardVelocity + input.forwardAcceleration * deceleration,
          0
        );
      }

      const sinY = Math.sin(playerMesh.rotation.y); // Sine of yaw rotation (y-axis)
      const cosY = Math.cos(playerMesh.rotation.y); // Cosine of yaw rotation (y-axis)
      const cosX = Math.cos(playerMesh.rotation.x); // Cosine of pitch rotation (x-axis)

      moveVector.set(
          sinY * cosX * input.forwardVelocity, // X component: Forward motion in X-axis
          -Math.sin(meshChild.rotation.x) * input.forwardVelocity + input.upwardVelocity, // Y component: Vertical motion (up/down)
          cosY * cosX * input.forwardVelocity // Z component: Forward motion in Z-axis
      );





      let spaceshipvolumelevel = mapValue(input.forwardVelocity,0,maxVelocity,0,1);
      if (audioManager) {
        audioManager.setSpaceshipVolume(spaceshipvolumelevel);
      }
      
      playerMesh.position.add(moveVector);
      playerShip.updateVelocityRectangle(input.forwardVelocity, maxVelocity);
      playerShip.thirdPersonCamera.Update(timeElapsed);
      
      updateVelocityBars(input.forwardVelocity, maxVelocity); // ui
    }
  }


  if (playerShip.activeLasers) {
    playerShip.activeLasers.forEach(beam => {
      let { laserBeam, velocity, direction } = beam
      laserBeam.position.add(velocity.clone().multiplyScalar(0.2));
      playerShip.checkLaserCollision(laserBeam.position, direction);
      if (laserBeam.position.distanceTo(playerShip.mesh.position) > 50) {
        playerShip.scene.remove(laserBeam);
      }
    });
  }



  if (world) {
    if (world.asteroidGroups) {
      world.asteroidGroups.forEach(astroidGroup => astroidGroup.animateAsteroidGroup())
    }
  
    world.rings.forEach((ring) => {
      ring.update(); // Make sure to call update first
      if (ring.checkCollisionWithRing(playerMesh)) {
        console.log("play");
        audioManager.playNextSound();
      }
    });  
  }
  


  composer.render();
}

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

function handleMouseClick(event) {
  playerShip.createAndShootLight();
}


window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("mousedown", handleMouseClick);


animate();
