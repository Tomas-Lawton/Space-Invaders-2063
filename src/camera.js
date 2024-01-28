import * as THREE from "three";
import { entity } from './entity.js';

export const third_person_camera = (() => {
  
  class ThirdPersonCamera extends entity.Component {
    constructor(params) {
      super();
      this._params = params;
      this._camera = params.camera;
      this._currentPosition = new THREE.Vector3();
      this._currentLookat = new THREE.Vector3();
      this._lerpFactor = 0.1; // Adjust the lerp factor for the desired easing effect
    }

    _CalculateIdealOffset() {
      const idealOffset = new THREE.Vector3(0, 3, -10);
      idealOffset.applyQuaternion(this._params.target.quaternion);
      idealOffset.add(this._params.target.position);
      return idealOffset;
    }

    _CalculateIdealLookat() {
      const idealLookat = new THREE.Vector3(0, 2, 30);
      idealLookat.applyQuaternion(this._params.target.quaternion);
      idealLookat.add(this._params.target.position);
      return idealLookat;
    }

    Update(timeElapsed) {
      const idealOffset = this._CalculateIdealOffset();
      const idealLookat = this._CalculateIdealLookat();

      // Use lerp for smoothing the transition
      this._currentPosition.lerp(idealOffset, this._lerpFactor);
      this._currentLookat.lerp(idealLookat, this._lerpFactor);

      this._camera.position.copy(this._currentPosition);
      this._camera.lookAt(this._currentLookat);
    }
  }

  return {
    ThirdPersonCamera: ThirdPersonCamera
  };

})();
