import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, currentModel, controls;
const models = {};

const canvas = document.getElementById('ship-hanger');

export function initHUD() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 10, 100);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(500, 500);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x87ceeb); // Light blue sky color
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const light = new THREE.DirectionalLight(0xffffff, 10);
  light.position.set(5, 10, 7.5);
  light.castShadow = true;
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  addGround();
  addBackground();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Smooth orbiting
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2; // Restrict vertical camera movement


  // controls.enableDamping = true;
  // controls.enablePan = true;
  // controls.minDistance = 5;
  // controls.maxDistance = 20;
  // controls.minPolarAngle = 0.5;
  // controls.maxPolarAngle = 1.5;
  controls.autoRotate = true;

  loadModels();
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Update the controls for smooth orbit
  renderer.render(scene, camera);
}

async function loadModels() {
  const loader = new GLTFLoader();
  const modelPaths = [
    { path: 'public/ships/ship_0/', rotation: { x: 0, y: 0, z: 0 } },
    { path: 'public/ships/ship_1/', rotation: { x: 0, y: Math.PI / 2, z: 0 } },
    { path: 'public/ships/ship_2/', rotation: { x: 0, y: Math.PI, z: 0 } },
    { path: 'public/ships/ship_3/', rotation: { x: 0, y: -Math.PI / 2, z: 0 } },
  ];

  try {
    const modelPromises = modelPaths.map(async (modelData, index) => {
      const gltf = await loader.setPath(modelData.path).loadAsync('scene.gltf');
      const model = gltf.scene.clone();
      model.traverse(
        (child) =>
          child.isMesh && (child.castShadow = child.receiveShadow = true)
      );
      model.castShadow = true;
      models[`ship-${index + 1}`] = { model, rotation: modelData.rotation };
    });

    await Promise.all(modelPromises);
  } catch (error) {
    console.error('Error loading models:', error);
  }
}

function switchModel(shipId) {
  if (!models[shipId]) return;
  if (currentModel) scene.remove(currentModel.model);
  currentModel = models[shipId];
  normalizeModelSize(currentModel.model, 55);
  currentModel.model.rotation.set(currentModel.rotation.x, currentModel.rotation.y, currentModel.rotation.z);
  scene.add(currentModel.model);
}

document.getElementById('ships-bar').addEventListener('click', (e) => {
  if (e.target.classList.contains('ship-option')) {
    const shipId = e.target.id;
    switchModel(shipId);
  }
});

function normalizeModelSize(model, targetSize = 1) {
  const bbox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const maxDimension = Math.max(size.x, size.y, size.z);
  const scaleFactor = targetSize / maxDimension;
  if (model.scale.x !== scaleFactor || model.scale.y !== scaleFactor || model.scale.z !== scaleFactor) {
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);
  }
}

function addGround() {
  const geometry = new THREE.PlaneGeometry(500, 500);
  const material = new THREE.MeshLambertMaterial({ color: 0x808080 });
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -10;
  ground.receiveShadow = true; // Ground receives shadow
  scene.add(ground);
}

function addBackground() {
  const geometry = new THREE.BoxGeometry(1000, 1000, 1000);
  const material = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide });
  const background = new THREE.Mesh(geometry, material);
  scene.add(background);
}
