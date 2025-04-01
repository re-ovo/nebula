export function uuid(): string {
  const fn = crypto.randomUUID;
  if (!fn) {
    return guid();
  }
  return fn.call(crypto);
}

// Fallback for browsers that don't support crypto.randomUUID
function guid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
