/**
 * A bitset implementation that supports arbitrary number of bits
 *
 * Example:
 * ```ts
 * const bits = new Bitset(100); // Create bitset with 100 bits
 * bits.set(5);    // Set bit at position 5
 * bits.test(5);   // Returns true
 * bits.clear(5);  // Clear bit at position 5
 * bits.test(5);   // Returns false
 * bits.toggle(5); // Toggle bit at position 5
 * ```
 */
export class Bitset {
  private bits: Uint32Array;

  /**
   * Create a new bitset with the specified number of bits
   * @param numBits Number of bits to store
   */
  constructor(numBits: number) {
    // Calculate number of Uint32 elements needed
    const numInts = Math.ceil(numBits / 32);
    this.bits = new Uint32Array(numInts);
  }

  /**
   * Set a bit at the specified position
   * @param pos Bit position to set
   */
  set(pos: number): void {
    const idx = Math.floor(pos / 32);
    const bit = pos % 32;
    this.bits[idx] |= 1 << bit;
  }

  /**
   * Clear a bit at the specified position
   * @param pos Bit position to clear
   */
  clear(pos: number): void {
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
    const idx = Math.floor(pos / 32);
    const bit = pos % 32;
    return (this.bits[idx] & (1 << bit)) !== 0;
  }

  /**
   * Toggle a bit at the specified position
   * @param pos Bit position to toggle
   */
  toggle(pos: number): void {
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
}
