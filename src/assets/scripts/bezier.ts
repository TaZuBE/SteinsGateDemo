import { Vector } from "./data";
import { C } from "./algorithm";


export function bezier(ps: Vector[]) {
  return function (t: number) {
    const res = new Vector()
    const n = ps.length - 1
    for (let i = 0; i <= n; i++) {
      res.add(ps[i].mul(C(n, i) * t ** i * (1 - t) ** (n - i)))
    }
    return res
  }
}


export function cubicBezier(p1: Vector, p2: Vector): (t: number) => number
export function cubicBezier(p1: number, p2: number, p3: number, p4: number): (t: number) => number

export function cubicBezier(_p1: Vector | number, _p2: Vector | number, _p3?: number, _p4?: number) {
  const p1 = new Vector(), p2 = new Vector()
  p1.set(_p3 ? new Vector(_p1 as number, _p2 as number) : _p1 as Vector)
  p2.set(_p3 ? new Vector(_p3, _p4) : _p2 as Vector)
  const ax = 3 * p1.x - 3 * p2.x + 1
  const bx = -6 * p1.x + 3 * p2.x
  const cx = 3 * p1.x
  const ay = 3 * p1.y - 3 * p2.y + 1
  const by = -6 * p1.y + 3 * p2.y
  const cy = 3 * p1.y
  return function (t: number) {
    let s = t
    for (let i = 0; i < 8; i++) {
      const fx = ax * s ** 3 + bx * s ** 2 + cx * s - t
      const dfx = 3 * ax * s ** 2 + 2 * bx * s + cx
      s -= fx / dfx
      s = Math.max(0, Math.min(1, s))
    }
    return ay * s ** 3 + by * s ** 2 + cy * s
  }
}