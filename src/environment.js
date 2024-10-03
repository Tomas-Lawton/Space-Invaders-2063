import * as THREE from "three";
import { Particle } from "./Particle.js";
import { Ring } from "./Ring.js";

export const environment = (() => {
  class World {
    constructor(params) {
      this.scene = params.scene;
      this.rings = [];
      this.particles = [];

    }

    create() {
      if (this.scene) {
        this.createWorld();
        this.createStarfield();
        this.createRunway();
       
        this.addGround();
        this.createRings();
        this.addLights();
        this.createStar();
        this.addParticles();
        this.createLoops();
      }
    }

    createWorld() {
      // this.scene.fog = new THREE.Fog(0x111111, 0.005);
      this.scene.fog = new THREE.Fog(0x8090F, 0.5);


      // this.scene.fog = new THREE.FogExp2(0xffffff, 0.001); // Change color and density as needed
      // const textureLoader = new THREE.TextureLoader();
      // const cloudTexture = textureLoader.load('./sprite/cloudy.jpg');
      // const geometry = new THREE.PlaneGeometry(100, 100); // Size of the plane
      // const material = new THREE.MeshBasicMaterial({
      //     map: cloudTexture,
      //     transparent: true,
      //     opacity: 0.5 // Adjust opacity for desired effect
      // });
      // const cloudPlane = new THREE.Mesh(geometry, material);
      // cloudPlane.rotation.x = -Math.PI / 2; // Rotate to lie flat
      // this.scene.add(cloudPlane);

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
      // this.scene.background = new THREE.Color( 0x08090F );

    }
    createStarfield() {
      const starCount = 6000;
      const starPositions = new Float32Array(starCount * 3); // 3 coordinates for each star (x, y, z)
      const velocities = new Float32Array(starCount * 3); // 3 velocities for each star (vx, vy, vz)
      const accelerations = new Float32Array(starCount * 3); // 3 accelerations for each star (ax, ay, az)
    
      // Initialize star positions, velocities, and accelerations
      for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = Math.random() * 600 - 300; // x
        starPositions[i * 3 + 1] = Math.random() * 600 - 300; // y
        starPositions[i * 3 + 2] = Math.random() * 600 - 300; // z
    
        // Set random initial velocities for each star (can be adjusted)
        velocities[i * 3] = (Math.random() - 0.5) * 0.02; // vx
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02; // vy
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // vz
    
        // Set a small constant acceleration for each axis (can be adjusted)
        accelerations[i * 3] = 0.0001; // ax
        accelerations[i * 3 + 1] = 0.0001; // ay
        accelerations[i * 3 + 2] = 0.0001; // az
      }
    
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load('public/sprite/star.png', (texture) => {
        const starMaterial = new THREE.PointsMaterial({
          color: 0xaaaaaa,
          size: 0.7,
          map: texture,
          transparent: true,
          depthWrite: false,
        });
    
        const stars = new THREE.Points(starGeo, starMaterial);
        this.scene.add(stars);
    
        const animateStars = () => {
          for (let i = 0; i < starCount; i++) {
            // Update velocities with acceleration
            velocities[i * 3] += accelerations[i * 3]; // vx
            velocities[i * 3 + 1] += accelerations[i * 3 + 1]; // vy
            velocities[i * 3 + 2] += accelerations[i * 3 + 2]; // vz
    
            // Update positions based on velocities
            starPositions[i * 3] += velocities[i * 3]; // Update x
            starPositions[i * 3 + 1] += velocities[i * 3 + 1]; // Update y
            starPositions[i * 3 + 2] += velocities[i * 3 + 2]; // Update z
    
            // Reset position if star goes out of bounds
            if (starPositions[i * 3 + 1] < -200) {
              starPositions[i * 3 + 1] = 200;
              velocities[i * 3 + 1] = 0; // Reset vertical velocity
            }
          }
    
          starGeo.attributes.position.needsUpdate = true;
          // stars.rotation.z += 0.0000001;
    
          requestAnimationFrame(animateStars);
        };
    
        animateStars();
      });
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

    addParticles() {
      const particleCount = 120;
      for (let i = 0; i < particleCount; i++) {
        const position = new THREE.Vector3(
          Math.random() * 20 - 10,
          Math.random() * 10,
          Math.random() * 20 - 10
        );
        const particle = new Particle(this.scene, position);
        this.particles.push(particle);
      }
    }
  }

  return {
    World: World,
  };
})();
