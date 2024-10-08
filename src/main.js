import * as THREE from "three";

// Modules
import { Audio_Manager } from "./audio.js";
import { gameworld } from "./world.js";
import { spaceship } from "./spaceship.js";
import { setupGUI } from "./gui.js";
import { entity } from "./entity.js";
import { mapValue } from "./utils.js";
import { initRenderer, initComposer } from "./renderer.js";
import { updateVelocityBars } from "./dom.js";
import { player_input } from "./player-input.js";
import { PHYSICS_CONSTANTS } from "./constants.js"

class Game {
  constructor() {
    this.initScene();
    this.initEntities();
    this.previousTime = 0; // Initialize previousTime for the animation loop
    this.initialize();
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
    this.playerShip = new spaceship.Spaceship(this.scene, this.camera);
  }

  async initialize() {
    await this.setupAudio();
    this.world.addElements();
    this.playerMesh = this.playerShip.loadSpaceship();

    const playerInputComponent = new player_input.PlayerInput();
    this.playerEntity.AddComponent(playerInputComponent);
    this.playerEntity.InitEntity();

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
    if (!this.playerShip.mesh) return; // wait for load
    this.Update(timeElapsed);
  }

  Update(timeElapsed) {
    if (this.playerEntity && this.playerEntity.GetComponent("PlayerInput")) {
      this.playerEntity.Update();
      let input = this.playerEntity.Attributes.InputCurrent;
      if (input) {
        // console.log(input)   
            
        // THREE ELEMENTS
        let velocityCurrent = this.playerShip.Update(input.forwardAcceleration, input.upwardAcceleration, timeElapsed);
        // this.updateAudioVolume(input);
        this.updateWorld();
        
        // HUD ELEMENTS
        updateVelocityBars(velocityCurrent, PHYSICS_CONSTANTS.maxVelocity);
      }
    }
    this.composer.render();
  }

  updateWorld() {
    if (this.world) {
      if (this.world.asteroidGroups) {
        this.world.asteroidGroups.forEach((asteroidGroup) => {
          asteroidGroup.animateAsteroidGroup();
        });
      }

      this.world.rings.forEach((ring) => {
        ring.update();
        if (ring.checkCollisionWithRing(this.playerShip.mesh)) {
          console.log("Collision detected! Playing sound.");
          this.audioManager.playNextSound();
        }
      });
    }
  }

  updateAudioVolume(input) {
    const spaceshipVolumeLevel = mapValue(input.forwardVelocity, 0, PHYSICS_CONSTANTS.maxVelocity, 0, 1);
    if (this.audioManager) {
      this.audioManager.setSpaceshipVolume(spaceshipVolumeLevel);
    }
  }

}


const game = new Game();

window.addEventListener("mousedown", () => game.playerShip.createAndShootLight());

