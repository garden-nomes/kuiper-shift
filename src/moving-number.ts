export default class MovingNumber {
  value: number;
  private _displayValue: number;

  constructor(value: number, private speed: number) {
    this.value = value;
    this._displayValue = value;
  }

  get displayValue() {
    return this._displayValue;
  }

  get isMoving() {
    return this.displayValue !== this.value;
  }

  update() {
    if (this._displayValue < this.value) {
      this._displayValue += p.deltaTime * this.speed;
      this._displayValue = Math.min(this._displayValue, this.value);
    } else if (this._displayValue > this.value) {
      this._displayValue -= p.deltaTime * this.speed;
      this._displayValue = Math.max(this._displayValue, this.value);
    }
  }
}
