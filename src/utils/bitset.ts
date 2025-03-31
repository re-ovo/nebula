/**
 * A bitset implementation that supports arbitrary number of bits with auto-expansion
 *
 * Example:
 * ```ts
 * const bits = new Bitset(100); // Create bitset with initial capacity of 100 bits
 * bits.set(5);    // Set bit at position 5
 * bits.test(5);   // Returns true
 * bits.clear(5);  // Clear bit at position 5
 * bits.test(5);   // Returns false
 * bits.toggle(5); // Toggle bit at position 5
 * bits.set(200);  // Automatically expands to accommodate bit at position 200
 * ```
 */
export class Bitset {
  private bits: Uint32Array;
  private capacity: number;

  /**
   * Create a new bitset with the specified initial capacity
   * @param initialCapacity Initial number of bits to store
   */
  constructor(initialCapacity: number = 32) {
    // Calculate number of Uint32 elements needed
    const numInts = Math.ceil(initialCapacity / 32);
    this.bits = new Uint32Array(numInts);
    this.capacity = numInts * 32;
  }

  static fromArray(array: number[]): Bitset {
    const bitset = new Bitset(array.length);
    for (let i = 0; i < array.length; i++) {
      bitset.set(array[i]);
    }
    return bitset;
  }

  /**
   * Get the number of bits in the bitset
   * @returns The number of bits in the bitset
   */
  get length(): number {
    return this.bits.length * 32;
  }

  /**
   * Ensures the bitset has enough capacity to store bits up to the given position
   * @param pos Position that needs to be accessible
   */
  private ensureCapacity(pos: number): void {
    if (pos >= this.capacity) {
      // Calculate new size (double the size until it's big enough)
      let newSize = this.capacity;
      while (newSize <= pos) {
        newSize *= 2;
      }

      // Create new array and copy old values
      const newBits = new Uint32Array(Math.ceil(newSize / 32));
      newBits.set(this.bits);

      // Update instance variables
      this.bits = newBits;
      this.capacity = newBits.length * 32;
    }
  }

  /**
   * Set a bit at the specified position
   * @param pos Bit position to set
   */
  set(pos: number): void {
    if (pos < 0) throw new Error("Bit position must be non-negative");
    this.ensureCapacity(pos);
    const idx = Math.floor(pos / 32);
    const bit = pos % 32;
    this.bits[idx] |= 1 << bit;
  }

  /**
   * Clear a bit at the specified position
   * @param pos Bit position to clear
   */
  clear(pos: number): void {
    if (pos < 0) throw new Error("Bit position must be non-negative");
    if (pos >= this.capacity) return; // If beyond capacity, bit is already 0
    const idx = Math.floor(pos / 32);
    const bit = pos % 32;
    this.bits[idx] &= ~(1 << bit);
  }

  /**
   * Test if a bit is set at the specified position
   * @param pos Bit position to test
   * @returns True if the bit is set, false otherwise
   */
  test(pos: number): boolean {
    if (pos < 0) throw new Error("Bit position must be non-negative");
    if (pos >= this.capacity) return false; // If beyond capacity, bit is 0
    const idx = Math.floor(pos / 32);
    const bit = pos % 32;
    return (this.bits[idx] & (1 << bit)) !== 0;
  }

  /**
   * Toggle a bit at the specified position
   * @param pos Bit position to toggle
   */
  toggle(pos: number): void {
    if (pos < 0) throw new Error("Bit position must be non-negative");
    this.ensureCapacity(pos);
    const idx = Math.floor(pos / 32);
    const bit = pos % 32;
    this.bits[idx] ^= 1 << bit;
  }

  /**
   * Clear all bits
   */
  clearAll(): void {
    this.bits.fill(0);
  }

  /**
   * Set all bits
   */
  setAll(): void {
    this.bits.fill(0xffffffff);
  }

  /**
   * Get number of bits that are set to 1
   */
  popCount(): number {
    let count = 0;
    for (let i = 0; i < this.bits.length; i++) {
      count += this.countBits(this.bits[i]);
    }
    return count;
  }

  private countBits(n: number): number {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
    n = (n + (n >> 4)) & 0x0f0f0f0f;
    n = n + (n >> 8);
    n = n + (n >> 16);
    return n & 0x3f;
  }

  /**
   * Compare two Bitsets for equality
   * @param other The Bitset to compare with
   * @returns true if equal, false otherwise
   */
  equals(other: Bitset): boolean {
    // Compare the effective bits rather than just array length
    const maxLength = Math.max(this.bits.length, other.bits.length);

    for (let i = 0; i < maxLength; i++) {
      const thisBit = i < this.bits.length ? this.bits[i] : 0;
      const otherBit = i < other.bits.length ? other.bits[i] : 0;

      if (thisBit !== otherBit) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert the bitset to an array of numbers
   *
   * Example:
   * ```ts
   * const bits = new Bitset(100);
   * bits.set(5);
   * bits.set(10);
   * bits.toArray(); // [5, 10]
   * ```
   * @returns Array of numbers
   */
  toArray(): number[] {
    const result: number[] = [];
    for (let i = 0; i < this.bits.length; i++) {
      for (let j = 0; j < 32; j++) {
        if (this.test(i * 32 + j)) {
          result.push(i * 32 + j);
        }
      }
    }
    return result;
  }

  /**
   * Convert the bitset to a hexadecimal string representation
   * @returns Hexadecimal string representation of the bitset
   */
  toString(): string {
    let result = "";
    for (let i = 0; i < this.bits.length; i++) {
      // Convert each 32-bit integer to a hexadecimal string
      // padStart ensures each value is represented by 8 hex digits (4 bits per hex digit)
      const hexValue = this.bits[i].toString(16).padStart(8, "0");
      result = hexValue + result; // Prepend to maintain bit order
    }
    return result;
  }

  /**
   * Get the current capacity of the bitset in bits
   * @returns The current capacity in bits
   */
  getCapacity(): number {
    return this.capacity;
  }
}
