import * as THREE from "three";

export class Ring {
  constructor(scene) {
    this.scene = scene;
    this.radius = Math.random() * 50 + 10; // Set the radius property
    this.ring = this.createRing();
    this.speed = this.generateRandomSpeed();
    this.isColliding = false;

    this.invisibleMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    this.invisibleCircle = this.createInvisibleCircle();
  }

  createRing() {
    const tubeRadius = 0.1;
    const radialSegments = 32;
    const tubularSegments = 32;
    const materialColor = Math.random() * 0xffffff;

    const glowMaterial = new THREE.MeshStandardMaterial({
      emissive: materialColor,
      emissiveIntensity: 10, // Reduced emissive intensity
      color: materialColor,
      roughness: 0.5,
      metalness: 0.5,
    });

    const ringGeometry = new THREE.TorusGeometry(this.radius, tubeRadius, radialSegments, tubularSegments);
    const ring = new THREE.Mesh(ringGeometry, glowMaterial);

    ring.position.set(
      Math.random() * 500 - 250,
      Math.random() * 500 - 250,
      Math.random() * 500 - 250
    );

    this.scene.add(ring);
    return ring;
  }

  createInvisibleCircle() {
    const invisibleCircleGeometry = new THREE.CircleGeometry(this.radius, 32);
    const invisibleCircle = new THREE.Mesh(invisibleCircleGeometry, this.invisibleMaterial);
    invisibleCircle.position.copy(this.ring.position);
    this.scene.add(invisibleCircle);
    return invisibleCircle;
  }

  generateRandomSpeed() {
    return {
      x: Math.random() * 0.02 - 0.01,
      y: Math.random() * 0.02 - 0.01,
      z: Math.random() * 0.02 - 0.01,
    };
  }

  animate() {
    this.ring.rotation.x += this.speed.x;
    // this.ring.rotation.y += this.speed.y;
    // this.ring.rotation.z += this.speed.z;
  }

  checkCollisionWithRing(object) {
    if (object && object.position) {
      const objectPosition = object.position.clone();
      const ringWorldMatrix = this.ring.matrixWorld.clone();
      const ringInverseMatrix = new THREE.Matrix4();
      ringInverseMatrix.copy(ringWorldMatrix).invert();
      objectPosition.applyMatrix4(ringInverseMatrix);
  
      // Apply rotation to align with the ring's rotation
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationFromEuler(this.ring.rotation);
      objectPosition.applyMatrix4(rotationMatrix);
  
      objectPosition.y = 0;
      const distanceToCenter = new THREE.Vector2(objectPosition.x, objectPosition.z).length();
  
      if (distanceToCenter < this.radius && !this.isColliding) {
        this.isColliding = true;
        this.invisibleMaterial.opacity = .5; 
        return false
      } else if (distanceToCenter >= this.radius && this.isColliding) {
        this.isColliding = false;
        this.invisibleMaterial.opacity = 0;
        return true
      }
      return false
    }
  }


}
