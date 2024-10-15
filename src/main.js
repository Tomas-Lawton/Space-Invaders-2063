import * as THREE from "three";

// Modules
import { Audio_Manager } from "./audio.js";
import { gameworld } from "./world.js";
import { spaceship } from "./spaceship.js";
import { setupGUI } from "./gui.js";
import { entity } from "./entity.js";
import { initRenderer, initComposer } from "./renderer.js";
import { updateVelocityBar, updateHealthBar, progressContainer } from "./dom.js";
import { player_input } from "./player-input.js";
import { PHYSICS_CONSTANTS } from "./constants.js"

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
  }

  initEntities() {
    this.world = new gameworld.World({ scene: this.scene });
    this.playerEntity = new entity.Entity();
    this.playerShip = new spaceship.Spaceship(this.scene, this.camera, 100);
  }

  async initialize() {
    await this.setupAudio();
    this.world.addElements();

    if (this.playerEntity && this.playerShip) {
      this.playerShip.loadSpaceship();
      this.playerEntity.AddComponent(new player_input.PlayerInput());
      this.playerEntity.InitEntity();
    }

    setupGUI({ camera: this.camera, renderer: this.renderer, audioManager: this.audioManager });
    
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
    if (this.playerShip && !this.playerShip.mesh) return; // wait for load
    this.Update(timeElapsed);
  }

  Update(timeElapsed) {
    if (this.playerEntity && this.playerEntity.GetComponent("PlayerInput")) {
      this.playerEntity.Update();
      let input = this.playerEntity.Attributes.InputCurrent;
      if (input) {


        // update ship
        if (this.playerShip && this.world && this.audioManager){
          this.playerShip.Update(input.forwardAcceleration, input.upwardAcceleration, timeElapsed, this.audioManager, this.world.asteroidLoader);
        } else {
          progressContainer.style.display = 'none';
        }

        // update world
        if (this.world && this.audioManager){
          let playerCurrentPosition
          if (this.playerShip === undefined || this.playerShip === null) {
            playerCurrentPosition = new THREE.Vector3(0, 0, 0);
          } else {
            playerCurrentPosition = this.playerShip.mesh.position
          }

          this.world.Update(timeElapsed, playerCurrentPosition, this.audioManager); // depends on user and sound
        }

        // update hud
        if (this.playerShip){
          updateVelocityBar(this.playerShip.forwardVelocity, PHYSICS_CONSTANTS.maxVelocity);
          updateHealthBar(this.playerShip.health, this.playerShip.maxHealth)
        }




      }
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