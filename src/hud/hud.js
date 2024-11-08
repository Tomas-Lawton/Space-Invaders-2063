import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, currentModel;
const models = {};

const canvas = document.getElementById('ship-hanger');

export function initHUD() {
  console.log('test');
  
  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  // camera.position.set(0, 10, 100);

  // // Renderer setup
  // renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  // renderer.setSize(500, 500);
  // renderer.setPixelRatio(window.devicePixelRatio);
  // renderer.setClearColor(0x000000);
  // renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = THREE.PCFSoftShadowMap;



  camera = new THREE.PerspectiveCamera(
    45,
    1,
    0.1,
    1000
  );
  camera.position.set(0, 10, 100);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(500, 500);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;


  // Lighting setup
  const light = new THREE.DirectionalLight(0xffffff, 10);
  light.position.set(5, 10, 7.5);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  // Load models and initialize the scene
  loadModels();
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

async function loadModels() {
  const loader = new GLTFLoader();

  const modelPaths = [
    'public/ships/ship_0/',
    'public/ships/ship_1/',
    'public/ships/ship_2/',
    'public/ships/ship_3/',
  ];

  try {
    const modelPromises = modelPaths.map(async (path, index) => {
      const gltf = await loader.setPath(path).loadAsync('scene.gltf');
      const model = gltf.scene.clone();
      model.rotation.y = 1.5 * Math.PI;
      model.position.z += 22;
      
      // Store the model in the models object with a key based on ship number
      models[`ship-${index + 1}`] = model;
    });

    await Promise.all(modelPromises);
    console.log('Models loaded:', models);
  } catch (error) {
    console.error('Error loading models:', error);
  }
}

// Function to switch models based on shipId
function switchModel(shipId) {
  if (!models[shipId]) return;

  // Remove the current model if it exists
  if (currentModel) {
    scene.remove(currentModel);
  }

  // Add the new model to the scene
  currentModel = models[shipId];
  scene.add(currentModel);
}

// Event listeners for ship selection buttons
document.getElementById('ships-bar').addEventListener('click', (e) => {
  if (e.target.classList.contains('ship-option')) {
    const shipId = e.target.id; // The id should match "ship-1", "ship-2", etc.
    switchModel(shipId);
  }
});
