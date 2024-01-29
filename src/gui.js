import * as THREE from "three";
import { GUI } from "dat.gui";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
export function setupGUI({
  camera,
  renderer,
  bloomPass,
  spaceshipParams,
  updateSpaceshipPosition,
  audioManager,
}) {
  const gui = new GUI();

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

  updateSpaceshipPosition();

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

  function updateBloomParameters() {
    bloomPass.strength = strengthController.getValue();
    bloomPass.threshold = thresholdController.getValue();
    bloomPass.radius = radiusController.getValue();
  }

  let isPlaying = false;

  function playSoundtrack() {
    try {
      if (isPlaying) {
        audioManager.pauseSoundtrack();
      } else {
        audioManager.playSoundtrack();
      }
      isPlaying = !isPlaying;
    } catch (error) {
      console.warn("Error playing/pausing soundtrack:", error.message);
    }
  }

  const audioFolder = gui.addFolder("Audio");
  const playSoundtrackController = audioFolder
    .add({ playSoundtrack }, "playSoundtrack")
    .name("Toggle Play/Pause Soundtrack");
  audioFolder.open();
  playSoundtrackController.onChange(playSoundtrack);

  updateBloomParameters();
  updateSpaceshipPosition();

  return gui;
}
