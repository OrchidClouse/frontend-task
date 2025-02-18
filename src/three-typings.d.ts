declare module "three/examples/jsm/renderers/CSS2DRenderer" {
  import * as THREE from "three";

  export class CSS2DRenderer {
    domElement: HTMLElement;
    setSize(width: number, height: number): void;
    render(scene: THREE.Scene, camera: THREE.Camera): void;
  }

  export class CSS2DObject extends THREE.Object3D {
    constructor(element: HTMLElement);
  }
}
