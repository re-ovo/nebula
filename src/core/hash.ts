const FNV_PRIME = 0x01000193;
const FNV_OFFSET_BASIS = 0x811c9dc5;

function hash(value: number, prev: number = FNV_OFFSET_BASIS): number {
  prev ^= value;
  prev *= FNV_PRIME;
  return prev;
}

function hashString(str: string, prev: number = FNV_OFFSET_BASIS): number {
  for (let i = 0; i < str.length; i++) {
    prev = hash(str.charCodeAt(i), prev);
  }
  return prev;
}

export { hash, hashString };
