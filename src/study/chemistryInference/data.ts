import { reactive, ref, onUnmounted, watch, type Reactive, type Ref } from "vue"
import { loadRouteLocation } from "vue-router"
import { Vector, type VectorDataType } from "@/assets/scripts/data"
import { deepEqual, deepClone, ease } from "@/assets/scripts/algorithm"
import Transition, { TransitionColor } from "@/assets/scripts/transition"


let Draw: () => void
export function share(_Draw: () => void) {
  Draw = _Draw
}


export const subscript: { [key: string]: string } = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
}
export function pretty(str: string) {
  return str.replace(/\d/g, d => subscript[d])
}
export function unpretty(str: string) {
  const reverse = Object.fromEntries(Object.entries(subscript).map(([k, v]) => [v, k]))
  return str.replace(/[₀-₉]/g, d => reverse[d])
}


// Like H He Li
export class CElement {
  symbol: string
  name: string
  atomicNumber: number
  atomicWeight: number
  constructor(symbol: string, name: string, atomicNumber: number, atomicWeight: number) {
    this.symbol = symbol
    this.name = name
    this.atomicNumber = atomicNumber
    this.atomicWeight = atomicWeight
  }
}
const celements: CElement[] = [
  new CElement('H', 'Hydrogen', 1, 1.008),
  new CElement('He', 'Helium', 2, 4.0026),
  new CElement('Li', 'Lithium', 3, 6.94),
  new CElement('Be', 'Beryllium', 4, 9.0122),
  new CElement('B', 'Boron', 5, 10.81),
  new CElement('C', 'Carbon', 6, 12.011),
  new CElement('N', 'Nitrogen', 7, 14.007),
  new CElement('O', 'Oxygen', 8, 15.999),
  new CElement('F', 'Fluorine', 9, 18.998),
  new CElement('Ne', 'Neon', 10, 20.180),
  new CElement('Na', 'Sodium', 11, 22.990),
  new CElement('Mg', 'Magnesium', 12, 24.305),
  new CElement('Al', 'Aluminum', 13, 26.982),
  new CElement('Si', 'Silicon', 14, 28.085),
  new CElement('P', 'Phosphorus', 15, 30.974),
  new CElement('S', 'Sulfur', 16, 32.06),
  new CElement('Cl', 'Chlorine', 17, 35.45),
  new CElement('Ar', 'Argon', 18, 39.948),
  new CElement('K', 'Potassium', 19, 39.098),
  new CElement('Ca', 'Calcium', 20, 40.078),
  new CElement('Sc', 'Scandium', 21, 44.956),
  new CElement('Ti', 'Titanium', 22, 47.867),
  new CElement('V', 'Vanadium', 23, 50.942),
  new CElement('Cr', 'Chromium', 24, 51.996),
  new CElement('Mn', 'Manganese', 25, 54.938),
  new CElement('Fe', 'Iron', 26, 55.845),
  new CElement('Co', 'Cobalt', 27, 58.933),
  new CElement('Ni', 'Nickel', 28, 58.693),
  new CElement('Cu', 'Copper', 29, 63.546),
  new CElement('Zn', 'Zinc', 30, 65.38),
  new CElement('Ga', 'Gallium', 31, 69.723),
  new CElement('Ge', 'Germanium', 32, 72.63),
  new CElement('As', 'Arsenic', 33, 74.922),
  new CElement('Se', 'Selenium', 34, 78.971),
  new CElement('Br', 'Bromine', 35, 79.904),
  new CElement('Kr', 'Krypton', 36, 83.798),
  new CElement('Rb', 'Rubidium', 37, 85.468),
  new CElement('Sr', 'Strontium', 38, 87.62),
  new CElement('Y', 'Yttrium', 39, 88.906),
  new CElement('Zr', 'Zirconium', 40, 91.224),
  new CElement('Nb', 'Niobium', 41, 92.906),
  new CElement('Mo', 'Molybdenum', 42, 95.95),
  new CElement('Tc', 'Technetium', 43, 98),
  new CElement('Ru', 'Ruthenium', 44, 101.07),
  new CElement('Rh', 'Rhodium', 45, 102.91),
  new CElement('Pd', 'Palladium', 46, 106.42),
  new CElement('Ag', 'Silver', 47, 107.87),
  new CElement('Cd', 'Cadmium', 48, 112.41),
  new CElement('In', 'Indium', 49, 114.82),
  new CElement('Sn', 'Tin', 50, 118.71),
  new CElement('Sb', 'Antimony', 51, 121.76),
  new CElement('Te', 'Tellurium', 52, 127.60),
  new CElement('I', 'Iodine', 53, 126.90),
  new CElement('Xe', 'Xenon', 54, 131.29),
  new CElement('Cs', 'Cesium', 55, 132.91),
  new CElement('Ba', 'Barium', 56, 137.33),
  new CElement('La', 'Lanthanum', 57, 138.91),
  new CElement('Ce', 'Cerium', 58, 140.12),
  new CElement('Pr', 'Praseodymium', 59, 140.91),
  new CElement('Nd', 'Neodymium', 60, 144.24),
  new CElement('Pm', 'Promethium', 61, 145),
  new CElement('Sm', 'Samarium', 62, 150.36),
  new CElement('Eu', 'Europium', 63, 151.96),
  new CElement('Gd', 'Gadolinium', 64, 157.25),
  new CElement('Tb', 'Terbium', 65, 158.93),
  new CElement('Dy', 'Dysprosium', 66, 162.50),
  new CElement('Ho', 'Holmium', 67, 164.93),
  new CElement('Er', 'Erbium', 68, 167.26),
  new CElement('Tm', 'Thulium', 69, 168.93),
  new CElement('Yb', 'Ytterbium', 70, 173.04),
  new CElement('Lu', 'Lutetium', 71, 174.97),
  new CElement('Hf', 'Hafnium', 72, 178.49),
  new CElement('Ta', 'Tantalum', 73, 180.95),
  new CElement('W', 'Tungsten', 74, 183.84),
  new CElement('Re', 'Rhenium', 75, 186.21),
  new CElement('Os', 'Osmium', 76, 190.23),
  new CElement('Ir', 'Iridium', 77, 192.22),
  new CElement('Pt', 'Platinum', 78, 195.08),
  new CElement('Au', 'Gold', 79, 196.97),
  new CElement('Hg', 'Mercury', 80, 200.59),
  new CElement('Tl', 'Thallium', 81, 204.38),
  new CElement('Pb', 'Lead', 82, 207.2),
  new CElement('Bi', 'Bismuth', 83, 208.98),
  new CElement('Po', 'Polonium', 84, 209),
  new CElement('At', 'Astatine', 85, 210),
  new CElement('Rn', 'Radon', 86, 222),
  new CElement('Fr', 'Francium', 87, 223),
  new CElement('Ra', 'Radium', 88, 226),
  new CElement('Ac', 'Actinium', 89, 227),
  new CElement('Th', 'Thorium', 90, 232.04),
  new CElement('Pa', 'Protactinium', 91, 231.04),
  new CElement('U', 'Uranium', 92, 238.03),
  new CElement('Np', 'Neptunium', 93, 237),
  new CElement('Pu', 'Plutonium', 94, 244),
  new CElement('Am', 'Americium', 95, 243),
  new CElement('Cm', 'Curium', 96, 247),
  new CElement('Bk', 'Berkelium', 97, 247),
  new CElement('Cf', 'Californium', 98, 251),
  new CElement('Es', 'Einsteinium', 99, 252),
  new CElement('Fm', 'Fermium', 100, 257),
  new CElement('Md', 'Mendelevium', 101, 258),
  new CElement('No', 'Nobelium', 102, 259),
  new CElement('Lr', 'Lawrencium', 103, 262),
  new CElement('Rf', 'Rutherfordium', 104, 267),
  new CElement('Db', 'Dubnium', 105, 270),
  new CElement('Sg', 'Seaborgium', 106, 271),
  new CElement('Bh', 'Bohrium', 107, 270),
  new CElement('Hs', 'Hassium', 108, 277),
  new CElement('Mt', 'Meitnerium', 109, 278),
  new CElement('Ds', 'Darmstadtium', 110, 281),
  new CElement('Rg', 'Roentgenium', 111, 282),
  new CElement('Cn', 'Copernicium', 112, 285),
  new CElement('Nh', 'Nihonium', 113, 286),
  new CElement('Fl', 'Flerovium', 114, 289),
  new CElement('Mc', 'Moscovium', 115, 290),
  new CElement('Lv', 'Livermorium', 116, 293),
  new CElement('Ts', 'Tennessine', 117, 294),
  new CElement('Og', 'Oganesson', 118, 294),
];
function cel(name: string) {
  return celements.find(v => v.symbol === name)
}
// Like H20
type FormulaDataType = {
  value: {
    el: string | {
      el: string,
      quantity: number,
    }[],
    quantity: number,
  }[],
  description: string,
}
type FormulaComponent = {
  el: CElement | {
    el: CElement,
    quantity: number,
  }[],
  quantity: number
}
export class Formula {
  value: FormulaComponent[]
  description: string
  constructor(value: FormulaComponent[], description: string = '') {
    this.value = value
    this.description = description
  }
  reactant(coef: number = 1) {
    return new Reactant(this, coef)
  }
  product(coef: number = 1, style: number = 0) {
    return new Product(this, coef)
  }
  deepEqual(f: Formula) {
    return deepEqual(this.value, f.value)
  }
  elementCount() {
    let count = 0
    for (const c of this.value) {
      if (Array.isArray(c.el)) {
        for (const e of c.el) {
          count += e.quantity
        }
      } else {
        count += c.quantity
      }
    }
    return count
  }
  weight() {
    let weight = 0
    for (const i of this.value) {
      if (Array.isArray(i.el)) {
        for (const j of i.el) {
          weight += j.el.atomicWeight * j.quantity
        }
      } else {
        weight += i.el.atomicWeight * i.quantity
      }
    }
    return weight
  }
  string(topretty: boolean = true) {
    const normal = this.value.map(c => Array.isArray(c.el) ? `(${c.el.map(c2 => c2.el.symbol + (c2.quantity === 1 ? '' : c2.quantity)).join('')})${c.quantity}` : c.el.symbol + (c.quantity !== 1 ? c.quantity : '')).join('')
    return topretty ? pretty(normal) : normal
  }
  data(): FormulaDataType {
    return {
      value: this.value.map(v => ({
        el: Array.isArray(v.el) ? v.el.map(v2 => ({
          el: v2.el.symbol,
          quantity: v2.quantity,
        })) : v.el.symbol,
        quantity: v.quantity,
      })),
      description: this.description
    }
  }
  static restore(data: FormulaDataType) {
    return new Formula(data.value.map(v => ({
      el: Array.isArray(v.el) ? v.el.map(e => ({
        el: celements.find(ce => ce.symbol === e.el)!,
        quantity: e.quantity,
      })) : celements.find(ce => ce.symbol === v.el)!,
      quantity: v.quantity,
    })), data.description)
  }
  static parse(str: string) {
    str = unpretty(str)
    let res = new Formula([])
    // 获取 tokens
    // 0 元素
    // 1 数字
    // 2 (
    // 3 )
    let _tokens = str.match(/[A-Z][a-z]*|\d+|[()]/g)
    if (!_tokens || _tokens.join('') !== str) {
      throw Error('Invalid tokens')
    }
    let tokens = _tokens.map(token => ({
      content: token, type:
        token.match(/^[A-Z][a-z]*$/) ? 0 :
          token.match(/^\d+$/) ? 1 :
            token === '(' ? 2 :
              token === ')' ? 3 : -1
    }))
    for (const t of tokens) {
      if (t.type === 1 && t.content[0] === '0') {
        throw Error('Invalid number')
      }
    }
    // s-state
    // 0 外元素1 | (2
    // 1 外元素1 | 外数字0 | (2
    // 2 内元素3
    // 3 内元素4 | 内数字5
    // 4 内元素4 | 内数字6 | )7
    // 5 内元素4
    // 6 内元素4 | )7
    // 7 外数字0
    let s = 0
    for (const t of tokens) {
      if (s === 0) {
        if (t.type === 0 && cel(t.content)) {
          res.value.push({ el: cel(t.content)!, quantity: 1 })
          s = 1
        } else if (t.type === 2) {
          res.value.push({ el: [], quantity: 1 })
          s = 2
        } else {
          throw Error('Invalid token: ' + t.content)
        }
      } else if (s === 1) {
        if (t.type === 0 && cel(t.content)) {
          res.value.push({ el: cel(t.content)!, quantity: 1 })
          s = 1
        } else if (t.type === 1) {
          res.value[res.value.length - 1].quantity = Number(t.content)
          s = 0
        } else if (t.type === 2) {
          res.value.push({ el: [], quantity: 1 })
          s = 2
        } else {
          throw Error('Invalid token: ' + t.content)
        }
      } else if (s === 2) {
        const p = res.value[res.value.length - 1].el as { el: CElement, quantity: number }[]
        if (t.type === 0 && cel(t.content)) {
          p.push({ el: cel(t.content)!, quantity: 1 })
          s = 3
        } else {
          throw Error('Invalid token: ' + t.content)
        }
      } else if (s === 3) {
        const p = res.value[res.value.length - 1].el as { el: CElement, quantity: number }[]
        if (t.type === 0 && cel(t.content)) {
          p.push({ el: cel(t.content)!, quantity: 1 })
          s = 4
        } else if (t.type === 1) {
          p[p.length - 1].quantity = Number(t.content)
          s = 5
        } else {
          throw Error('Invalid token: ' + t.content)
        }
      } else if (s === 4) {
        const p = res.value[res.value.length - 1].el as { el: CElement, quantity: number }[]
        if (t.type === 0 && cel(t.content)) {
          p.push({ el: cel(t.content)!, quantity: 1 })
          s = 4
        } else if (t.type === 1) {
          p[p.length - 1].quantity = Number(t.content)
          s = 6
        } else if (t.type === 3) {
          s = 7
        } else {
          throw Error('Invalid token: ' + t.content)
        }
      } else if (s === 5) {
        const p = res.value[res.value.length - 1].el as { el: CElement, quantity: number }[]
        if (t.type === 0 && cel(t.content)) {
          p.push({ el: cel(t.content)!, quantity: 1 })
          s = 4
        } else {
          throw Error('Invalid token: ' + t.content)
        }
      } else if (s === 6) {
        const p = res.value[res.value.length - 1].el as { el: CElement, quantity: number }[]
        if (t.type === 0 && cel(t.content)) {
          p.push({ el: cel(t.content)!, quantity: 1 })
          s = 4
        } else if (t.type === 3) {
          s = 7
        } else {
          throw Error('Invalid token: ' + t.content)
        }
      } else if (s === 7) {
        const p = res.value[res.value.length - 1].el as { el: CElement, quantity: number }[]
        if (t.type === 1) {
          res.value[res.value.length - 1].quantity = Number(t.content)
          s = 0
        } else {
          throw Error('Invalid token: ' + t.content)
        }
      }
    }
    return res
  }
  clone() {
    return new Formula(deepClone(this.value), this.description)
  }
  set(f: Formula) {
    this.value = deepClone(f.value)
    this.description = f.description
  }
}
// Like 3H20
type ReactantDataType = {
  coef: number,
  formula: FormulaDataType
}
export class Reactant {
  coef: number
  formula: Formula
  constructor(formula: Formula, coef: number = 1) {
    this.coef = coef;
    this.formula = formula;
  }
  data(): ReactantDataType {
    return {
      coef: this.coef,
      formula: this.formula.data()
    }
  }
  static restore(data: ReactantDataType) {
    return new Reactant(Formula.restore(data.formula), data.coef)
  }
  static parse(r: string) {
    const coefStr = r.match(/^d+/)
    const coef = coefStr ? Number(coefStr) : 1
    const formula = Formula.parse(r.substring(coefStr ? coefStr.length : 0))
    return new Reactant(formula, coef)
  }
  string(pretty: boolean = true) {
    return (this.coef === 1 ? '' : this.coef) + this.formula.string(pretty)
  }
  clone() {
    return new Reactant(this.formula.clone(), this.coef)
  }
}
// Like O2(气标)
const ProductStyles = ['', '↑', '↓']
type ProductDataType = {
  coef: number,
  formula: FormulaDataType,
  style: string
}
export class Product {
  coef: number
  formula: Formula
  style: string
  constructor(formula: Formula, coef: number = 1, style: string = '') {
    this.coef = coef
    this.formula = formula
    this.style = style
  }
  data(): ProductDataType {
    return {
      coef: this.coef,
      formula: this.formula.data(),
      style: this.style
    }
  }
  static restore(data: ProductDataType) {
    return new Product(Formula.restore(data.formula), data.coef, data.style)
  }
  static parse(p: string) {
    const coefStr = p.match(/^d+/)
    const coef = coefStr ? Number(coefStr) : 1
    let style: string = ''
    for (const s of ProductStyles) {
      if (p.substring(p.length - s.length) === s) {
        style = s
      }
    }
    const formula = Formula.parse(p.substring(coefStr ? coefStr.length : 0, p.length - style.length))
    return new Product(formula, coef, style)
  }
  string(pretty: boolean = true) {
    return (this.coef === 1 ? '' : this.coef) + this.formula.string(pretty) + this.style
  }
  clone() {
    return new Product(this.formula.clone(), this.coef, this.style)
  }
}
// Like S+O2=(点燃)SO2
type EquationDataType = {
  reactant: ReactantDataType[]
  product: ProductDataType[],
  condition: string
  description: string
}
export class Equation {
  reactant: Reactant[]
  product: Product[]
  condition: string
  description: string
  constructor(reactant: Reactant[], product: Product[], condition: string = '', description: string = '') {
    this.reactant = reactant
    this.product = product
    this.condition = condition
    this.description = description
  }
  data(): EquationDataType {
    return {
      reactant: this.reactant.map(r => r.data()),
      product: this.product.map(p => p.data()),
      condition: this.condition,
      description: this.description,
    }
  }
  static restore(data: EquationDataType) {
    return new Equation(
      data.reactant.map(r => Reactant.restore(r)),
      data.product.map(p => Product.restore(p)),
      data.condition,
      data.description
    )
  }
  static parse(eq: string) {
    eq = eq.replace(' ', '')
    const res = new Equation([], [])
    // 前缀分析+后缀分析+中间分析
    const index = [-1, -1]
    for (let i = 0; i < eq.length; i++) {
      if (eq[i] === '=') {
        const reactants = eq.substring(0, i).split('+')
        for (let j = 0; j < reactants.length; j++) {
          res.reactant.push(Reactant.parse(reactants[j]))
        }
        index[0] = i
        break
      }
    }
    for (let i = eq.length - 1; i >= 0; i--) {
      if (eq[i] === '=') {
        const products = eq.substring(i + 1).split('+')
        for (let j = 0; j < products.length; j++) {
          res.product.push(Product.parse(products[j]))
        }
        index[1] = i
        break
      }
    }
    res.condition = index[0] < index[1] ? eq.substring(index[0] + 1, index[1]) : ''
    if (index[0] === -1) {
      throw Error('Invalid Equation')
    }
    return res
  }
  string(pretty: boolean = true) {
    return this.reactant.map(r => r.string(pretty)).join('+') + (this.condition ? `=${this.condition}=` : '=') + this.product.map(p => p.string(pretty)).join('+')
  }
  deepEqual(e: Equation) {
    return deepEqual(this, e)
  }
  clone() {
    return new Equation(this.reactant.map(r => r.clone()), this.product.map(p => p.clone()), this.condition, this.description)
  }
  set(equ: Equation) {
    this.reactant = equ.reactant.map(r => r.clone())
    this.product = equ.product.map(p => p.clone())
    this.condition = equ.condition
    this.description = equ.description
  }
}


// node for view
type FormulaNodeDataType = {
  formula: FormulaDataType,
  pos: VectorDataType,
  hidden: boolean,
}
export enum NodeStyle {
  normal,
  selected,
  unselected,
  hidden,
  shown,
}
type StylePackageType = {
  color?: { v: [number, number, number], d: number }
  opacity?: { v: number, d: number },
  zoon?: { v: number, d: number },
  shadowOpacity?: { v: number, d: number },
  shadowBlur?: { v: number, d: number },
}
export const styleDefaultPackages: StylePackageType[] = [
  {
    color: { v: [4, 180, 153], d: 300 },
    opacity: { v: 1, d: 300 },
    zoon: { v: 1, d: 300 },
    shadowOpacity: { v: 0, d: 300 },
    shadowBlur: { v: 0, d: 300 },
  },
  {
    color: { v: [4, 180, 153], d: 300 },
    opacity: { v: 1, d: 300 },
    zoon: { v: 1.2, d: 300 },
    shadowOpacity: { v: 0.7, d: 300 },
    shadowBlur: { v: 1, d: 300 },
  },
  {
    color: { v: [4, 180, 153], d: 300 },
    opacity: { v: 0.1, d: 300 },
    zoon: { v: 0.9, d: 300 },
    shadowOpacity: { v: 0, d: 300 },
    shadowBlur: { v: 0, d: 300 },
  },
  {
    color: { v: [4, 180, 153], d: 300 },
    opacity: { v: 0, d: 300 },
    zoon: { v: 0, d: 300 },
    shadowOpacity: { v: 0, d: 300 },
    shadowBlur: { v: 0, d: 300 },
  },
  {
    color: { v: [62, 130, 190], d: 300 },
    opacity: { v: 1, d: 300 },
    zoon: { v: 1.3, d: 300 },
    shadowOpacity: { v: 1, d: 300 },
    shadowBlur: { v: 1.5, d: 300 },
  },
]
export class FormulaNode {
  formula: Formula
  pos: Vector
  react: FormulaNode[]
  produce: FormulaNode[]
  posLocked: boolean = false
  style = {
    type: NodeStyle.normal,
    animationId: null as number | null,
    attrs: {
      color: new TransitionColor([4, 180, 153]),
      opacity: new Transition(1),
      zoon: new Transition(1),
      shadowOpacity: new Transition(0),
      shadowBlur: new Transition(0),
    },
    bg() {
      return `rgba(${this.attrs.color.value.r},${this.attrs.color.value.g},${this.attrs.color.value.b},${this.attrs.opacity.value})`
    },
    shadow() {
      return `rgba(${this.attrs.color.value.r},${this.attrs.color.value.g},${this.attrs.color.value.b},${this.attrs.shadowOpacity.value})`
    },
  }
  constructor(formula: Formula, pos: Vector = new Vector(), react: FormulaNode[] = [], produce: FormulaNode[] = []) {
    this.formula = formula
    this.pos = pos
    this.react = react
    this.produce = produce
    for (const k in this.style.attrs) {
      this.style.attrs[k as keyof typeof this.style.attrs].onchange = Draw
    }
  }
  setStyle(styleType: NodeStyle, pkg: StylePackageType = styleDefaultPackages[styleType]) {
    this.style.type = styleType
    for (const attr in pkg) {
      const k = attr as keyof typeof this.style.attrs & keyof typeof pkg
      this.style.attrs[k].duration = pkg[k]!.d
      this.style.attrs[k].value = pkg[k]!.v as any
    }
  }
  data(): FormulaNodeDataType {
    return {
      formula: this.formula.data(),
      pos: this.pos.data(),
      hidden: this.style.type === NodeStyle.hidden
    }
  }
  static restore(data: FormulaNodeDataType) {
    const res = new FormulaNode(Formula.restore(data.formula), Vector.restore(data.pos))
    if (data.hidden) {
      res.setStyle(NodeStyle.hidden, {
        color: { v: [4, 180, 153], d: 0 },
        opacity: { v: 0, d: 0 },
        zoon: { v: 0, d: 0 },
        shadowOpacity: { v: 0, d: 0 },
        shadowBlur: { v: 0, d: 0 },
      })
    }
    return res
  }
}

// Stores

function analyzeEquation() {
  for (const n of state.nodes) {
    n.react = []
    n.produce = []
  }
  for (const equ of state.equations) {
    for (const r1 of equ.reactant) {
      const n1 = getNode(r1.formula)
      if (!n1) continue
      for (const r2 of equ.reactant) {
        if (r1 !== r2) {
          const n2 = getNode(r2.formula)
          if (!n2) continue
          n1.react.push(n2)
          n2.react.push(n1)
        }
      }
      for (const p of equ.product) {
        const n2 = getNode(p.formula)
        if (!n2) continue
        n1.produce.push(n2)
      }
    }
  }
}
function getNode(f: Formula) {
  return state.nodes.find((n, i) => n.formula.deepEqual(f))
}


const state = reactive<{
  equations: Equation[],
  nodes: FormulaNode[],
  OPos: Vector,
  zoon: number,
}>({
  equations: [
    Equation.parse('CO2+H2O=H2CO3'),
    Equation.parse('H2CO3=CO2+H2O'),
    Equation.parse('CO2+Ca(OH)2=CaCO3+H2O'),
    Equation.parse('CaO+H2O=Ca(OH)2'),
  ],
  nodes: [
    new FormulaNode(Formula.parse('CO2')),
    new FormulaNode(Formula.parse('CaO')),
    new FormulaNode(Formula.parse('Ca(OH)2')),
    new FormulaNode(Formula.parse('CaCO3')),
    new FormulaNode(Formula.parse('H2O')),
    new FormulaNode(Formula.parse('H2CO3')),
  ],
  OPos: new Vector(),
  zoon: 1,
})



type DataType = {
  equations: EquationDataType[],
  nodes: FormulaNodeDataType[],
  view: {
    OPos: VectorDataType,
    zoon: number,
  }
}

const storageKey = 'chemistry-inference'
let copy: DataType | null = null

function toStorage() {
  localStorage.setItem(storageKey, formJson())
}
function fromStorage() {
  // localStorage.clear()
  const data = localStorage.getItem(storageKey)
  if (data) {
    try {
      restoreJson(data)
    } catch { }
  }
}

function addNode(node: FormulaNode) {
  if (state.nodes.find(n => n.formula.deepEqual(node.formula))) {
    throw Error('formula repeat')
  } else {
    state.nodes.push(node)
    analyzeEquation()
  }
}
function deleteNode(node: FormulaNode) {
  state.nodes = state.nodes.filter(n => n !== node)
  analyzeEquation()
}
function addEquation(equ: Equation) {
  if (state.equations.filter(e => e.deepEqual(equ)).length) {
    throw Error('repeat equation')
  } else {
    state.equations.push(equ)
    analyzeEquation()
  }
}
function deleteEquation(equ: Equation) {
  state.equations = state.equations.filter(e => !e.deepEqual(equ))
  analyzeEquation()
}

function formJson() {
  return JSON.stringify(formData(), null, 2)
}
function formData() {
  return {
    equations: state.equations.map(eq => eq.data()),
    nodes: state.nodes.map(v => v.data()),
    view: {
      OPos: state.OPos.data(),
      zoon: state.zoon,
    }
  }
}
function restoreJson(json: string) {
  restoreData(JSON.parse(json))
}
function restoreData(data: DataType) {
  state.equations = data.equations.map(e => Equation.restore(e))
  state.nodes = data.nodes.map(n => FormulaNode.restore(n))
  state.OPos.set(Vector.restore(data.view.OPos))
  state.zoon = data.view.zoon
  analyzeEquation()
}
function saveCopyData() {
  copy = deepClone(formData())
}

function toView(v: Vector) {
  return v.mul(state.zoon).add(state.OPos)
}
function toSpace(v: Vector) {
  return v.sub(state.OPos).div(state.zoon)
}
function fromCopy() {
  if (copy === null) {
    throw Error('copy data is null')
  }
  restoreData(copy)
}
export function useFormulaStore() {
  return {
    state,
    toStorage,
    fromStorage,

    addNode,
    deleteNode,
    addEquation,
    deleteEquation,

    formData,
    restoreJson,
    restoreData,
    saveCopyData,
    fromCopy,

    toView,
    toSpace,
  }
}




