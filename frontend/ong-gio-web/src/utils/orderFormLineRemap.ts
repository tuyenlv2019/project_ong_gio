/** Cập nhật index trong Set sau khi Form.List move dòng. */
export function remapIndexSetAfterMove(indices: Set<number>, fromIndex: number, toIndex: number) {
  const next = new Set<number>();
  indices.forEach((index) => {
    if (index === fromIndex) {
      next.add(toIndex);
      return;
    }
    if (fromIndex < toIndex && index > fromIndex && index <= toIndex) {
      next.add(index - 1);
      return;
    }
    if (fromIndex > toIndex && index >= toIndex && index < fromIndex) {
      next.add(index + 1);
      return;
    }
    next.add(index);
  });
  return next;
}

/** Dịch chuyển key trong record theo thao tác move dòng Form.List. */
export function remapRecordKeysAfterMove<T>(record: Record<number, T>, fromIndex: number, toIndex: number) {
  const max = Math.max(
    ...Object.keys(record).map(Number),
    fromIndex,
    toIndex,
    0,
  );
  const arr: (T | undefined)[] = Array.from({ length: max + 1 });
  Object.entries(record).forEach(([key, value]) => {
    arr[Number(key)] = value;
  });
  const [moved] = arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, moved);
  const next: Record<number, T> = {};
  arr.forEach((value, index) => {
    if (value !== undefined) next[index] = value;
  });
  return next;
}

/** Cập nhật index trong Set sau khi Form.List xóa dòng. */
export function remapIndexSetAfterRemove(indices: Set<number>, removedIndex: number) {
  const next = new Set<number>();
  indices.forEach((index) => {
    if (index === removedIndex) return;
    if (index > removedIndex) {
      next.add(index - 1);
      return;
    }
    next.add(index);
  });
  return next;
}

/** Dịch chuyển key trong record sau khi Form.List xóa dòng. */
export function remapRecordKeysAfterRemove<T>(record: Record<number, T>, removedIndex: number) {
  const max = Math.max(...Object.keys(record).map(Number), removedIndex, 0);
  const arr: (T | undefined)[] = Array.from({ length: max + 1 });
  Object.entries(record).forEach(([key, value]) => {
    arr[Number(key)] = value;
  });
  arr.splice(removedIndex, 1);
  const next: Record<number, T> = {};
  arr.forEach((value, index) => {
    if (value !== undefined) next[index] = value;
  });
  return next;
}
