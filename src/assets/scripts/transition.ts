import { Archive } from "@material-ui/icons"

export function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}



export default class Transition {
  _startValue: number = 0
  _endValue: number = 0
  _animationId: number | null = null
  _startTime: number = 0

  value: number
  duration: number
  timingFunction: (t: number) => number
  onchange: (v?: number) => any

  constructor(value: number = 0,
    duration: number = 150,
    timingFunction: (t: number) => number = ease,
    onchange: (v?: number) => void = () => {}
  ) {
    this.value = value
    this.duration = duration
    this.timingFunction = timingFunction
    this.onchange = onchange
    return new Proxy(this, {
      set(t, p, v) {
        if (!(p in t)) {
          return false
        }
        if (p === 'value') {
          t._startValue = t.value
          t._endValue = v
          t._startTime = Date.now()
          if (!t._animationId) {
            t._transition()
          }
        } else {
          t[p as keyof typeof t] = v
        }
        return true
      }
    })
  }

  _transition() {
    this.value = this._startValue + this.timingFunction(
      (Date.now() - this._startTime) / this.duration
    ) * (this._endValue - this._startValue)
    this.onchange()

    if (this._startTime + this.duration < Date.now()) {
      this.value = this._endValue
      this._animationId = null
    } else {
      this._animationId = requestAnimationFrame(this._transition.bind(this))
    }
  }
}

type RGB = { r: number, g: number, b: number }
export class TransitionColor {
  value: {
    r: Transition
    g: Transition
    b: Transition
  }
  duration: number
  timingFunction: (t: number) => number
  onchange: (v?: RGB) => any

  constructor(
    value: RGB | [number, number, number] = { r: 0, g: 0, b: 0 },
    duration: number = 150,
    timingFunction: (t: number) => number = ease,
    onchange: (v?: RGB) => any = () => {}
  ) {
    if (Array.isArray(value)) {
      this.value = {
        r: new Transition(value[0], duration, timingFunction, () => onchange(this._rgb())),
        g: new Transition(value[1], duration, timingFunction),
        b: new Transition(value[2], duration, timingFunction),
      }
    } else {
      this.value = {
        r: new Transition(value.r, duration, timingFunction, () => onchange(this._rgb())),
        g: new Transition(value.g, duration, timingFunction),
        b: new Transition(value.b, duration, timingFunction),
      }
    }
    this.duration = duration
    this.timingFunction = timingFunction
    this.onchange = onchange

    return new Proxy(this, {
      get(obj, prop) {
        if (prop === 'value') {
          return obj._rgb()
        }
        return obj[prop as keyof typeof obj]
      },
      set(obj, prop, value) {
        if (!(prop in obj)) {
          return false
        }
        if (prop === 'value') {
          obj._setValue(value)
        } else if (prop === 'onchange') {
          obj.value.r.onchange = value
        } else {
          obj[prop as keyof typeof obj] = value
          obj.value.r[prop as keyof typeof obj.value.r] = value
          obj.value.g[prop as keyof typeof obj.value.g] = value
          obj.value.b[prop as keyof typeof obj.value.b] = value
        }
        return true
      }
    })
  }

  _rgb() {
    return {
      r: this.value.r.value,
      g: this.value.g.value,
      b: this.value.b.value
    }
  }
  _setValue(v: RGB | [number, number, number]) {
    if (Array.isArray(v)) {
      this.value.r.value = v[0]
      this.value.g.value = v[1]
      this.value.b.value = v[2]
    } else {
      this.value.r.value = v.r
      this.value.g.value = v.g
      this.value.b.value = v.b
    }
  }
}

