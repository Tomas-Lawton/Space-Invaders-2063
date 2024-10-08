import * as THREE from "three";

// Modules
import { Audio_Manager } from "./audio.js";
import { gameworld } from "./world.js";
import { spaceship } from "./spaceship.js";
import { setupGUI } from "./gui.js";
import { entity } from "./entity.js";
import { mapValue } from "./utils.js";
import { initRenderer, initComposer } from "./renderer.js";
import { updateVelocityBars, cursor } from "./dom.js";
import { player_input } from "./player-input.js";

const PHYSICS_CONSTANTS = {
    maxVelocity: 0.7,
    acceleration: 0.2,
    deceleration: 0.15,
    verticalAcceleration: 0.0005,
};

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
        this.update(timeElapsed);
    }

    update(timeElapsed) {
        let input

        if (this.playerEntity && this.playerEntity.GetComponent("PlayerInput")) {
          this.playerEntity.Update();
          input = this.playerEntity.Attributes.InputCurrent;
        }

        if (input) {
            this.updatePlayer(input, timeElapsed);
            this.updateAudioVolume(input);
            this.updateWorld();
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

    updatePlayer(input, timeElapsed) {
        if (!this.playerMesh) {
            this.loadPlayerMesh();
            return;
        }
        this.calculateRotation(input);
        this.calculateVelocity(input, timeElapsed);
        let moveInputVector = this.calculateMoveVector(input)


        this.playerShip.Update(input.forwardVelocity, PHYSICS_CONSTANTS.maxVelocity, moveInputVector, timeElapsed)
        updateVelocityBars(input.forwardVelocity, PHYSICS_CONSTANTS.maxVelocity); // UI
    }

    loadPlayerMesh() {
        this.playerMesh = this.playerShip.mesh;
        if (!this.playerMesh) return;
        this.meshChild = this.playerMesh.children[0];
    }


    calculateRotation(input) {
        if (input.forwardVelocity > 0) {
            const continuousRotation = -(mouseX * 0.0001);
            this.playerMesh.rotation.y += continuousRotation;

            const targetX = this.meshChild.rotation.x + mouseY * 0.0001;
            const mappedTargetX = mapValue(targetX, -Math.PI, Math.PI, -Math.PI * 0.93, Math.PI * 0.93);
            this.meshChild.rotation.x = THREE.MathUtils.lerp(this.meshChild.rotation.x, mappedTargetX, 0.8);
        }
    }

    calculateVelocity(input, timeElapsed) {
        this.updateUpwardVelocity(input, timeElapsed);
        this.updateForwardVelocity(input, timeElapsed);
    }

    updateUpwardVelocity(input, timeElapsed) {
        if (input.upwardAcceleration > 0) {
            input.upwardVelocity += input.upwardAcceleration * PHYSICS_CONSTANTS.verticalAcceleration * timeElapsed;
            input.upwardVelocity = Math.min(input.upwardVelocity, PHYSICS_CONSTANTS.maxVelocity);
        } else if (input.upwardAcceleration < 0) {
            input.upwardVelocity += input.upwardAcceleration * PHYSICS_CONSTANTS.verticalAcceleration * timeElapsed;
            input.upwardVelocity = Math.max(input.upwardVelocity, -PHYSICS_CONSTANTS.maxVelocity);
        } else {
            input.upwardVelocity = (Math.abs(input.upwardVelocity) <= 0.3 * timeElapsed) 
                ? 0 
                : input.upwardVelocity - Math.sign(input.upwardVelocity) * 0.1 * timeElapsed;
        }
    }

    updateForwardVelocity(input, timeElapsed) {
        if (input.forwardAcceleration > 0) {
            input.forwardVelocity += input.forwardAcceleration * PHYSICS_CONSTANTS.acceleration * timeElapsed;
            input.forwardVelocity = Math.min(input.forwardVelocity, PHYSICS_CONSTANTS.maxVelocity);
        } else if (input.forwardAcceleration < 0) {
            input.forwardVelocity += input.forwardAcceleration * PHYSICS_CONSTANTS.deceleration * timeElapsed;
            input.forwardVelocity = Math.max(input.forwardVelocity, 0);
        }
    }

    calculateMoveVector(input) {
        const moveVector = new THREE.Vector3();
        const sinY = Math.sin(this.playerShip.mesh.rotation.y);
        const cosY = Math.cos(this.playerShip.mesh.rotation.y);
        const cosX = Math.cos(this.meshChild.rotation.x);

        moveVector.set(
            sinY * cosX * input.forwardVelocity,
            -Math.sin(this.meshChild.rotation.x) * input.forwardVelocity + input.upwardVelocity,
            cosY * cosX * input.forwardVelocity
        );

        return moveVector;
    }

    updateAudioVolume(input) {
        const spaceshipVolumeLevel = mapValue(input.forwardVelocity, 0, PHYSICS_CONSTANTS.maxVelocity, 0, 1);
        if (this.audioManager) {
            this.audioManager.setSpaceshipVolume(spaceshipVolumeLevel);
        }
    }
}

const game = new Game();

let mouseX = 0;
let mouseY = 0;
const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 2;

function handleMouseMove(event) {
    mouseX = event.clientX - centerX;
    mouseY = event.clientY - centerY;
    cursor.style.left = event.pageX + "px";
    cursor.style.top = event.pageY + "px";
}

function handleMouseClick() {
    game.playerShip.createAndShootLight();
}

window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("mousedown", handleMouseClick);
