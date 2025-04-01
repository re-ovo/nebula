export class Clock {
  private _previousTime: number;
  private _deltaTime: number;

  constructor() {
    this._previousTime = performance.now();
    this._deltaTime = 0;
  }

  update() {
    const currentTime = performance.now();
    this._deltaTime = (currentTime - this._previousTime) / 1000;
    this._previousTime = currentTime;
  }

  get deltaTime() {
    return this._deltaTime;
  }
}
