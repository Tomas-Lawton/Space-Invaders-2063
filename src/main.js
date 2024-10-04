import * as THREE from "three";
//post processing

// modules
import { third_person_camera } from "./camera.js";
import { player_input } from "./player-input.js";
import { entity } from "./entity.js";
import { environment } from "./environment.js";
import { mapValue } from "./utils.js";
import { Audio_Manager } from "./audio.js";
import { setupGUI } from "./gui.js";
import { initRenderer, initComposer } from "./renderer.js"
// loaders
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// DOM Elements
const cursor = document.getElementById("custom-cursor");
document.body.style.cursor = "none";

const velocityred = document.getElementById("velocity-gui-duplicate");
function updateVelocityBars(currentVelocity, maxVelocity) {
  let h = mapValue(currentVelocity, 0, maxVelocity, 0, 300);
  velocityred.style.height = `${h}px`; // Adjust based on your design
}


// Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
const renderer = initRenderer()
const composer = initComposer(renderer, scene, camera)









// Environment
const world = new environment.World({ scene: scene });
world.create();

const loader_asteroids = new GLTFLoader().setPath("public/asteroids/");
let asteroidGroup;

loader_asteroids.load("scene.gltf", (gltf) => {
  const loadedModel = gltf.scene;
  asteroidGroup = new THREE.Group();
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
  scene.add(asteroidGroup);
});

function updateSpaceshipPosition() {
  if (mesh) {
    mesh.position.set(
      spaceshipParams.positionX,
      spaceshipParams.positionY,
      spaceshipParams.positionZ
    );
    mesh.scale.set(
      spaceshipParams.scale,
      spaceshipParams.scale,
      spaceshipParams.scale
    );
  }
}

const loader = new GLTFLoader().setPath("public/spaceship_-_cb1/");
let mesh;
let thirdPersonCamera;

const geometry = new THREE.BoxGeometry(3, 3, 3); // Create a rectangle geometry with larger size (5 units long and 0.5 units wide)
const material = new THREE.MeshStandardMaterial({
  emissive: 0xc87dff, // Color for the emissive glow (light purple)
  emissiveIntensity: 3, // Brightness of the glow
  color: 0x9400ff, // Darker purple color for the rectangle
  side: THREE.DoubleSide,
});

// Create a rectangle
let velocityRectangle = new THREE.Mesh(geometry, material);

loader.load(
  "scene.gltf",
  (gltf) => {
    // PLAYER (it's a mesh in a mesh)
    mesh = new THREE.Group();
    const tempObjectGroup = new THREE.Group();
    const loadedModel = gltf.scene;
    loadedModel.traverse(
      (child) => child.isMesh && (child.castShadow = child.receiveShadow = true)
    );
    loadedModel.rotation.y = 1.5 * Math.PI;
    loadedModel.position.z += 22;
    tempObjectGroup.add(loadedModel);

    const ambientLightColor = 0x660099;
    const ambientLight = new THREE.PointLight(ambientLightColor, 1, 50);
    ambientLight.position.set(
      tempObjectGroup.position.x,
      tempObjectGroup.position.y + 5,
      tempObjectGroup.position.z
    );
    tempObjectGroup.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xff6600, 3, 5, Math.PI * 1.1, 0.2);
    spotLight.position.copy(mesh.position);
    tempObjectGroup.add(spotLight);

    //booster
    velocityRectangle.position.copy(mesh.position);
    tempObjectGroup.add(velocityRectangle);

    mesh.add(tempObjectGroup);
    scene.add(mesh);
    updateSpaceshipPosition();
    thirdPersonCamera = new third_person_camera.ThirdPersonCamera({
      camera: camera,
      target: mesh,
    });

    document.getElementById("progress-container").style.display = "none";
  },
  (xhr) => {
    document.getElementById("progress").innerHTML = `LOADING ${Math.max(
      (xhr.loaded / xhr.total) * 100,
      1
    )}/100`;
  }
);

const spaceshipParams = {
  positionX: 0,
  positionY: 0.7,
  positionZ: 0,
  scale: 0.08,
};

let audioManager;

async function startAudioContext() {
  try {
    const audioContext = new AudioContext();
    audioManager = new Audio_Manager(audioContext);
    await audioManager.loadSounds("./public/audio/sounds");
    await audioManager.loadSoundtrack("./public/audio/soundtrack.wav");
    await audioManager.loadSpaceshipSound("./public/audio/ship_rumble.wav");
    audioManager.playSpaceshipSound();
  } catch (error) {
    console.error("Failed to initialize sounds or audio context:", error);
  }
}

startAudioContext();

setupGUI({
  camera,
  renderer,
  spaceshipParams,
  updateSpaceshipPosition,
  audioManager,
});

const maxVelocity = 4.5;
let previousTime = 0;
let mouseX = 0;
let mouseY = 0;
let continuousRotation = 0;

const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 2;

const playerInputComponent = new player_input.PlayerInput();
const playerEntity = new entity.Entity();
playerEntity.AddComponent(playerInputComponent);
playerEntity.InitEntity();

function handleMouseMove(event) {
  mouseX = event.clientX - centerX;
  mouseY = event.clientY - centerY;
  cursor.style.left = event.pageX + "px";
  cursor.style.top = event.pageY + "px";
}

function handleMouseClick(event) {
  // console.log("clicked", playerEntity.Attributes.InputCurrent)
  createAndShootLight();
}

const glowGeometry2 = new THREE.SphereGeometry(0.2, 16, 16); // Increased segments for smoother sphere
const glowMaterial2 = new THREE.MeshStandardMaterial({
  emissive: 0xc87dff, // Orange color for the glow
  emissiveIntensity: 3,
  color: 0x9400ff, // Darker color for the sphere
});

const lightSound = new Audio("public/audio/pew.mp3"); // Replace with the path to your sound file
const boom = new Audio("public/audio/boom.mp3"); // Replace with the path to your sound file

const raycaster = new THREE.Raycaster();
let laserBeam;
function createAndShootLight() {
  const direction = new THREE.Vector3();
  mesh.children[0].getWorldDirection(direction); // Get the forward direction of the child mesh
  const laserPosition = mesh.position.clone(); // Start at the spaceship's position

  laserBeam = new THREE.Mesh(glowGeometry2, glowMaterial2);
  laserBeam.position.copy(laserPosition); // Start position
  laserBeam.lookAt(laserPosition.clone().add(direction)); // Make the laser beam face the direction
  scene.add(laserBeam); // Add laser beam to the scene

  const velocity = direction.multiplyScalar(22); // Set speed higher than the ship

  if (lightSound) {
    lightSound.currentTime = 0; // Reset to the start
    lightSound.volume = 0.25; // Set volume to 25%
    lightSound.play(); // Play the sound
  }

  function updateLaser() {
    laserBeam.position.add(velocity.clone().multiplyScalar(0.1)); // Move the laser beam
    checkLaserCollision(laserBeam.position, direction); // Perform collision detection without any effect on the laser
    if (laserBeam.position.distanceTo(mesh.position) > 50) {
      scene.remove(laserBeam); // Remove the laser after a limit
    } else {
      requestAnimationFrame(updateLaser); // Keep updating the laser position
    }
  }

  updateLaser(); // Start the update loop for the laser
}

function checkLaserCollision(laserPosition, laserDirection) {
  raycaster.set(laserPosition, laserDirection.clone().normalize());
  const intersects = raycaster.intersectObjects(asteroidGroup.children);
  if (intersects.length > 0) {
    console.log("Laser hit an asteroid");

    // Loop through each intersected object and remove it from the scene
    for (const intersect of intersects) {
      // If the intersected object has a parent, remove it directly from the parent
      if (intersect.object.parent) {
        intersect.object.parent.remove(intersect.object);

        if (boom) {
          boom.currentTime = 0; // Reset to the start
          boom.volume = 0.5; // Set volume to 25%
          boom.play(); // Play the sound
        }
      }
    }
    return true; // Collision detected
  }
  return false; // No collision detected
}

// function checkLaserCollision(laserPosition, laserDirection) {
//   raycaster.set(laserPosition, laserDirection.clone().normalize());
//   const intersects = raycaster.intersectObjects(asteroidGroup.children);
//   if (intersects.length > 0) {
//       console.log('Laser hit an asteroid');
//       for (const intersect of intersects) {
//           asteroidGroup.remove(intersect.object); // Remove the asteroid on hit
//           scene.remove(intersect.object); // Remove the asteroid on hit
//       }
//       return true; // Collision detected
//     }
//     return false; // No collision detected
//   }

// function updateVelocityRectangle(currentVelocity) {
//   const rectangleLength = mapValue(currentVelocity, 0, maxVelocity, 0, 19);
//   velocityRectangle.scale.z = rectangleLength + 0.01;
//   // velocityRectangle.position.z = mesh.position.z + (rectangleLength / 2);
// }

function updateVelocityRectangle(currentVelocity) {
  const rectangleLength = mapValue(currentVelocity, 0, maxVelocity, 0, -150);

  velocityRectangle.geometry.dispose(); // Dispose of the old geometry
  velocityRectangle.geometry = new THREE.BoxGeometry(3, 3, rectangleLength); // Adjust width and height as needed
  velocityRectangle.position.z = rectangleLength / 2;
  // velocityRectangle.scale.z = rectangleLength + 0.01;
  // velocityRectangle.position.z = mesh.position.z + (rectangleLength / 2);
}

// flight physics
const speed = 0.1;
const acceleration = 0.03;
const deceleration = 0.009;
const verticalAcceleration = 0.0005;

function animate(currentTime) {
  requestAnimationFrame(animate);

  const timeElapsed = (currentTime - previousTime) / 1000;
  previousTime = currentTime;

  // player
  if (playerEntity && playerEntity.GetComponent("PlayerInput")) {
    playerEntity.Update();
    const input = playerEntity.Attributes.InputCurrent;

    if (
      input &&
      typeof input.axis1Side !== "undefined" &&
      mesh &&
      thirdPersonCamera
    ) {
      const rotationAngle = -input.axis1Side * 0.05;
      mesh.rotation.y += rotationAngle;
      mesh.rotation.y =
        ((((mesh.rotation.y + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) %
          (2 * Math.PI)) -
        Math.PI;

      let meshChild = mesh.children[0];

      // only apply player rotation while moving

      // absolute left right
      // continuousRotation = -(mouseX * 0.001) * 0.08;
      continuousRotation = -(mouseX * 0.0001);
      // continuousRotation = 0
      let rotateTarget = mesh.rotation.y + continuousRotation;

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
      const targetYaw = mesh.rotation.z + mouseX * 0.001;
      const mappedTargetYaw = mapValue(
        targetYaw,
        -Math.PI,
        Math.PI,
        -Math.PI / 2,
        Math.PI / 2
      );

      if (input.forwardVelocity > 0) {
        mesh.rotation.y = THREE.MathUtils.lerp(
          mesh.rotation.y,
          rotateTarget,
          0.5
        );
        meshChild.rotation.x = THREE.MathUtils.lerp(
          meshChild.rotation.x,
          mappedTargetX,
          0.8
        );
        mesh.rotation.z = THREE.MathUtils.lerp(
          mesh.rotation.z,
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

      // set audio based on forward velocity
      // console.log(input.forwardVelocity)
      let spaceshipvolumelevel = mapValue(
        input.forwardVelocity,
        0,
        maxVelocity,
        0,
        1
      );
      // console.log(spaceshipvolumelevel)
      audioManager.setSpaceshipVolume(spaceshipvolumelevel);
      updateVelocityBars(input.forwardVelocity, maxVelocity);
      updateVelocityRectangle(input.forwardVelocity);

      const moveVector = new THREE.Vector3(
        Math.sin(mesh.rotation.y) *
        Math.cos(mesh.rotation.x) *
        input.forwardVelocity *
        speed,
        -Math.sin(meshChild.rotation.x) * input.forwardVelocity * speed +
        input.upwardVelocity,
        Math.cos(mesh.rotation.y) *
        Math.cos(mesh.rotation.x) *
        input.forwardVelocity *
        speed
      );

      // only update camera if player is moving
      // if (moveVector.length() !== 0) {
      mesh.position.add(moveVector);
      thirdPersonCamera.Update(timeElapsed);
      // }
    }
  }

  // Animate the asteroids
  if (asteroidGroup) {
    asteroidGroup.children.forEach((asteroid) => {
      asteroid.position.add(asteroid.velocity); // Apply asteroid's velocity
    });
  }

  world.rings.forEach((ring) => {
    ring.update(); // Make sure to call update first
    if (ring.checkCollisionWithRing(mesh)) {
      console.log("play");
      audioManager.playNextSound();
    }
  });
  composer.render();
}

window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("mousedown", handleMouseClick);

animate();
