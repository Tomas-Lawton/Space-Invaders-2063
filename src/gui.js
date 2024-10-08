import * as THREE from "three";
import { GUI } from "dat.gui";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
export function setupGUI({
  camera,
  renderer,
  // spaceshipParams,
  // updateSpaceshipPosition,
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
    .name("Sound");
  audioFolder.open();
  playSoundtrackController.onChange(playSoundtrack);

  // updateBloomParameters();
  // updateSpaceshipPosition();

  return gui;
}
