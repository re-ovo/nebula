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

function hashObject(
  obj: Record<string, unknown>,
  state: number = FNV_OFFSET_BASIS,
): number {
  // 对对象的键进行排序，确保相同对象但键顺序不同时哈希值相同
  const keys = Object.keys(obj).sort();

  // 先哈希键的数量
  state = hashNumber(keys.length, state);

  // 对每个键和对应的值进行哈希
  for (const key of keys) {
    // 哈希键
    state = hashString(key, state);

    // 根据值的类型选择合适的哈希方法
    const value = obj[key];
    if (value === null || value === undefined) {
      state = hashNumber(0, state);
    } else if (typeof value === "string") {
      state = hashString(value, state);
    } else if (typeof value === "number") {
      state = hashNumber(value, state);
    } else if (typeof value === "boolean") {
      state = hashBoolean(value, state);
    } else if (Array.isArray(value)) {
      // 如果是数组，检查是否是数字数组
      if (value.length > 0 && typeof value[0] === "number") {
        state = hashNumbers(value, state);
      } else {
        // 递归处理非数字数组
        for (let i = 0; i < value.length; i++) {
          state = hashObject({ [i]: value[i] }, state);
        }
      }
    } else if (typeof value === "object") {
      // 递归处理嵌套对象
      state = hashObject(value as Record<string, unknown>, state);
    }
  }

  return state;
}

export { hash, hashString, hashNumber, hashNumbers, hashBoolean, hashObject };
