import * as THREE from "three";

// Modules
import { Audio_Manager } from "./components/audio.js";
import { gameworld } from "./scene/world.js";
import { spaceship } from "./components/player/spaceship.js";
import { setupGUI } from "./components/gui.js";
import { entity } from "./utils/entity.js";
import { initRenderer, initComposer } from "./scene/renderer.js";
import { updateVelocityBar, updateHealthBar, progressContainer } from "./components/dom.js";
import { player_input } from "./components/player/player-input.js";
import { PHYSICS_CONSTANTS } from "./utils/constants.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

class Game {
  constructor() {
    this.initScene();
    this.initEntities();
    this.initialize();
    this.previousTime = 0; // animation loop
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    this.renderer = initRenderer();
    this.composer = initComposer(this.renderer, this.scene, this.camera);

    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.minPolarAngle = 0.5;
    controls.maxPolarAngle = 1.5;
    controls.autoRotate = false;
    controls.target = new THREE.Vector3(0, 0, 1);
    controls.update();
  }

  initEntities() {
    this.world = new gameworld.World({ scene: this.scene });

    // load user ship
    this.playerEntity = new entity.Entity();
    this.playerShip = new spaceship.Spaceship(this.scene, this.camera, 100);
  }

  async initialize() {
    await this.setupAudio();
    this.world.addElements();

    if (this.playerEntity !== undefined && this.playerShip !== undefined) {
      this.playerShip.loadSpaceship();
      this.playerEntity.AddComponent(new player_input.PlayerInput());
      this.playerEntity.InitEntity();
    } else {
      progressContainer.style.display = 'none';
    }

    setupGUI({ audioManager: this.audioManager });
    
    this.animate();
  }

  async setupAudio() {
    const audioContext = new AudioContext();
    this.audioManager = new Audio_Manager(audioContext);

    try {
      await Promise.all([
        this.audioManager.loadSounds("./public/audio/sounds"),
        this.audioManager.loadSoundtrack("./public/audio/soundtrack.wav"),
        this.audioManager.loadSpaceshipSound("./public/audio/ship_rumble.wav"),
      ]);
      this.audioManager.playSpaceshipSound();
    } catch (error) {
      console.error("Failed to initialize audio:", error);
    }
  }

  animate(currentTime) {
    requestAnimationFrame((time) => this.animate(time));
    const timeElapsed = (currentTime - this.previousTime) / 1000;
    this.previousTime = currentTime;
    if (this.playerShip !== undefined && this.playerShip.mesh === null) return; // wait to load
    this.Update(timeElapsed);
  }

  Update(timeElapsed) {

    // get current inputs
    if (this.playerEntity && this.playerEntity.GetComponent("PlayerInput")) {
      this.playerEntity.Update();
      let input = this.playerEntity.Attributes.InputCurrent;
      if (input) {
        // update ship
        if (this.playerShip && this.world && this.audioManager){
          this.playerShip.Update(input.forwardAcceleration, input.upwardAcceleration, timeElapsed, this.audioManager, this.world.asteroidLoader);
          // update hud
          updateVelocityBar(this.playerShip.forwardVelocity, PHYSICS_CONSTANTS.maxVelocity);
          updateHealthBar(this.playerShip.health, this.playerShip.maxHealth)
        }
      }
    }

     // update world
     if (this.world && this.audioManager){
      let playerCurrentPosition;
      if (this.playerShip === undefined) {
        playerCurrentPosition = new THREE.Vector3(0, 0, 0);  // Just assign the vector itself
      } else {
        playerCurrentPosition = this.playerShip.mesh.position;  // Access the position of the ship's mesh
      }
      this.world.Update(playerCurrentPosition, this.audioManager); // depends on user and sound
    }
    this.composer.render();
  }
}

const game = new Game();
let shootingInterval;

window.addEventListener("mousedown", () => {
  if (game.playerShip) {
    game.playerShip.createAndShootLight();
    shootingInterval = setInterval(() => {
        game.playerShip.createAndShootLight();
    }, 150);
  }
});

window.addEventListener("mouseup", () => {
    clearInterval(shootingInterval);
});