import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

import { third_person_camera } from './camera.js'
import { player_input } from './player-input.js'
import { entity } from './entity.js'
import { environment } from './environment.js'
import { mapValue } from './utils.js'
import { Audio_Manager } from './audio.js'
import { setupGUI } from './gui.js';



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
  60, 
  window.innerWidth / window.innerHeight,
  1,
  1000
);
camera.position.set(0, 5, 5); 

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.8,
  1,
  1
);

const renderScene = new RenderPass(scene, camera);
const composer = new EffectComposer(renderer);




const renderTargetParameters = {
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	stencilBuffer: false
};



composer.addPass(renderScene);
composer.addPass(bloomPass);


document.body.style.cursor = "none";


// Environment
const world = new environment.World({ scene: scene });
world.create()




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

loader.load(
  "scene.gltf",
  (gltf) => {
    mesh = new THREE.Group();

    const tempObjectGroup = new THREE.Group();
    const loadedModel = gltf.scene;
    loadedModel.traverse(child => child.isMesh && (child.castShadow = child.receiveShadow = true));
    loadedModel.rotation.y = 1.5 * Math.PI;
    loadedModel.position.z += 22;
    tempObjectGroup.add(loadedModel);

    const ambientLightColor = 0x660099;
    const ambientLight = new THREE.PointLight(ambientLightColor, 1, 50);
    ambientLight.position.set(tempObjectGroup.position.x, tempObjectGroup.position.y + 5, tempObjectGroup.position.z);
    tempObjectGroup.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xff6600, 3, 5, Math.PI * 1.1, 0.2);
    spotLight.position.copy(mesh.position);
    tempObjectGroup.add(spotLight);
    

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
    await audioManager.loadSounds('./public/audio/sounds');
    await audioManager.loadSoundtrack('./public/audio/soundtrack.wav');
  } catch (error) {
    console.error('Failed to initialize AudioContext:', error);
  }
}

startAudioContext();


setupGUI({ camera, renderer, bloomPass, spaceshipParams, updateSpaceshipPosition, audioManager });



const maxVelocity = 9.5;
let previousTime = 0;
let mouseX = 0;
let mouseY = 0;
let continuousRotation = 0;

const playerInputComponent = new player_input.PlayerInput();
const playerEntity = new entity.Entity();
playerEntity.AddComponent(playerInputComponent);
playerEntity.InitEntity();

function handleMouseMove(event) {
  const centerX = window.innerWidth / 2;
  mouseX = event.clientX - centerX; 
  const centerY = window.innerHeight / 2;
  mouseY = event.clientY - centerY;
}

function animate(currentTime) {
  requestAnimationFrame(animate);

  const timeElapsed = (currentTime - previousTime) / 1000;
  previousTime = currentTime;


  // player
  if (playerEntity && playerEntity.GetComponent('PlayerInput')) {
    playerEntity.Update();
    const input = playerEntity.Attributes.InputCurrent;

    if (input && typeof input.axis1Side !== 'undefined' && mesh && thirdPersonCamera) {

      const rotationAngle = -input.axis1Side * 0.05;
      mesh.rotation.y += rotationAngle;
      mesh.rotation.y = ((mesh.rotation.y + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      
      const speed = 0.1;
      const acceleration = 0.006;
      const deceleration = 0.05;
      const verticalAcceleration = 0.0005;
      let meshChild = mesh.children[0]

      // absolute left right
      continuousRotation = -(mouseX * 0.001) * 0.08;
      let rotateTarget = mesh.rotation.y + continuousRotation;
      mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, rotateTarget, 0.5); 
      
      // pitch
      const targetX = meshChild.rotation.x + (mouseY * 0.0001);
      const mappedTargetX = mapValue(targetX, -Math.PI, Math.PI, -Math.PI * 0.93, Math.PI * 0.93);
      meshChild.rotation.x = THREE.MathUtils.lerp(meshChild.rotation.x, mappedTargetX, 0.8); 
      
      // yaw
      const targetYaw = mesh.rotation.z + (mouseX * 0.001);
      const mappedTargetYaw = mapValue(targetYaw, -Math.PI, Math.PI, -Math.PI/2, Math.PI/2);
      mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, mappedTargetYaw, 0.8);
      
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
        input.upwardVelocity = Math.abs(input.upwardVelocity) <= 0.3 * timeElapsed
          ? 0
          : input.upwardVelocity - Math.sign(input.upwardVelocity) * 0.1 * timeElapsed;
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
        Math.sin(mesh.rotation.y) * Math.cos(mesh.rotation.x) * input.forwardVelocity * speed,
       (-Math.sin(meshChild.rotation.x) * input.forwardVelocity * speed) + input.upwardVelocity,
        Math.cos(mesh.rotation.y) * Math.cos(mesh.rotation.x) * input.forwardVelocity * speed
      );
      mesh.position.add(moveVector);

      thirdPersonCamera.Update(timeElapsed);
    }
  }

  world.rings.forEach(ring => {
    ring.update();  // Make sure to call update first
    if (ring.checkCollisionWithRing(mesh)) {
      console.log('play');
      audioManager.playNextSound();
    }
  });
  composer.render();
}

window.addEventListener('mousemove', handleMouseMove);

animate();