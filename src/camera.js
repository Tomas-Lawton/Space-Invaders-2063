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
    }

    _CalculateIdealOffset() {
      const idealOffset = new THREE.Vector3(0, 3, -15);
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

      this._currentPosition.copy(idealOffset);
      this._currentLookat.copy(idealLookat);
      this._camera.position.copy(this._currentPosition);
      this._camera.lookAt(this._currentLookat);
    }
  }

  return {
    ThirdPersonCamera: ThirdPersonCamera
  };

})();