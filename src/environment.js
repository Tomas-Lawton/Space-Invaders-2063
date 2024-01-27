import * as THREE from "three";
import { generateRadialGradient } from "./gradient.js";

export const environment = (() => {
  class World {
    constructor(params) {
      this.scene = params.scene;
    }

    create() {
      if (this.scene) {
        this.createWorld();
        this.addGround();
        this.createRings();
        this.createRunway();
        this.addLights();
        this.addParticles();
      }
    }

    createWorld() {
      // this.scene.fog = new THREE.FogExp2(0x111111, 0.08);

      const cubeTextureLoader = new THREE.CubeTextureLoader();
      const textureUrls = [
        'public/blue/bkg1_left.png',
        'public/blue/bkg1_right.png',
        'public/blue/bkg1_top.png',
        'public/blue/bkg1_bot.png',
        'public/blue/bkg1_front.png',
        'public/blue/bkg1_back.png'
      ];
      const cubeMap = cubeTextureLoader.load(textureUrls);
      this.scene.background = cubeMap;
    }
    addGround () {
      const groundGeometry = new THREE.PlaneGeometry(35, 35, 35, 35);
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
    createRunway() {
      const glowGeometry2 = new THREE.BoxGeometry(.3, .3, .3);
      const glowMaterial2 = new THREE.MeshStandardMaterial({
        emissive: 0xffffff,
        emissiveIntensity: .35,
        color: 0x111111,
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
    
      let numSquares = 100;
      for (let i = 0; i < numSquares; i++) {
        runwayLights(i * 8);
      }
    }
    addLights() {
      // Adjust the ambient light color and intensity
      const ambientLight = new THREE.AmbientLight(0x333333, 0.5);
      this.scene.add(ambientLight);
    
      // Adjust the first spot light color, position, and intensity
      const spotLight = new THREE.SpotLight(0xff3300, 1, 20, 0.8, 0.5);
      spotLight.position.set(0, 15, 0);
      spotLight.castShadow = true;
      spotLight.shadow.bias = -0.0001;
      this.scene.add(spotLight);
    
      // Adjust the second spot light color, position, and intensity
      const spotLight2 = new THREE.SpotLight(0x0055aa, 1, 20, 0.8, 0.5);
      spotLight2.position.set(0, 15, -15);
      spotLight2.castShadow = true;
      spotLight2.shadow.bias = -0.0001;
      this.scene.add(spotLight2);
    }

    addParticles() {
      const particleCount = 120;
      this.particles = new THREE.Group();
      this.scene.add(this.particles);
      const particleGeometry = new THREE.SphereGeometry(0.03, 6, 6);

      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        emissive: 0x00aaff,
        emissiveIntensity: 0.8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2,
      });

      for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(
          Math.random() * 20 - 10,
          Math.random() * 10,
          Math.random() * 20 - 10
        );
        this.particles.add(particle);

        this.animateParticle(particle);
      }
    }

    animateParticle(particle) {
      const animationSpeed = 0.0006;
      const initialPosition = particle.position.clone();
      particle.userData.animationOffset = Math.random() * Math.PI * 2;
      particle.onBeforeRender = () => {
        const time =
          performance.now() * animationSpeed + particle.userData.animationOffset;
        particle.position.x = initialPosition.x + Math.sin(time) * 1;
        particle.position.y = initialPosition.y + Math.sin(time * 2) * 0.5;
        particle.position.z = initialPosition.z + Math.sin(time * 3) * 1;
      };
      this.animateFlicker(particle.material);
    }

    animateFlicker(material) {
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
  }

  return {
    World: World,
  };
})();
