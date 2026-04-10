export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]) {
  const cloned = {...obj};
  for (const key of keys) {
    delete cloned[key];
  }
  return cloned;
}
