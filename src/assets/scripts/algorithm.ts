
export function down(x: number, gap: number = 1) {
  return Math.floor(x / gap) * gap;
}

export function up(x: number, gap: number = 1) {
  return Math.ceil(x / gap) * gap;
}

export function deepEqual(a: any, b: any) {
  if (a === b) return true
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) {
    return false
  }
  for (let key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false
    }
  }
  return true
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T
  }
  const clonedObj: { [key: string]: any } = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key])
    }
  }
  return clonedObj as T
}

export function factorial(n: number) {
  let res = 1
  for (let i = 2; i <= n; i++) {
    res *= i
  }
  return res
}

export function A(n: number, count: number) {
  return factorial(n) / factorial(n - count)
}

export function C(n: number, count: number) {
  return factorial(n) / (factorial(n - count) * factorial(count))
}
