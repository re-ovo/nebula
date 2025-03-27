import { hashString } from "@/core";

class ShaderSource {
  private readonly name: string;
  private source: string;
  private hash: number;

  constructor(name: string, source: string) {
    this.name = name;
    this.source = source;
    this.hash = hashString(source);
  }

  getSource() {
    return this.source;
  }

  getName() {
    return this.name;
  }

  getHash() {
    return this.hash;
  }

  setSource(source: string) {
    this.source = source;
    this.hash = hashString(source);
  }
}

export default ShaderSource;
