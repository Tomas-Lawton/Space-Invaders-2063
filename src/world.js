import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { Particle } from "./Particle.js";
import { Ring } from "./Ring.js";
import { asteroids } from "./asteroids.js"
import { planets } from "./planets.js"

//  MAKE EVERYTHING PROCEDURAL AROUND THE USER
export const gameworld = (() => {
  class World {
    constructor(params) {
      this.scene = params.scene;
      this.rings = [];
    }
    addElements() {
      if (this.scene) {
        const softLight = new THREE.AmbientLight(0xffffff, .2);
        softLight.position.set(0, 0, 0);
        this.scene.add(softLight)

        this.createWorld();
        // this.createStarfield(2000); //procedural
        this.createAsteroidSystems(10); //procedural
        // this.createPlanets(4); //procedural
        // this.createStar();

        // this.createRunway();       
        // this.addGround();
        // this.createRings();
        // this.addLights();
        // this.createLoops();
      }
    }
    Update(timeElapsed, playerShip, audioManager) {
      if (this.asteroidLoader) {
        this.asteroidLoader.animateAsteroids(playerShip, this.repositionObj);
      }

      if (this.planetLoader) {
        this.planetLoader.animatePlanets(playerShip, this.repositionObj)
      }

      this.animateStars(playerShip);

      // this.rings.forEach((ring) => {
      //   ring.update();
      //   if (ring.checkCollisionWithRing(playerShip.mesh)) {
      //     console.log("Collision detected! Playing sound.");
      //     audioManager.playNextSound();
      //   }
      // });

      this.scene.backgroundRotation.y += 0.0001

    }
    async createPlanets(planetNum) {
      const planetsLoader = new planets.PlanetLoader(this.scene)
      planetsLoader.initialisePlanets(planetNum)
      this.planetLoader = planetsLoader
  }
  
    async createAsteroidSystems(systems) {
      const modelPaths = [
        'public/asteroid_models/plane/',
        'public/asteroid_models/iron/',
        'public/asteroid_models/gold/',
        'public/asteroid_models/crystal/',
      ];
      const asteroidLoader = new asteroids.AsteroidLoader(this.scene, modelPaths);
      await asteroidLoader.initialiseSystem(systems); 
      console.log("Loaded Asteroid Systems.")
      this.asteroidLoader = asteroidLoader
  }

    createWorld() {
      const cubeTextureLoader = new THREE.CubeTextureLoader();
      const textureUrls = [
        'public/blue/bkg1_right.png',  // right
        'public/blue/bkg1_left.png',   // left
        'public/blue/bkg1_top.png',    // top
        'public/blue/bkg1_bot.png',    // bottom
        'public/blue/bkg1_front.png',  // front
        'public/blue/bkg1_back.png'    // back
      ];
      const cubeMap = cubeTextureLoader.load(textureUrls);
      this.scene.background = cubeMap;
      this.scene.backgroundRotation = new THREE.Euler(0, 0, 0);

    }

    createStarfield(starCount) {
      this.starCount = starCount; // Initial star count
      this.starPositions = new Float32Array(this.starCount * 3);
      this.velocities = new Float32Array(this.starCount * 3);
      this.accelerations = new Float32Array(this.starCount * 3);
    
      for (let i = 0; i < this.starCount; i++) {
        this.starPositions[i * 3] = Math.random() * 600 - 300; // x
        this.starPositions[i * 3 + 1] = Math.random() * 600 - 300; // y
        this.starPositions[i * 3 + 2] = Math.random() * 600 - 300; // z

        // Set a coefficient for slight directionality
        const directionCoefficient = .8; // Adjust this value to change the directionality

        // Set initial velocities with slight directionality
        this.velocities[i * 3] = (Math.random() - 0.5) * .01; // vx
        this.velocities[i * 3 + 1] = (Math.random() - 0.5) * .01; // vy
        this.velocities[i * 3 + 2] = (Math.random() - 0.5) * .08 - directionCoefficient; // vz

        // Set small constant acceleration (optional)
        this.accelerations[i * 3] = 0.001; // ax
        this.accelerations[i * 3 + 1] = 0.001; // ay
        this.accelerations[i * 3 + 2] = 0.001; // az
      }

      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(this.starPositions, 3));

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load('public/sprite/star.png', (texture) => {
        const starMaterial = new THREE.PointsMaterial({
          color: 0xaaaaaa,
          size: 0.4,
          map: texture,
          opacity: .5,
          transparent: true,
          depthWrite: false,
        });

        this.stars = new THREE.Points(starGeo, starMaterial);
        this.scene.add(this.stars);
        this.stars.frustumCulled = false;
      });
    
    }
    animateStars(playerShip) {
      if (this.stars && this.starPositions && this.starPositions){
        const userPosition = playerShip.mesh.position

        for (let i = 0; i < this.starCount; i++) {
          const index = i * 3;
  
          this.starPositions[index] += this.velocities[index];
          this.starPositions[index + 1] += this.velocities[index + 1];
          this.starPositions[index + 2] += this.velocities[index + 2];
  
          const distance = this.calculateDistanceArr(userPosition, this.starPositions, i);
          if (distance > 200) { 
            this.reposition(i, userPosition);
          }
        }
  
        this.stars.geometry.attributes.position.needsUpdate = true;
      }
    
    }

    calculateDistanceArr(userPosition, obj, index) {
      const dx = obj[index * 3] - userPosition.x;
      const dy = obj[index * 3 + 1] - userPosition.y;
      const dz = obj[index * 3 + 2] - userPosition.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  repositionObj(obj1Position, obj2Position) {
    obj1Position.x = obj2Position.x + (Math.random() * 600 - 300); // New x position
    obj1Position.y = obj2Position.y + (Math.random() * 600 - 300); // New y position
    obj1Position.z = obj2Position.z + (Math.random() * 600 - 300); // New z position
  }

  reposition(index, userPosition) {
    this.starPositions[index * 3] = userPosition.x + (Math.random() * 600 - 300); // New x
    this.starPositions[index * 3 + 1] = userPosition.y + (Math.random() * 600 - 300); // New y
    this.starPositions[index * 3 + 2] = userPosition.z + (Math.random() * 600 - 300); // New z
}




    addGround () {

      
    const r = 20;
    const segments = 64; // You can adjust the number of segments for a smoother circle
    const groundMesh = new THREE.Mesh( new THREE.CircleGeometry( r, segments ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: false } ) );
    groundMesh.rotation.x = - Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.scene.add( groundMesh );

      // const groundGeometry = new THREE.CircleGeometry(groundRadius, groundSegments);
      // groundGeometry.rotateX(-Math.PI / 2);
      // const groundMaterial = new THREE.MeshStandardMaterial({
      //   color: 0x111111,
      //   metalness: 0.8,
      //   roughness: 0.5,
      //   side: THREE.DoubleSide,
      // });
      
      // const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
      // groundMesh.castShadow = false;
      // groundMesh.receiveShadow = true;
      
      this.scene.add(groundMesh);
    }
    createRings() {
      const glowGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const glowMaterial = new THREE.MeshStandardMaterial({
        emissive: 0xff6600, 
        emissiveIntensity: 3,
        color: 0x777777,
      });
    
      const generateRingPoints = (radius, pointCount, h) => {
        for (let i = 0; i < pointCount; i++) {
          const angle = (Math.PI * 2 * i) / pointCount;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);
          const glowPoint = new THREE.Mesh(glowGeometry, glowMaterial);
          glowPoint.position.set(x, 0, y);
          this.scene.add(glowPoint);
        }
      };
    
      let numRings = 5;
      let r = 4;
      for (let i = 0; i < numRings; i++) {
        generateRingPoints(i * r, i * 10, i);
      }
    }
    createStar() {
      const posZ = 0;
      const posY = 350;


      const sphereRadius = 13;
      const sphereSegments = 32;
      const transparentMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        metalness: 0.8,
        emissive: 0xff6600, 
        emissiveIntensity: 50,

        roughness: 0.5,
        opacity: 0.5,
        transparent: true,
        side: THREE.BackSide,  // Render the outside of the sphere
      });
      const sphereGeometry = new THREE.SphereGeometry(sphereRadius, sphereSegments, sphereSegments);
      const sphereMesh = new THREE.Mesh(sphereGeometry, transparentMaterial);
    
      sphereMesh.rotation.x = -Math.PI / 2;
      sphereMesh.position.z = posY;
      this.scene.add(sphereMesh);

      const glowGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const glowMaterial = new THREE.MeshStandardMaterial({
        emissive: 0xff6600, 
        emissiveIntensity: 3,
        color: 0x777777,
      });
    
      const generateRingPoints = (radius, pointCount, h) => {
        for (let i = 0; i < pointCount; i++) {
          const angle = (Math.PI * 2 * i) / pointCount;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);
          const glowPoint = new THREE.Mesh(glowGeometry, glowMaterial);
          glowPoint.position.set(x, 0, y+posY);
          this.scene.add(glowPoint);
        }
      };
    
      let numRings = 6;
      let r = 10; //4
      for (let i = 0; i < numRings; i++) {
        generateRingPoints(i * r, i * 30, i);
      }
    }
    createRunway() {
      const glowGeometry2 = new THREE.BoxGeometry(.3, .3, .3);
      const glowMaterial2 = new THREE.MeshStandardMaterial({
        emissive: 0xee7d11,
        emissiveIntensity: .8,
        color: 0xff6200,
      });
    
      const runwayLights = (yOff) => {
        const glowMesh1 = new THREE.Mesh(glowGeometry2, glowMaterial2);
        const glowMesh2 = new THREE.Mesh(glowGeometry2, glowMaterial2);
        const glowMesh3 = new THREE.Mesh(glowGeometry2, glowMaterial2);
        const glowMesh4 = new THREE.Mesh(glowGeometry2, glowMaterial2);
        glowMesh1.position.set(2, 0, -2 + yOff);
        glowMesh2.position.set(-2, 0, -2 + yOff);
        glowMesh3.position.set(2, 0, 2 + yOff);
        glowMesh4.position.set(-2, 0, 2 + yOff);
        const glowMeshArray = [glowMesh1, glowMesh2, glowMesh3, glowMesh4];
        this.scene.add(...glowMeshArray);
      };
    
      let numSquares = 40;
      for (let i = 0; i < numSquares; i++) {
        runwayLights(i * 8);
      }
    }
    addLights() {
      const ambientLight = new THREE.AmbientLight(0x333333, 0.5);
      this.scene.add(ambientLight);
    
      const spotLight = new THREE.SpotLight(0xff3300, 1, 20, 0.8, 0.5);
      spotLight.position.set(0, 15, 0);
      spotLight.castShadow = true;
      spotLight.shadow.bias = -0.0001;
      this.scene.add(spotLight);
    
      const spotLight2 = new THREE.SpotLight(0x0055aa, 1, 20, 0.8, 0.5);
      spotLight2.position.set(0, 15, -15);
      spotLight2.castShadow = true;
      spotLight2.shadow.bias = -0.0001;
      this.scene.add(spotLight2);
    }

    createLoops() {
      const numRings = 10 
      for (let i = 0; i < numRings; i++) {
        const ring = new Ring(this.scene);
        this.rings.push(ring);
      }
      const animateAll = () => {
        for (const ring of this.rings) {
          ring.animate();
        }
        requestAnimationFrame(animateAll);
      };
      animateAll();
    }
  }

  return {
    World: World,
  };
})();
