import * as THREE from "three";
import CameraControls from "camera-controls";
import axios from "axios";
import parseJSON, { findThreeJSJSON } from "../utils/parse-json";
import * as uuid from "uuid";
import * as RX from "rxjs";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer";

CameraControls.install({ THREE });

export type ViewerStatus = "loading" | "error" | "idle";

class Viewer {
  public id: string;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  private _renderer: THREE.WebGLRenderer;
  private _cameraControl: CameraControls;
  private _renderNeeded = true;
  private _clock = new THREE.Clock();

  private _labelRenderer: CSS2DRenderer;

  public model: THREE.Object3D | undefined;

  public status = new RX.BehaviorSubject<ViewerStatus>("idle");

  constructor(container: HTMLDivElement) {
    this.id = uuid.v4();

    console.log("init viewer", this.id);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#333333");
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.camera.position.set(10, 10, 10);

    this._renderer = new THREE.WebGLRenderer();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this._labelRenderer = new CSS2DRenderer();
    this._labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this._labelRenderer.domElement.style.position = "absolute";
    this._labelRenderer.domElement.style.top = "0px";
    container.appendChild(this._labelRenderer.domElement);

    container.appendChild(this._renderer.domElement);

    this._cameraControl = new CameraControls(
      this.camera,
      this._renderer.domElement
    );

    this._cameraControl.dollyToCursor = true;
    this._cameraControl.dollySpeed = 0.4;
    this._cameraControl.draggingSmoothTime = 0;
    this._cameraControl.smoothTime = 0;
    this._cameraControl.mouseButtons.right = CameraControls.ACTION.ROTATE;
    this._cameraControl.mouseButtons.left = CameraControls.ACTION.NONE;

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    this.scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);

    window.addEventListener("resize", this.resize);

    this.loadModel().then((object3d) => {
      if (object3d) {
        object3d.rotateX(-Math.PI / 2);
        this.scene.add(object3d);
        const boundingBox = new THREE.Box3().setFromObject(object3d);
        this._cameraControl.fitToBox(boundingBox, false);
        this.model = object3d;
        this.status.next("idle");
      }
    });

    this.updateViewer();
  }

  public updateViewer() {
    this._renderNeeded = true;
    this._render();
  }

  private resize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderNeeded = true;
    this.updateViewer();
  };

  private _render = () => {
    const clockDelta = this._clock.getDelta();
    const hasControlsUpdated = this._cameraControl.update(clockDelta);

    if (hasControlsUpdated || this._renderNeeded) {
      this._renderer.render(this.scene, this.camera);
      this._labelRenderer.render(this.scene, this.camera);
      this.optimizeLabels();
      this._renderNeeded = false;
    }
    window.requestAnimationFrame(this._render);
  };

  private optimizeLabels = () => {
    const labels = Array.from(
      document.getElementsByClassName("label")
    ) as HTMLElement[];
    const visibleRects: DOMRect[] = [];

    labels.forEach((label) => {
      label.style.visibility = "visible";
      const rect = label.getBoundingClientRect();

      for (const otherRect of visibleRects) {
        if (this.rectsOverlap(rect, otherRect)) {
          label.style.visibility = "hidden";
          break;
        }
      }

      if (label.style.visibility === "visible") {
        visibleRects.push(rect);
      }
    });
  };

  private rectsOverlap(rect1: DOMRect, rect2: DOMRect): boolean {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  }

  private async loadModel() {
    this.status.next("loading");

    try {
      const modelUrl =
        "https://storage.yandexcloud.net/lahta.contextmachine.online/files/pretty_ceiling_props.json";

      const response = await axios.get(modelUrl, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      const data = response.data;

      const jsonObject = findThreeJSJSON(data);
      if (jsonObject) {
        const object3d = await parseJSON(jsonObject);
        // Assign property values
        this.assignPropertyValues(object3d);

        return object3d;
      }
    } catch {
      this.status.next("error");
      throw new Error("Failed to load model");
    }
  }

  /**
   * Traverses all child objects in the model and assigns a propertyValue.
   */
  /**
   * Traverses all child objects in the model and assigns an AEC installation progress status.
   */
  private assignPropertyValues(object: THREE.Object3D) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const progressStatuses: Record<number, string> = {
          1: "Not Started",
          2: "In Progress",
          3: "Partially Installed",
          4: "Installed",
        };

        const statusIndex: number = (child.id % 4) + 1;
        child.userData.propertyValue = {
          statusCode: statusIndex,
          statusText: progressStatuses[statusIndex],
        };

        const div = document.createElement("div");
        div.className = "label";
        div.textContent = child.userData.propertyValue.statusText;
        div.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        div.style.color = "#fff";
        div.style.padding = "2px 4px";
        div.style.borderRadius = "4px";
        div.style.fontSize = "12px";

        const label = new CSS2DObject(div);
        label.position.set(0, 1, 0);
        child.add(label);
      }
    });
    console.log("Updated Model with Installation Progress:", object);
  }

  public dispose() {
    // console.log("dispose viewer", this.id);
    window.removeEventListener("resize", this.resize);
    this._renderer.domElement.remove();
    this._renderer.dispose();
    this._cameraControl.dispose();
    this.scene.clear();
    this._renderNeeded = false;
  }
}

export default Viewer;
