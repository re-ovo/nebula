import { Component } from "../component";
import { Material } from "../material/material";
import { Mesh } from "./mesh";

export class MeshRenderer extends Component {
  private _mesh: Mesh | null = null;
  private _material: Material | null = null;

  get mesh(): Mesh | null {
    return this._mesh;
  }

  get material(): Material | null {
    return this._material;
  }

  set mesh(mesh: Mesh) {
    this._mesh = mesh;
  }

  set material(material: Material) {
    this._material = material;
  }
}
