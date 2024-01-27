import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

import { GUI } from "dat.gui";
import { generateRadialGradient } from "./gradient.js";
import { ThirdPersonCamera } from './third-person-view.js'
import { player_input } from './player-input.js'
import { entity } from './entity.js'


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
// const camera = new THREE.PerspectiveCamera(
//   45,
//   window.innerWidth / window.innerHeight,
//   1,
//   1000
// );
// camera.position.set(0, 5, 13);
const camera = new THREE.PerspectiveCamera(
  60, // Wider field of view
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

// Scene

scene.fog = new THREE.FogExp2(0x111111, 0.08);

const ambientLight = new THREE.AmbientLight(0x777777, 0.8);
scene.add(ambientLight);

const particleCount = 100;
const particles = new THREE.Group();
const particleGeometry = new THREE.SphereGeometry(0.01, 4, 4);

const particleMaterial = new THREE.MeshBasicMaterial({
  color: 0x00aaff,
  emissive: 0x00aaff,
  emissiveIntensity: 0.5,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.4,
});

for (let i = 0; i < particleCount; i++) {
  const particle = new THREE.Mesh(particleGeometry, particleMaterial);
  particle.position.set(
    Math.random() * 20 - 10,
    Math.random() * 10,
    Math.random() * 20 - 10
  );
  particles.add(particle);

  animateParticle(particle);
}

scene.add(particles);

const glowGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const glowMaterial = new THREE.MeshStandardMaterial({
  emissive: 0xff6600,
  emissiveIntensity: 2,
  color: 0x111111,
});
const glowGeometry2 = new THREE.BoxGeometry(.3, .3, .3);
const glowMaterial2 = new THREE.MeshStandardMaterial({
  emissive: 0xff6600, 
  emissiveIntensity: 5,
  color: 0x777777,
});


const spotLight = new THREE.SpotLight(0xff6600, 2, 30, 1, 1); // Orange color for a dystopian feel
spotLight.position.set(0, 15, 0);
spotLight.castShadow = true;
spotLight.shadow.bias = -0.0001;
scene.add(spotLight);

const spotLight2 = new THREE.SpotLight(0x00aaff, 2, 30, 1, 1); // Blue color for contrast
spotLight2.position.set(0, 15, -15); // Adjust the Z position
spotLight2.castShadow = true;
spotLight2.shadow.bias = -0.0001;
scene.add(spotLight2);




function generateRingPoints(radius, pointCount, h) {
  for (let i = 0; i < pointCount; i++) {
    const angle = (Math.PI * 2 * i) / pointCount;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const glowPoint = new THREE.Mesh(glowGeometry, glowMaterial);
    glowPoint.position.set(x, 0, y);
    scene.add(glowPoint);
  }
}

let numRings = 5
let r = 4
for (let i=0; i<numRings; i++) {
  generateRingPoints(i*r, i*10, i);
}

function runwayLights (yOff) {
  const glowMesh1 = new THREE.Mesh(glowGeometry2, glowMaterial2);
  const glowMesh2 = new THREE.Mesh(glowGeometry2, glowMaterial2);
  const glowMesh3 = new THREE.Mesh(glowGeometry2, glowMaterial2);
  const glowMesh4 = new THREE.Mesh(glowGeometry2, glowMaterial2);
  glowMesh1.position.set(2, 0, -2 + yOff);
  glowMesh2.position.set(-2, 0, -2 + yOff);
  glowMesh3.position.set(2, 0, 2 + yOff);
  glowMesh4.position.set(-2, 0, 2 + yOff);
  const glowMeshArray = [glowMesh1, glowMesh2, glowMesh3, glowMesh4];
  scene.add(...glowMeshArray);
}
let numSquares = 5;
for (let i=0; i<numSquares; i++) {
  runwayLights(i*10);
}






// Add flickering effect to the glow
animateFlicker(glowMaterial);

function animateParticle(particle) {
  const animationSpeed = 0.0006;
  const initialPosition = particle.position.clone();

  particle.userData.animationOffset = Math.random() * Math.PI * 2;

  particle.onBeforeRender = (
    renderer,
    scene,
    camera,
    geometry,
    material,
    group
  ) => {
    const time =
      performance.now() * animationSpeed + particle.userData.animationOffset;
    particle.position.x = initialPosition.x + Math.sin(time) * 1;
    particle.position.y = initialPosition.y + Math.sin(time * 2) * 0.5;
    particle.position.z = initialPosition.z + Math.sin(time * 3) * 1;
  };
}

function animateFlicker(material) {
  const animationSpeed = 0.002;
  let time = 0;

  function animate() {
    time += animationSpeed;

    if (material.emissive) {
      material.emissive.setScalar(Math.abs(Math.sin(time)));
    }

    requestAnimationFrame(animate);
  }

  animate();
}







const cubeTextureLoader = new THREE.CubeTextureLoader();
const textureUrls = [
  'public/blue/bkg1_left.png', // URL for the negative x-axis (left)
  'public/blue/bkg1_right.png', // URL for the positive x-axis (right)
  'public/blue/bkg1_top.png', // URL for the positive y-axis (top)
  'public/blue/bkg1_bot.png', // URL for the negative y-axis (bottom)
  'public/blue/bkg1_front.png', // URL for the positive z-axis (front)
  'public/blue/bkg1_back.png'  // URL for the negative z-axis (back)
];
const cubeMap = cubeTextureLoader.load(textureUrls);
scene.background = cubeMap;

// const gradientTexture = new THREE.Texture(generateRadialGradient());
// scene.background = gradientTexture;

const groundGeometry = new THREE.PlaneGeometry(35, 150, 35, 35);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x111111,
  metalness: 0.8,
  roughness: 0.5,
  side: THREE.DoubleSide,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.castShadow = false;
groundMesh.receiveShadow = true;
scene.add(groundMesh);






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








const playerInputComponent = new player_input.PlayerInput({});
const playerEntity = new entity.Entity();
playerEntity.AddComponent(playerInputComponent);
playerEntity.InitEntity();



// function createOutline(mesh) {
//   const edges = new THREE.EdgesGeometry(mesh.geometry);
//   const outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
//   mesh.add(outline);
// }



// SHIPPP

const loader = new GLTFLoader().setPath("public/spaceship_-_cb1/");

// Load model
let mesh;
let thirdPersonCamera;
let rotationWrapper = new THREE.Group();

loader.load(
  "scene.gltf",
  (gltf) => {
    // Create a temporary object to hold the imported model
    let tempObject = gltf.scene.clone();

    tempObject.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    tempObject.rotation.y = 1.5 * Math.PI ;
    mesh = rotationWrapper;
    updateSpaceshipPosition();
    rotationWrapper.add(tempObject);

    scene.add(mesh); // Add the wrapper to the scene

    const pointLight = new THREE.PointLight(0xff6600, 2, 5);
    pointLight.position.copy(tempObject.position);
    pointLight.position.x -= 2;
    
    scene.add(pointLight);


    thirdPersonCamera = new ThirdPersonCamera({
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





const maxVelocity = 3;

function animate() {
  requestAnimationFrame(animate);

  if (playerEntity && playerEntity.GetComponent('PlayerInput')) {
    playerEntity.Update(); 

    const input = playerEntity.Attributes.InputCurrent;
    const speed = 0.1;
    const acceleration = 0.03; 
    const deceleration = 0.02; 

    if (input.forwardAcceleration > 0) {
      input.forwardVelocity = Math.min(input.forwardVelocity + input.forwardAcceleration * acceleration, maxVelocity);
    } else if (input.forwardAcceleration < 0) {
      input.forwardVelocity = Math.max(input.forwardVelocity + input.forwardAcceleration * deceleration, 0);
    }

    if (mesh && thirdPersonCamera) {
      const moveVector = new THREE.Vector3(
        Math.sin(mesh.rotation.y) * input.forwardVelocity * speed,
        0,
        Math.cos(mesh.rotation.y) * input.forwardVelocity * speed
      );

      const newPosition = mesh.position.clone().add(moveVector);
      mesh.position.set(newPosition.x, newPosition.y, newPosition.z);

      const rotationAngle = -input.axis1Side * 0.05; 
      mesh.rotation.y += rotationAngle;

      console.log(mesh.position)
      controls.update();
      thirdPersonCamera.update();
    }
  }

  composer.render();
}




animate();