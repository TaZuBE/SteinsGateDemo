import { cubicBezier } from "./bezier"
import { Vector } from "./data"
import { ease } from "./timingFunctions"


type OnTransitionCallback<T> = ((v: T, t: number, dv: T, dt: number) => any) | ((v: T, t: number, dv: T) => any) | ((v: T, t: number) => any) | ((v: T) => any) | (() => any)

/**
 * 一般的过渡
 */
export default class Transition {
  _startValue: number = 0
  _endValue: number = 0
  _animationId: number | null = null
  _startTime: number = 0
  _lastValue: number = 0
  _lastTime: number = 0

  transitionable: boolean = true
  value: number
  duration: number
  timingFunction: (t: number) => number
  _ontransition: OnTransitionCallback<number>

  constructor(value: number = 0,
    duration: number = 150,
    timingFunction: (t: number) => number = ease,
    _ontransition: OnTransitionCallback<number> = () => { }
  ) {
    this.value = this._lastValue = value
    this.duration = duration
    this.timingFunction = timingFunction
    this._ontransition = _ontransition
    return new Proxy(this, {
      set(t, p, v) {
        if (!(p in t)) {
          return false
        }
        if (p === 'value' && t.transitionable) {
          t._startValue = t.value
          t._endValue = v
          t._startTime = t._lastTime = Date.now()
          if (!t._animationId) {
            t._animationId = requestAnimationFrame(t._transition.bind(t))
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
    this._ontransition(this.value, Date.now() - this._startTime, this.value - this._lastValue, Date.now() - this._lastTime)
    this._lastValue = this.value
    this._lastTime = Date.now()

    if (this._startTime + this.duration < Date.now()) {
      this.value = this._endValue
      this._animationId = null
    } else {
      this._animationId = requestAnimationFrame(this._transition.bind(this))
    }
  }

  ontransition(cb: OnTransitionCallback<number>) {
    this._ontransition = cb
  }

  get startValue() {
    return this._animationId ? this._startValue : this.value
  }

  get endValue() {
    return this._animationId ? this._endValue : this.value
  }
}

/**
 * 每次重新设置终止值不会开启新的过渡
 * 时间函数会平滑衔接
 */
export class RoundTransition {
  _oStartTime: number = 0
  _startValue: number = 0
  _endValue: number = 0
  _animationId: number | null = null
  _startTime: number = 0
  _duration: number = 0
  _smoothFunc: (t: number) => number
  _d: number = 1
  _lastValue: number = 0
  _lastTime: number = 0

  transitionable: boolean = true
  value: number
  duration: number
  timingFunction: (t: number) => number
  _ontransition: OnTransitionCallback<number>

  constructor(
    value: number = 0,
    duration: number = 150,
    timingFunction: (t: number) => number = ease,
    ontransition: OnTransitionCallback<number> = () => { },
  ) {
    this.value = this._lastValue = value
    this.duration = duration
    this.timingFunction = this._smoothFunc = timingFunction
    this._ontransition = ontransition

    return new Proxy(this, {
      set(o, p, v) {
        if (!(p in o)) return false
        if (p === 'value') {
          if (!o.transitionable) {
            o.value = v
          } else {
            if (!o._animationId) {
              o._duration = o.duration
              o._smoothFunc = o.timingFunction
              o._startTime = o._oStartTime = o._lastTime = Date.now()
              o._startValue = o._lastValue = o.value
              o._animationId = requestAnimationFrame(o._transition.bind(o))
            } else {
              o._duration = o.duration - Date.now() + o._oStartTime
              const dx = 0.4
              const dy = dx * o._d / (v - o.value === 0 ? 0.0001 : v - o.value) * o._duration
              const scale = dy >= 0.9 ? 0.9 / dy : 1
              o._smoothFunc = cubicBezier(dx * scale, dy * scale, 0.8, 1)
              o._startTime = Date.now()
              o._startValue = o.value
            }
            o._endValue = v
          }
        } else {
          o[p as keyof typeof o] = v
        }
        return true
      }
    })
  }

  _transition() {
    const lastValue = this.value
    this.value = this._startValue + this._smoothFunc(
      (Date.now() - this._startTime) / this._duration
    ) * (this._endValue - this._startValue)
    this._d = (this.value - lastValue) / Math.max(Date.now() - this._lastTime, 1)
    this._ontransition(this.value, Date.now() - this._oStartTime, this.value - this._lastValue, Date.now() - this._lastTime)
    this._lastTime = Date.now()
    this._lastValue = this.value

    if (this._startTime + this._duration < Date.now() || this._duration < 0) {
      this.value = this._endValue
      this._animationId = null
    } else {
      this._animationId = requestAnimationFrame(this._transition.bind(this))
    }
  }

  ontransition(cb: OnTransitionCallback<number>) {
    this._ontransition = cb
  }

  get startValue() {
    return this._animationId ? this._startValue : this.value
  }

  get endValue() {
    return this._animationId ? this._endValue : this.value
  }
}

/**
 * 每次重新设置终止值会开启新的过渡
 * 时间函数会平滑衔接
 */
export class SmoothTransition {
  _oStartTime: number = 0
  _startValue: number = 0
  _endValue: number = 0
  _animationId: number | null = null
  _startTime: number = 0
  _smoothFunc: (t: number) => number
  _d: number = 1
  _lastValue: number = 0
  _lastTime: number = 0

  transitionable: boolean = true
  value: number
  duration: number
  timingFunction: (t: number) => number
  _ontransition: OnTransitionCallback<number>

  constructor(
    value: number = 0,
    duration: number = 150,
    timingFunction: (t: number) => number = ease,
    ontransition: OnTransitionCallback<number> = () => { },
  ) {
    this.value = this._lastValue = value
    this.duration = duration
    this.timingFunction = this._smoothFunc = timingFunction
    this._ontransition = ontransition

    return new Proxy(this, {
      set(o, p, v) {
        if (!(p in o)) return false
        if (p === 'value') {
          if (!o.transitionable) {
            o.value = v
          } else {
            if (!o._animationId) {
              o._startTime = o._oStartTime = o._lastTime = Date.now()
              o._startValue = o._lastValue = o.value
              o._smoothFunc = o.timingFunction
              o._animationId = requestAnimationFrame(o._transition.bind(o))
            } else {
              o._startTime = Date.now()
              o._startValue = o.value
              const dx = 0.4
              const dy = dx * o._d / (v - o.value === 0 ? 0.0001 : v - o.value) * o.duration
              const scale = dy >= 0.9 ? 0.9 / dy : 1
              o._smoothFunc = cubicBezier(dx * scale, dy * scale, 0.8, 1)
            }
            o._endValue = v
          }
        } else {
          o[p as keyof typeof o] = v
        }
        return true
      }
    })
  }

  _transition() {
    const lastValue = this.value
    this.value = this._startValue + this._smoothFunc(
      (Date.now() - this._startTime) / this.duration
    ) * (this._endValue - this._startValue)
    this._d = (this.value - lastValue) / Math.max(Date.now() - this._lastTime, 1)
    this._ontransition(this.value, Date.now() - this._oStartTime, this.value - this._lastValue, Date.now() - this._lastTime)
    this._lastTime = Date.now()
    this._lastValue = this.value

    if (this._startTime + this.duration < Date.now()) {
      this.value = this._endValue
      this._animationId = null
    } else {
      this._animationId = requestAnimationFrame(this._transition.bind(this))
    }
  }

  ontransition(cb: OnTransitionCallback<number>) {
    this._ontransition = cb
  }

  get startValue() {
    return this._animationId ? this._startValue : this.value
  }

  get endValue() {
    return this._animationId ? this._endValue : this.value
  }
}

type RGB = { r: number, g: number, b: number }
export class TransitionColor {
  transitionable: boolean = true
  value: {
    r: Transition
    g: Transition
    b: Transition
  }
  duration: number
  timingFunction: (t: number) => number
  _ontransition: OnTransitionCallback<RGB>

  constructor(
    value: RGB | [number, number, number] = { r: 0, g: 0, b: 0 },
    duration: number = 150,
    timingFunction: (t: number) => number = ease,
    _ontransition: OnTransitionCallback<RGB> = () => { }
  ) {
    if (Array.isArray(value)) {
      this.value = {
        r: new Transition(value[0], duration, timingFunction, (v, t, dv, dt) => _ontransition(this._rgb(), t, {
          r: this.value.r.value - this.value.r._lastValue,
          g: this.value.g.value - this.value.g._lastValue,
          b: this.value.b.value - this.value.b._lastValue,
        }, dt)),
        g: new Transition(value[1], duration, timingFunction),
        b: new Transition(value[2], duration, timingFunction),
      }
    } else {
      this.value = {
        r: new Transition(value.r, duration, timingFunction, (v, t, dv, dt) => _ontransition(this._rgb(), t, {
          r: this.value.r.value - this.value.r._lastValue,
          g: this.value.g.value - this.value.g._lastValue,
          b: this.value.b.value - this.value.b._lastValue,
        }, dt)),
        g: new Transition(value.g, duration, timingFunction),
        b: new Transition(value.b, duration, timingFunction),
      }
    }
    this.duration = duration
    this.timingFunction = timingFunction
    this._ontransition = _ontransition

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
        } else if (prop === 'ontransition') {
          obj.value.r.ontransition = value
        } else {
          obj[prop as keyof typeof obj] = value
          obj.value.r[prop as 'value'] = value
          obj.value.g[prop as 'value'] = value
          obj.value.b[prop as 'value'] = value
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

  ontransition(cb: (v: RGB, p: number) => any | ((v: RGB) => any) | (() => any)) {
    this._ontransition = cb
  }

  get startValue() {
    return { r: this.value.r.startValue, g: this.value.g.startValue, b: this.value.b.startValue }
  }

  get endValue() {
    return { r: this.value.r.endValue, g: this.value.g.endValue, b: this.value.b.endValue }
  }
}

