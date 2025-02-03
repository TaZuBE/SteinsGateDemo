import { cubicBezier } from "./bezier";
import { Vector } from "./data";

export const linear = (t: number) => t
export const ease = cubicBezier(0.25, 0.1, 0.25, 1)
export const easein = cubicBezier(0.42, 0, 1.0, 1.0)
export const easeout = cubicBezier(0, 0, 0.58, 1.0)
export const easeinout = cubicBezier(0.42, 0, 0.58, 1.0)

