/**
 * 稀疏集合数据结构
 *
 * 稀疏集合是一种高效的数据结构，用于存储和管理实体ID。它由两个数组组成:
 * - sparse: 稀疏数组，存储实体ID到dense数组索引的映射
 * - dense: 密集数组，按顺序存储所有实体ID
 *
 * 主要用途:
 * - 快速查找实体是否存在 O(1)
 * - 快速添加/删除实体 O(1)
 * - 高效遍历所有实体
 *
 * 示例:
 * ```ts
 * const set = new SparseSet();
 * set.add(1); // 添加实体1
 * set.has(1); // true
 * set.remove(1); // 移除实体1
 * set.clear(); // 清空集合
 * ```
 */
export class SparseSet {
  private sparse: Uint32Array;
  private dense: Uint32Array;
  private count: number;

  /**
   * 创建一个新的稀疏集合
   * @param initialCapacity 初始容量，默认为1024
   */
  constructor(initialCapacity: number = 1024) {
    this.sparse = new Uint32Array(initialCapacity);
    this.dense = new Uint32Array(initialCapacity);
    this.count = 0;
  }

  get capacity(): number {
    return this.sparse.length;
  }

  getDenseIndex(sparseIndex: number): number | undefined {
    return this.dense[sparseIndex];
  }

  /**
   * 检查实体是否在集合中
   * @param entity 要检查的实体ID
   * @returns 如果实体存在则返回true，否则返回false
   */
  has(entity: number): boolean {
    return (
      entity < this.sparse.length &&
      this.sparse[entity] < this.count &&
      this.dense[this.sparse[entity]] === entity
    );
  }

  /**
   * 向集合中添加实体
   * @param entity 要添加的实体ID
   * @returns 如果实体被添加则返回true，如果已存在则返回false
   */
  add(entity: number): boolean {
    if (this.has(entity)) {
      return false;
    }

    // 如果实体ID超出当前sparse数组大小，则扩容
    if (entity >= this.sparse.length) {
      this.resize(Math.max(entity + 1, this.sparse.length * 2));
    }

    // 如果dense数组已满，则扩容
    if (this.count >= this.dense.length) {
      this.resize(this.dense.length * 2);
    }

    this.sparse[entity] = this.count;
    this.dense[this.count] = entity;
    this.count++;
    return true;
  }

  /**
   * 从集合中移除实体
   * @param entity 要移除的实体ID
   * @returns 如果实体被移除则返回true，如果不存在则返回false
   */
  remove(entity: number): boolean {
    if (!this.has(entity)) {
      return false;
    }

    // 获取要删除的实体在dense数组中的索引
    const denseIndex = this.sparse[entity];

    // 获取dense数组中的最后一个实体
    const lastEntity = this.dense[this.count - 1];

    // 将最后一个实体移到被删除的位置
    this.dense[denseIndex] = lastEntity;

    // 更新最后一个实体在sparse数组中的索引
    this.sparse[lastEntity] = denseIndex;

    // 减少计数
    this.count--;

    return true;
  }

  /**
   * 清空集合
   */
  clear(): void {
    this.count = 0;
  }

  /**
   * 获取集合中的实体数量
   * @returns 实体数量
   */
  size(): number {
    return this.count;
  }

  /**
   * 获取集合中的所有实体
   * @returns 包含所有实体ID的数组
   */
  entities(): Uint32Array {
    return this.dense.slice(0, this.count);
  }

  /**
   * 重新调整集合的容量
   * @param newCapacity 新的容量大小
   */
  private resize(newCapacity: number): void {
    const newSparse = new Uint32Array(newCapacity);
    const newDense = new Uint32Array(newCapacity);

    // 复制现有数据
    newSparse.set(
      this.sparse.slice(0, Math.min(this.sparse.length, newCapacity)),
    );
    newDense.set(this.dense.slice(0, Math.min(this.count, newCapacity)));

    this.sparse = newSparse;
    this.dense = newDense;
  }
}
