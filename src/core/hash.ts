const FNV_PRIME = 0x01000193;
const FNV_OFFSET_BASIS = 0x811c9dc5;

function hash(value: number, state: number = FNV_OFFSET_BASIS): number {
  state ^= value;
  state *= FNV_PRIME;
  return state;
}

function hashString(str: string, state: number = FNV_OFFSET_BASIS): number {
  for (let i = 0; i < str.length; i++) {
    state = hash(str.charCodeAt(i), state);
  }
  return state;
}

function hashNumber(num: number, state: number = FNV_OFFSET_BASIS): number {
  return hash(num, state);
}

function hashNumbers(
  numbers:
    | number[]
    | Uint8Array
    | Uint16Array
    | Uint32Array
    | Int8Array
    | Int16Array
    | Int32Array
    | Float32Array
    | Float64Array,
  state: number = FNV_OFFSET_BASIS,
): number {
  for (let i = 0; i < numbers.length; i++) {
    state = hash(numbers[i], state);
  }
  return state;
}

function hashBoolean(bool: boolean, state: number = FNV_OFFSET_BASIS): number {
  return hash(bool ? 1 : 0, state);
}

export { hash, hashString, hashNumber, hashNumbers, hashBoolean };
