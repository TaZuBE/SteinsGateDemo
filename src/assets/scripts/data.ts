


export type VectorDataType = {
	x: number,
	y: number
}
export class Vector {
	x: number
	y: number
	constructor(x: number = 0, y: number = 0) {
		this.x = x
		this.y = y
	}
	set(v: Vector): void
	set(x: number, y: number): void
	set(a1: Vector | number, a2?: number) {
		if (a1 instanceof Vector) {
			this.x = a1.x
			this.y = a1.y
		} else {
			this.x = a1
			this.y = a2!
		}
	}
	add(v: Vector) {
		return new Vector(this.x + v.x, this.y + v.y)
	}
	sub(v: Vector) {
		return new Vector(this.x - v.x, this.y - v.y)
	}
	mul(k: number) {
		return new Vector(this.x * k, this.y * k)
	}
	div(k: number) {
		return new Vector(this.x / k, this.y / k)
	}
	neg() {
		return new Vector(-this.x, -this.y)
	}
	len() {
		return Math.sqrt(this.x ** 2 + this.y ** 2)
	}
	isZero() {
		return this.x === 0 && this.y === 0
	}
	normalize() {
		return this.div(this.len())
	}
	to(v: Vector) {
		return v.sub(this)
	}
	distance(v: Vector) {
		return this.to(v).len()
	}
	rotate(angle: number) {
		return new Vector(
			this.x * Math.cos(angle) - this.y * Math.sin(angle),
			this.x * Math.sin(angle) + this.y * Math.cos(angle)
		)
	}
	arr(): number[] {
		return [this.x, this.y]
	}
	tuple(): [number, number] {
		return [this.x, this.y]
	}
	clone() {
		return new Vector(this.x, this.y)
	}
	doAdd(v: Vector) {
		this.x += v.x
		this.y += v.y
		return this
	}
	doSub(v: Vector) {
		this.x -= v.x
		this.y -= v.y
		return this
	}
	doMul(k: number) {
		this.x *= k
		this.y *= k
		return this
	}
	doDiv(k: number) {
		this.x /= k
		this.y /= k
		return this
	}
	doNeg() {
		this.x = -this.x
		this.y = -this.y
		return this
	}
	doNormalize() {
		const len = this.len()
		this.x /= len
		this.y /= len
		return this
	}
	doRotate(angle: number) {
		const x = this.x
		this.x = x * Math.cos(angle) - this.y * Math.sin(angle)
		this.y = x * Math.sin(angle) + this.y * Math.cos(angle)
		return this
	}
	data(): VectorDataType {
		return {
			x: this.x,
			y: this.y
		}
	}
	static restore(data: VectorDataType) {
		return new Vector(data.x, data.y)
	}
}
