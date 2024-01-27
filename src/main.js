import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

import { GUI } from "dat.gui";
import { third_person_camera } from './camera.js'
import { player_input } from './player-input.js'
import { entity } from './entity.js'
import { environment } from './environment.js'

// Setup

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  40, 
  window.innerWidth / window.innerHeight,
  1,
  1000
);
camera.position.set(0, 5, 5); 

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.8,
  1,
  1
);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Environment
const world = new environment.World({ scene: scene });
world.create()


// GUI
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

const spaceshipParams = {
  positionX: 0,
  positionY: 0.7, //.7 ground
  positionZ: 0,
  scale: 0.08,
};

const gui = new GUI();
const spaceshipFolder = gui.addFolder("Spaceship Position");
spaceshipFolder
  .add(spaceshipParams, "positionX", -10, 10)
  .onChange(updateSpaceshipPosition);
spaceshipFolder
  .add(spaceshipParams, "positionY", -10, 10)
  .onChange(updateSpaceshipPosition);
spaceshipFolder
  .add(spaceshipParams, "positionZ", -10, 10)
  .onChange(updateSpaceshipPosition);
spaceshipFolder
  .add(spaceshipParams, "scale", 0.01, 2)
  .onChange(updateSpaceshipPosition);
spaceshipFolder.open();

const bloomFolder = gui.addFolder("Bloom Effect");
const defaultBloomStrength = 3;
const defaultBloomThreshold = 0.3;
const defaultBloomRadius = 0.7;
const strengthController = bloomFolder
  .add(bloomPass, "strength", 0.1, 3)
  .name("Intensity")
  .onChange(updateBloomParameters);
const thresholdController = bloomFolder
  .add(bloomPass, "threshold", 0, 1)
  .name("Threshold")
  .onChange(updateBloomParameters);
const radiusController = bloomFolder
  .add(bloomPass, "radius", 0, 1)
  .name("Radius")
  .onChange(updateBloomParameters);

strengthController.setValue(defaultBloomStrength);
thresholdController.setValue(defaultBloomThreshold);
radiusController.setValue(defaultBloomRadius);
// bloomFolder.open();

function updateBloomParameters() {
  bloomPass.strength = bloomFolder.__controllers[0].object.strength;
  bloomPass.threshold = bloomFolder.__controllers[1].object.threshold;
  bloomPass.radius = bloomFolder.__controllers[2].object.radius;
}

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








const playerInputComponent = new player_input.PlayerInput();
const playerEntity = new entity.Entity();
playerEntity.AddComponent(playerInputComponent);
playerEntity.InitEntity();


// SHIPPP
const loader = new GLTFLoader().setPath("public/spaceship_-_cb1/");
let mesh;
let thirdPersonCamera;
loader.load(
  "scene.gltf",
  (gltf) => {
    let rotationWrapper = new THREE.Group();

    let tempObject = gltf.scene.clone();
    tempObject.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    tempObject.rotation.y = 1.5 * Math.PI ;
    tempObject.position.z += 20;
    mesh = rotationWrapper;
    updateSpaceshipPosition();
    rotationWrapper.add(tempObject);
    scene.add(mesh); 
    document.getElementById("progress-container").style.display = "none";

    // dependents 

    const pointLight = new THREE.PointLight(0xff6600, 2, 5);
    pointLight.position.copy(mesh.position);
    pointLight.position.x -= 2;
    
    scene.add(pointLight);
    
    thirdPersonCamera = new third_person_camera.ThirdPersonCamera({
      camera: camera,
      target: mesh,
    });
    

  },
  (xhr) => {
    document.getElementById("progress").innerHTML = `LOADING ${Math.max(
      (xhr.loaded / xhr.total) * 100,
      1
    )}/100`;
  }
);



const maxVelocity = 5;
let previousTime = 0;

function animate(currentTime) {
  requestAnimationFrame(animate);

  const timeElapsed = (currentTime - previousTime) / 1000;
  previousTime = currentTime;

  if (playerEntity && playerEntity.GetComponent('PlayerInput')) {
    playerEntity.Update();
    const input = playerEntity.Attributes.InputCurrent;

    if (input && typeof input.axis1Side !== 'undefined' && mesh && thirdPersonCamera) {
      const rotationAngle = -input.axis1Side * 0.05;
      mesh.rotation.y += rotationAngle;

      const speed = 0.1;
      const acceleration = 0.03;
      const deceleration = 0.02;
      const verticalAcceleration = 0.0005;

      if (input.upwardAcceleration > 0) {  
        input.upwardVelocity = Math.min(
          input.upwardVelocity + input.upwardAcceleration * verticalAcceleration,
          maxVelocity
        );
      } else if (input.upwardAcceleration < 0) {
        input.upwardVelocity = Math.max(
          input.upwardVelocity + input.upwardAcceleration * verticalAcceleration,
          -maxVelocity
        );
      } else {
        // Gradually decrease upwardVelocity towards 0
        input.upwardVelocity = Math.abs(input.upwardVelocity) <= 0.03 * timeElapsed
          ? 0
          : input.upwardVelocity - Math.sign(input.upwardVelocity) * 0.03 * timeElapsed;
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

      const moveVector = new THREE.Vector3(
        Math.sin(mesh.rotation.y) * input.forwardVelocity * speed,
        input.upwardVelocity,
        Math.cos(mesh.rotation.y) * input.forwardVelocity * speed
      );

      mesh.position.add(moveVector);

      thirdPersonCamera.Update(timeElapsed);
    }
  }

  composer.render();
}

animate();
