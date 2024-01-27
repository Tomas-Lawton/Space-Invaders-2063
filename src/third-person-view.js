import * as THREE from 'three';

export class ThirdPersonCamera {
  constructor(params) {
    this.camera = params.camera;
    this.target = params.target;

    // Define a fixed distance behind the spaceship
    this.cameraDistance = 15;

    this.cameraOffset = new THREE.Vector3(0, 5, -this.cameraDistance);

    this.camera.rotation.y = this.target.rotation.y;

    this.camera.position.copy(this.calculateCameraPosition());
    this.camera.lookAt(this.target.position);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  calculateCameraPosition() {
    const position = new THREE.Vector3();

    // Use the target's position and add the offset based on rotation
    const offset = this.cameraOffset.clone().applyQuaternion(this.target.quaternion);
    position.copy(this.target.position).add(offset);

    return position;
  }

  update() {
    const newPosition = this.calculateCameraPosition();
    
    // Lerp for smooth camera movement
    this.camera.position.lerp(newPosition, 0.1);

    // Adjust camera rotation to face the same direction as the target
    this.camera.rotation.y = this.target.rotation.y;

    // Always face the same direction as the target
    this.camera.lookAt(this.target.position);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}