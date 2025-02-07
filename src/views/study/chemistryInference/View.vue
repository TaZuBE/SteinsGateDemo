<script lang="ts" setup>
import { ref, onMounted, nextTick, computed, watch, onUnmounted, reactive } from 'vue'
import './data'
import { Formula, FormulaNode, styleDefaultPackages } from './data'
import { Vector } from '@/assets/scripts/data'
import { down, up } from '@/assets/scripts/algorithm'
import { useFormulaStore, NodeStyle, share } from './data'
import AddFormula from './AddFormula.vue'
import ManageFormulaNode from './ManageFormulaNode.vue'
import AddEquation from './AddEquation.vue'
import ManageEquation from './ManageEquation.vue'
import FunctionButton from './FunctionButton.vue'
import ControlPanel from './ControlPanel.vue'
import ResizableWindow from '@/components/ResizableWindow.vue'
import Test from './test.vue'
import type { ZoomIn } from '@material-ui/icons'
import FilterTag from './FilterTag.vue'

// store
const store = useFormulaStore()
watch(store.state, () => {
  Draw()
})
store.view.zoon.ontransition((v: number, t: number, dv: number) => {
  if (Number.isNaN(CVS.wheel.cursor2OPos.x)) return
  store.view.OPos.doAdd(CVS.wheel.cursor2OPos.mul(dv))
  Draw()
})

// constants
const
  NODE = {
    ORIGINAL_RADIUS: 30,
    RADIUS: (): number => NODE.ORIGINAL_RADIUS * store.view.zoon.value,
    ORIGINAL_FIXED: 5,
    FIXED: (): number => NODE.ORIGINAL_FIXED * store.view.zoon.value,
  },
  LINE = {
    WIDTH: 1.5,
    COLOR: '#50def1b8',
  },
  ARROW = {
    ORIGINAL_RADIUS: 10,
    LENGTH: (): number => ARROW.ORIGINAL_RADIUS * store.view.zoon.value,
    ANGLE: Math.PI / 6,
  },
  ZOON = {
    MIN: 0.3,
    MAX: 3,
    SPEED: 1,
  },
  GRID = {
    GAP: 100,
    COLOR: 'rgba(255, 255, 255, 0.1)',
  }

// props
const props = defineProps({
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
})

// watch
const watchWidth = watch(() => props.width, (newVal: number) => {
  canvasCssSize.width = newVal
  resizeCanvas()
})
const watchHeight = watch(() => props.height, (newVal: number) => {
  canvasCssSize.height = newVal
  resizeCanvas()
})

// lifecycle
onMounted(() => {
  window.addEventListener('keydown', windowKeydown)
  window.addEventListener('unload', finish)
  store.repel()
})
function finish() {
  window.removeEventListener('unload', finish)
  window.removeEventListener('keydown', windowKeydown)
  watchWidth()
  watchHeight()
}
onUnmounted(finish)

function windowKeydown(e: KeyboardEvent) {
  if (!e.shiftKey) return
  for (const ctx of CVS.menu.view.ctxs) {
    if (ctx.shortcut && (e.key === ctx.shortcut || e.key === ctx.shortcut.toLowerCase())) {
      ctx.click()
      e.preventDefault()
    }
  }
}

// canvas
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
const canvasCssSize = reactive({ width: 0, height: 0 })
const canvasNaturalSize = computed({
  get: () => {
    return {
      width: canvasCssSize.width * window.devicePixelRatio,
      height: canvasCssSize.height * window.devicePixelRatio
    }
  },
  set: () => { }
})
let repeling = false

const resizeCanvas = () => {
  if (!canvas.value) return
  canvas.value.width = canvasNaturalSize.value.width
  canvas.value.height = canvasNaturalSize.value.height
  ctx = canvas.value.getContext('2d')
  if (!ctx) return
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  nextTick(painter.draw)
}
function lineStyle(a: FormulaNode, b: FormulaNode) {
  const color = canvas.value!.getContext('2d')!.createLinearGradient(...store.toView(a.pos).tuple(), ...store.toView(b.pos).tuple())
  color.addColorStop(0, `rgba(78, 197, 241, ${a.style.attrs.opacity.value})`)
  color.addColorStop(1, `rgba(78, 197, 241, ${b.style.attrs.opacity.value})`)
  return {
    color: color
  }
}
const CVS = {
  mousedown: {
    fPos: new Vector(),
    isClick: false,
  },
  onMousedown(e: MouseEvent) {
    if (e.button !== 0) {
      return
    }
    document.body.classList.add('select-none')
    CVS.mousedown = {
      fPos: new Vector(e.clientX, e.clientY),
      isClick: true,
    }
    const view = {
      onMousemove(e: MouseEvent) {
        CVS.mousedown.isClick = false
        store.view.OPos.doAdd(new Vector(e.clientX, e.clientY).sub(CVS.mousedown.fPos))
        CVS.mousedown.fPos = new Vector(e.clientX, e.clientY)
        Draw()
      },
      onMouseup() {
        if (CVS.mousedown.isClick) {
          view.click()
        }
        document.body.classList.remove('select-none')
        window.removeEventListener('mousemove', view.onMousemove)
        window.removeEventListener('mouseup', view.onMouseup)
      },
      click() {
        CVS.menu.hide()
        for (const n of store.state.nodes) {
          if (n.style.type === NodeStyle.shown || n.style.type !== NodeStyle.hidden) {
            n.setStyle(NodeStyle.normal)
          }
        }
      },
    }
    const node = {
      onMousemove(e: MouseEvent) {
        CVS.mousedown.isClick = false
        targetNode.pos.doAdd(new Vector(e.clientX, e.clientY).sub(CVS.mousedown.fPos).div(store.view.zoon.value))
        CVS.mousedown.fPos = new Vector(e.clientX, e.clientY)
        if (targetNode.pos.distance(CVS.menu.node.pos) > 100 && CVS.menu.node.on) {
          CVS.menu.hide()
        }
        Draw()
        store.repel()
      },
      onMouseup(e: MouseEvent) {
        if (CVS.mousedown.isClick) {
          node.click()
        }
        document.body.classList.remove('select-none')
        targetNode.posLocked = false
        window.removeEventListener('mousemove', node.onMousemove)
        window.removeEventListener('mouseup', node.onMouseup)
      },
      click() {
        CVS.menu.hide()
        for (const n of store.state.nodes) {
          if (n.style.type === NodeStyle.shown || n.style.type !== NodeStyle.hidden) {
            n.setStyle(NodeStyle.normal)
          }
        }
        targetNode.setStyle(NodeStyle.shown)
      },
    }

    const mouseSpace = store.toSpace(new Vector(e.clientX - canvas.value!.getBoundingClientRect().left, e.clientY - canvas.value!.getBoundingClientRect().top))
    const targetNode = store.state.nodes.filter(n => n.style.type !== NodeStyle.hidden && n.pos.to(mouseSpace).len() < NODE.ORIGINAL_RADIUS + NODE.ORIGINAL_FIXED).sort((a, b) => a.pos.to(mouseSpace).len() - b.pos.to(mouseSpace).len())[0]
    if (targetNode) {
      targetNode.posLocked = true
      window.addEventListener('mousemove', node.onMousemove)
      window.addEventListener('mouseup', node.onMouseup)
    } else {
      window.addEventListener('mousemove', view.onMousemove)
      window.addEventListener('mouseup', view.onMouseup)
    }
  },
  wheel: {
    cursor2OPos: new Vector(),
  },
  onWheel(e: WheelEvent) {
    const cursorPos = new Vector(e.clientX - canvas.value!.getBoundingClientRect().left, e.clientY - canvas.value!.getBoundingClientRect().top)
    CVS.wheel.cursor2OPos = cursorPos.to(store.view.OPos).div(store.view.zoon.value)
    const zooned = (1 - e.deltaY / 1000) * ZOON.SPEED
    const newZoon = Math.max(Math.min(store.view.zoon.endValue * zooned, ZOON.MAX), ZOON.MIN)
    store.view.zoon.value = newZoon
  },
  menu: reactive({
    node: {
      target: null as null | FormulaNode,
      on: false,
      pos: new Vector(),
      ctxs: [
        {
          text: '隐藏节点',
          click() {
            const t = CVS.menu.node.target!
            t.setStyle(NodeStyle.hidden)
            t.hidden = true
            for (const n of store.state.nodes) {
              if (n.style.type === NodeStyle.unselected) {
                n.setStyle(NodeStyle.normal)
              }
            }
            CVS.menu.hide()
          }
        },
        {
          text: '删除节点',
          click() {
            store.deleteNode(CVS.menu.node.target!)
            CVS.menu.hide()
          }
        },
      ] as { text: string, sec?: { text: string, click: (payload: MouseEvent) => void }[], display?: boolean, update?: Function, click: (payload: MouseEvent) => void }[],
    },
    view: {
      on: false,
      pos: new Vector(),
      scale: 1,
      ctxs: [
        // 0
        {
          text: '显示节点',
          sec: computed(() =>
            store.state.nodes.filter(node => node.hidden).map(n => ({
              text: n.formula.string(),
              click(e: MouseEvent) {
                e.stopPropagation()
                if (n.filtered) {
                  n.setStyle(NodeStyle.normal)
                }
                n.hidden = false
                store.repel()
              },
            }))
          ),
          display: computed(() => store.state.nodes.filter(n => n.hidden).length),
          shortcut: 'V',
          click() {
            store.state.nodes.forEach(n => {
              if (n.filtered) {
                n.setStyle(NodeStyle.normal)
              }
              n.hidden = false
            })
            store.repel()
            CVS.menu.hide()
          }
        },
        // 1
        {
          text: '隐藏节点',
          sec: computed(() =>
            store.state.nodes.filter(node => !node.hidden).map(n => ({
              text: n.formula.string(),
              click(e: MouseEvent) {
                e.stopPropagation()
                if (n.style.type !== NodeStyle.hidden) {
                  n.setStyle(NodeStyle.hidden)
                }
                n.hidden = true
              },
            }))
          ),
          display: computed(() => store.state.nodes.filter(n => !n.hidden).length),
          shortcut: 'H',
          click() {
            store.state.nodes.forEach(n => {
              n.setStyle(NodeStyle.hidden)
              n.hidden = true
            })
            CVS.menu.view.on = false
          }
        },
        // 2
        {
          text: '添加化学式',
          extra: {
            display: false,
            pos: new Vector(),
            width: 640,
            height: 480,
            scale: 1,
            z: 0,
          },
          click() {
            const ctx = CVS.menu.view.ctxs[2]
            CVS.menu.view.setTopic(2)
            const center = store.toSpace(new Vector(canvas.value!.clientWidth / 2, canvas.value!.clientHeight))
            ctx.extra.display = true
            ctx.extra.scale = 1 / store.view.zoon.value
            ctx.extra.pos = CVS.menu.view.on ? CVS.menu.view.pos.clone() : center.sub(new Vector(ctx.extra.width, ctx.extra.height).mul(0.5 * ctx.extra.scale))
            CVS.menu.hide()
          },
        },
        // 3
        {
          text: '管理化学式',
          extra: {
            display: false,
            pos: new Vector(),
            width: 800,
            height: 500,
            scale: 1,
            z: -1,
          },
          shortcut: 'F',
          click() {
            const ctx = CVS.menu.view.ctxs[3]
            CVS.menu.view.setTopic(3)
            const center = store.toSpace(new Vector(canvasCssSize.width / 2, canvasCssSize.height / 2))
            ctx.extra.display = true
            ctx.extra.scale = 1 / store.view.zoon.value
            ctx.extra.pos = CVS.menu.view.on ? CVS.menu.view.pos.clone() : center.sub(new Vector(ctx.extra.width, ctx.extra.height).mul(0.5 * ctx.extra.scale))
            CVS.menu.hide()
          },
        },
        // 4
        {
          text: '添加方程式',
          extra: {
            display: false,
            pos: new Vector(),
            width: 640,
            height: 480,
            scale: 1,
            z: -2,
          },
          click() {
            const ctx = CVS.menu.view.ctxs[4]
            CVS.menu.view.setTopic(4)
            const center = store.toSpace(new Vector(canvasCssSize.width / 2, canvasCssSize.height / 2))
            ctx.extra.display = true
            ctx.extra.scale = 1 / store.view.zoon.value
            ctx.extra.pos = CVS.menu.view.on ? CVS.menu.view.pos.clone() : center.sub(new Vector(ctx.extra.width, ctx.extra.height).mul(0.5 * ctx.extra.scale))
            CVS.menu.hide()
          },
        },
        // 5
        {
          text: '管理方程式',
          extra: {
            display: false,
            pos: new Vector(),
            width: 800,
            height: 500,
            scale: 1,
            z: -3,
          },
          shortcut: 'E',
          click() {
            const ctx = CVS.menu.view.ctxs[5]
            CVS.menu.view.setTopic(5)
            const center = store.toSpace(new Vector(canvasCssSize.width / 2, canvasCssSize.height / 2))
            ctx.extra.display = true
            ctx.extra.scale = 1 / store.view.zoon.value
            ctx.extra.pos = CVS.menu.view.on ? CVS.menu.view.pos.clone() : center.sub(new Vector(ctx.extra.width, ctx.extra.height).mul(0.5 * ctx.extra.scale))
            CVS.menu.hide()
          },
        },
        // 6
        {
          text: '集合节点',
          shortcut: 'G',
          click() {
            if (!canvas.value) return
            const centerSpace = store.toSpace(new Vector(canvasCssSize.width / 2, canvasCssSize.height / 2))
            const gather = CVS.menu.view.on ? CVS.menu.view.pos : centerSpace
            for (const n of store.state.nodes) {
              n.pos.set(gather)
            }
            store.repel()
            CVS.menu.hide()
          }
        },
        // 7
        {
          text: '控制面板',
          shortcut: 'C',
          extra: {
            display: false,
            pos: new Vector(),
            width: 400,
            height: 300,
            scale: 1,
            z: -4,
          },
          click() {
            const ctx = CVS.menu.view.ctxs[7]
            CVS.menu.view.setTopic(7)
            const center = store.toSpace(new Vector(canvasCssSize.width / 2, canvasCssSize.height / 2))
            ctx.extra.display = true
            ctx.extra.scale = 1 / store.view.zoon.value
            ctx.extra.pos = CVS.menu.view.on ? CVS.menu.view.pos.clone() : center.sub(new Vector(ctx.extra.width, ctx.extra.height).mul(0.5 * ctx.extra.scale))
            CVS.menu.hide()
          }
        },
        // 8
        {
          text: '筛选标签',
          shortcut: 'T',
          extra: {
            display: false,
            pos: new Vector(),
            width: 400,
            height: 300,
            scale: 1,
            z: -5,
          },
          click() {
            const ctx = CVS.menu.view.ctxs[8]
            CVS.menu.view.setTopic(7)
            const center = store.toSpace(new Vector(canvasCssSize.width / 2, canvasCssSize.height / 2))
            ctx.extra.display = true
            ctx.extra.scale = 1 / store.view.zoon.value
            ctx.extra.pos = CVS.menu.view.on ? CVS.menu.view.pos.clone() : center.sub(new Vector(ctx.extra.width, ctx.extra.height).mul(0.5 * ctx.extra.scale))
            CVS.menu.hide()
          }
        },
      ] as { text: string, extra?: any, sec?: { text: string, click: (payload: MouseEvent) => void }[], display?: boolean, shortcut?: string, update?: Function, click: (payload?: MouseEvent) => void }[],
      setTopic(index: number) {
        const ctx = CVS.menu.view.ctxs[index]
        const window = [2, 3, 4, 5, 7, 8]
        for (const i of window) {
          if (CVS.menu.view.ctxs[i].extra.z > ctx.extra.z) {
            CVS.menu.view.ctxs[i].extra.z--
          }
        }
        ctx.extra.z = 0
      }
    },
    hide() {
      CVS.menu.node.on = false
      CVS.menu.view.on = false
    },
  }),
  onMenu(e: MouseEvent) {
    e.preventDefault()
    CVS.menu.hide()
    const mouse = new Vector(e.clientX, e.clientY)
    const mouseSpace = store.toSpace(mouse.sub(new Vector(canvas.value!.getBoundingClientRect().left, canvas.value!.getBoundingClientRect().top)))
    const targetNode: FormulaNode | undefined = store.state.nodes.filter(f => f.style.type !== NodeStyle.hidden && mouseSpace.distance(f.pos) < NODE.ORIGINAL_RADIUS + NODE.ORIGINAL_FIXED).sort((a, b) => a.pos.distance(mouseSpace) - b.pos.distance(mouseSpace))[0]
    if (targetNode) {
      for (const ctx of CVS.menu.node.ctxs) {
        if (ctx.update) {
          ctx.update()
        }
      }
      CVS.menu.node.target = targetNode
      CVS.menu.node.on = true
      CVS.menu.node.pos.set(mouseSpace)
      targetNode.setStyle(NodeStyle.selected)
      for (const n of store.state.nodes) {
        if (n !== targetNode && n.style.type !== NodeStyle.hidden) {
          n.setStyle(NodeStyle.unselected)
        }
      }
    } else {
      for (const ctx of CVS.menu.view.ctxs) {
        if (ctx.update) {
          ctx.update()
        }
      }
      CVS.menu.view.on = true
      CVS.menu.view.pos.set(mouseSpace)
      CVS.menu.view.scale = 1 / store.view.zoon.value
    }
  },
}



const painter = {
  // 不完全作画
  drawBg(n: FormulaNode) {
    if (!ctx) return
    const p = store.toView(n.pos)
    ctx.beginPath()
    ctx.shadowColor = n.style.shadow()
    ctx.shadowBlur = NODE.RADIUS() * n.style.attrs.zoon.value * (n.style.attrs.shadowBlur.value + 1)

    ctx.arc(p.x, p.y, NODE.RADIUS() * n.style.attrs.zoon.value, 0, Math.PI * 2)
    ctx.fillStyle = n.style.bg()
    ctx.fill()
    ctx.closePath()

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  },
  drawLine(a: FormulaNode, b: FormulaNode, angle: number = 0) {
    if (!ctx) return
    const style = lineStyle(a, b)
    const p1 = store.toView(a.pos), p2 = store.toView(b.pos)
    const a2b = p1.to(p2).normalize().rotate(angle)
    const b2a = p2.to(p1).normalize().rotate(-angle)
    const t1 = p1.add(a2b.mul(NODE.RADIUS() * a.style.attrs.zoon.value)),
      t2 = p2.add(b2a.mul(NODE.RADIUS() * b.style.attrs.zoon.value))
    ctx.beginPath()
    ctx.strokeStyle = style.color
    ctx.lineWidth = LINE.WIDTH
    ctx.moveTo(t1.x, t1.y)
    ctx.lineTo(t2.x, t2.y)
    ctx.stroke()
    ctx.closePath()
  },
  draw2way1side(a: FormulaNode, b: FormulaNode, angle: number = Math.PI * -0.04) {
    if (!ctx) return
    const style = lineStyle(a, b)
    const p1 = store.toView(a.pos), p2 = store.toView(b.pos)
    const a2b = p1.to(p2).normalize()
    ctx.beginPath()
    ctx.strokeStyle = style.color
    ctx.lineWidth = LINE.WIDTH
    ctx.moveTo(...p1.add(a2b.rotate(angle).mul(NODE.RADIUS() * a.style.attrs.zoon.value)).tuple())
    ctx.lineTo(...p2.sub(a2b.rotate(-angle).mul(NODE.RADIUS() * b.style.attrs.zoon.value)).tuple())
    ctx.lineTo(...p2.sub(a2b.rotate(-angle).mul(NODE.RADIUS() * b.style.attrs.zoon.value)).sub(a2b.rotate(ARROW.ANGLE).mul(ARROW.LENGTH())).tuple())
    ctx.stroke()
    ctx.closePath()
  },
  draw1wayLine(a: FormulaNode, b: FormulaNode) {
    if (!ctx) return
    const style = lineStyle(a, b)
    painter.drawLine(a, b)
    const p1 = store.toView(a.pos), p2 = store.toView(b.pos)
    const b2a = p2.to(p1).normalize()
    const t = p2.add(b2a.mul(NODE.RADIUS() * b.style.attrs.zoon.value))
    ctx.beginPath()
    ctx.strokeStyle = style.color
    ctx.lineWidth = LINE.WIDTH
    ctx.moveTo(...t.add(b2a.rotate(ARROW.ANGLE).mul(ARROW.LENGTH())).tuple())
    ctx.lineTo(...t.tuple())
    ctx.lineTo(...t.add(b2a.rotate(-ARROW.ANGLE).mul(ARROW.LENGTH())).tuple())
    ctx.stroke()
    ctx.closePath()
  },
  draw2wayLine(a: FormulaNode, b: FormulaNode) {
    if (!ctx) return
    painter.draw2way1side(a, b)
    painter.draw2way1side(b, a)
  },

  // 完全作画
  drawR(a: FormulaNode, b: FormulaNode) {
    painter.drawLine(a, b)
  },
  drawP(a: FormulaNode, b: FormulaNode) {
    painter.draw1wayLine(a, b)
  },
  drawPP(a: FormulaNode, b: FormulaNode) {
    painter.draw2way1side(a, b)
    painter.draw2way1side(b, a)
  },
  drawRP(a: FormulaNode, b: FormulaNode) {
    painter.drawLine(a, b, Math.PI * 0.03)
    painter.draw2way1side(a, b, Math.PI * -0.03)
  },
  drawRPP(a: FormulaNode, b: FormulaNode) {
    painter.drawLine(a, b)
    painter.draw2way1side(a, b)
    painter.draw2way1side(b, a)
  },
  drawSide(a: FormulaNode, b: FormulaNode) {
    if (!ctx) return
    const react = a.react.find(n => n.formula.deepEqual(b.formula))
    const produce = a.produce.find(n => n.formula.deepEqual(b.formula))
    const produced = b.produce.find(n => n.formula.deepEqual(a.formula))
    if (react) {
      if (produce) {
        if (produced) {
          painter.drawRPP(a, b)
        } else {
          painter.drawRP(a, b)
        }
      } else if (produced) {
        painter.drawRP(b, a)
      } else {
        painter.drawR(a, b)
      }
    } else if (produce) {
      if (produced) {
        painter.drawPP(b, a)
      } else {
        painter.drawP(a, b)
      }
    } else if (produced) {
      painter.drawP(b, a)
    }
  },
  drawFormula(f: FormulaNode) {
    if (!ctx) return;
    const text = f.formula.string()
    const presize = 20 * store.view.zoon.value * f.style.attrs.zoon.value
    ctx.font = `${presize}px Arial`
    const textWidth = ctx.measureText(text).width
    ctx.font = `${presize * Math.min((NODE.RADIUS() * f.style.attrs.zoon.value - NODE.FIXED() * 0.5) * 2 / textWidth, 1)}px Arial`
    ctx.fillStyle = `rgba(256, 256, 256, ${f.style.attrs.opacity.value})`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, ...store.toView(f.pos).tuple())
  },
  drawGrid() {
    if (!ctx) return
    for (let i = store.toView(new Vector(down(store.toSpace(new Vector(0, 0)).x, GRID.GAP), 0)).x;
      i < canvasNaturalSize.value.width;
      i += GRID.GAP * store.view.zoon.value) {
      for (let j = store.toView(new Vector(0, down(store.toSpace(new Vector(0, 0)).y, GRID.GAP))).y;
        j < canvasNaturalSize.value.height;
        j += GRID.GAP * store.view.zoon.value) {
        const r = 5 * store.view.zoon.value
        ctx.beginPath()
        ctx.strokeStyle = GRID.COLOR
        ctx.lineWidth = 1 + store.view.zoon.value * 0.5
        ctx.moveTo(i - r, j)
        ctx.lineTo(i + r, j)
        ctx.moveTo(i, j - r)
        ctx.lineTo(i, j + r)
        ctx.stroke()
        ctx.closePath()
      }
    }
  },
  drawBarycenter() {
    if (!ctx) return
    const pos = store.toView(store.barycenter())
    ctx.strokeStyle = '#5c5'
    const r = 5 * store.view.zoon.value, c = 3
    for (let i = 0; i < c; i++) {
      ctx.beginPath()
      ctx.arc(...pos.tuple(), r * (i + 1), 0, Math.PI * 2)
      ctx.stroke()
      ctx.closePath()
    }
  },

  // 最终作画
  draw: () => {
    if (!ctx) return
    ctx.clearRect(0, 0, canvasNaturalSize.value.width, canvasNaturalSize.value.height)
    if (store.control.grid) {
      painter.drawGrid()
    }
    const nodes = store.state.nodes
    if (store.control.side) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].style.type !== NodeStyle.hidden && nodes[j].style.type !== NodeStyle.hidden) {
            painter.drawSide(nodes[i], nodes[j])
          }
        }
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      painter.drawBg(nodes[i])
      painter.drawFormula(nodes[i])
    }
    if (store.control.barycenter) {
      painter.drawBarycenter()
    }
  }
}

let drawDone = false
function Draw() {
  if (!drawDone) {
    painter.draw()
    drawDone = true
    requestAnimationFrame(() => drawDone = false)
  }
}

share(Draw)

</script>


<template>
  <canvas ref="canvas" :style="{ width: `${canvasCssSize.width}px`, height: `${canvasCssSize.height}px` }"
    class="absolute left-0 top-0" @mousedown="CVS.onMousedown" @wheel="CVS.onWheel" @contextmenu.prevent="CVS.onMenu">
  </canvas>

  <div class="menu-container node-menu-container z-999" :style="{
    left: `${store.toView(CVS.menu.node.pos).x}px`,
    top: `${store.toView(CVS.menu.node.pos).y}px`,
    opacity: `${CVS.menu.node.on ? 100 : 0}%`,
    transform: `scale(${store.view.zoon.value})`,
    pointerEvents: CVS.menu.node.on ? 'all' : 'none',
  }" @wheel="CVS.onWheel">
    <div class="menu-inner menu" :style="{
      transform: `scaleY(${CVS.menu.node.on ? 1 : 0})`
    }">
      <div v-for="ctx in CVS.menu.node.ctxs" class="menu-ctx-container" :style="{
        filter: `brightness(${ctx.display === undefined || ctx.display ? 1 : 0.5})`,
        pointerEvents: ctx.display === undefined || ctx.display ? 'all' : 'none',
      }" @click="ctx.click">
        <div>
          <span>{{ ctx.text }}</span>
          <span v-if="ctx.sec" style="float: right">></span>
          <div v-if="ctx.sec" class="sec-menu menu">
            <div v-for="sec in ctx.sec" class="menu-ctx-container" @click="sec.click">
              <div>{{ sec.text }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="menu-container view-menu-container z-999" :style="{
    left: `${store.toView(CVS.menu.view.pos).x}px`,
    top: `${store.toView(CVS.menu.view.pos).y}px`,
    opacity: `${CVS.menu.view.on ? 100 : 0}%`,
    transform: `scale(${store.view.zoon.value * CVS.menu.view.scale})`,
    pointerEvents: CVS.menu.view.on ? 'all' : 'none',
  }" @wheel="CVS.onWheel">
    <div class="menu-inner menu" :style="{
      transform: `scaleY(${CVS.menu.view.on ? 1 : 0})`
    }">
      <div v-for="ctx in CVS.menu.view.ctxs" class="menu-ctx-container" :style="{
        filter: `brightness(${ctx.display === undefined || ctx.display ? 1 : 0.5})`,
        pointerEvents: ctx.display === undefined || ctx.display ? 'all' : 'none',
      }" @click="ctx.click">
        <div class="grid grid-cols-[1fr_16px] gap-2">
          <span>
            <span>{{ ctx.text }}</span>
            <span v-if="ctx.shortcut" class="float-right font-mono">Shift+{{ ctx.shortcut }}</span>
          </span>
          <span v-if="ctx.sec">></span>
          <div v-if="ctx.sec" class="sec-menu menu">
            <div v-for="sec in ctx.sec" class="menu-ctx-container" @click="sec.click">
              <div>{{ sec.text }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <AddFormula v-model:display="CVS.menu.view.ctxs[2].extra.display" :pos="CVS.menu.view.ctxs[2].extra.pos"
    v-model:width="CVS.menu.view.ctxs[2].extra.width" v-model:height="CVS.menu.view.ctxs[2].extra.height"
    v-model:scale="CVS.menu.view.ctxs[2].extra.scale" :style="{
      zIndex: 10 + CVS.menu.view.ctxs[2].extra.z
    }" @mousedown="CVS.menu.view.setTopic(2); CVS.menu.hide()">
  </AddFormula>
  <ManageFormulaNode v-model:pos="CVS.menu.view.ctxs[3].extra.pos" v-model:display="CVS.menu.view.ctxs[3].extra.display"
    v-model:width="CVS.menu.view.ctxs[3].extra.width" v-model:height="CVS.menu.view.ctxs[3].extra.height"
    v-model:scale="CVS.menu.view.ctxs[3].extra.scale" v-model:ctxs="CVS.menu.view.ctxs" :style="{
      zIndex: 10 + CVS.menu.view.ctxs[3].extra.z
    }" @mousedown="CVS.menu.view.setTopic(3); CVS.menu.hide()">
  </ManageFormulaNode>

  <AddEquation v-model:display="CVS.menu.view.ctxs[4].extra.display" :pos="CVS.menu.view.ctxs[4].extra.pos"
    v-model:width="CVS.menu.view.ctxs[4].extra.width" v-model:height="CVS.menu.view.ctxs[4].extra.height"
    v-model:scale="CVS.menu.view.ctxs[4].extra.scale" :style="{
      zIndex: 10 + CVS.menu.view.ctxs[4].extra.z
    }" @mousedown="CVS.menu.view.setTopic(4); CVS.menu.hide()">
  </AddEquation>
  <ManageEquation v-model:pos="CVS.menu.view.ctxs[5].extra.pos" v-model:display="CVS.menu.view.ctxs[5].extra.display"
    v-model:width="CVS.menu.view.ctxs[5].extra.width" v-model:height="CVS.menu.view.ctxs[5].extra.height"
    v-model:scale="CVS.menu.view.ctxs[5].extra.scale" v-model:ctxs="CVS.menu.view.ctxs" :style="{
      zIndex: 10 + CVS.menu.view.ctxs[5].extra.z
    }" @mousedown="CVS.menu.view.setTopic(5); CVS.menu.hide()">
  </ManageEquation>

  <ControlPanel v-model:pos="CVS.menu.view.ctxs[7].extra.pos" v-model:display="CVS.menu.view.ctxs[7].extra.display"
    v-model:width="CVS.menu.view.ctxs[7].extra.width" v-model:height="CVS.menu.view.ctxs[7].extra.height"
    :scale="CVS.menu.view.ctxs[7].extra.scale" :style="{
      zIndex: 10 + CVS.menu.view.ctxs[7].extra.z,
    }" @mousedown="CVS.menu.view.setTopic(7); CVS.menu.hide()"></ControlPanel>

  <FilterTag v-model:display="CVS.menu.view.ctxs[8].extra.display" v-model:pos="CVS.menu.view.ctxs[8].extra.pos"
    v-model:width="CVS.menu.view.ctxs[8].extra.width" v-model:height="CVS.menu.view.ctxs[8].extra.height"
    :scale="CVS.menu.view.ctxs[8].extra.scale" :style="{
      zIndex: 10 + CVS.menu.view.ctxs[8].extra.z,
    }" @mousedown="CVS.menu.view.setTopic(8); CVS.menu.hide()"></FilterTag>

  <FunctionButton></FunctionButton>

  <!-- <Test></Test> -->

</template>

<style lang="scss" scoped>
$menu-width: 260px;
$sec-menu-width: 140px;
$menu-duration: 200ms;
$menu-p: 5px;
$menu-bg: rgba($color: #222, $alpha: 0.6);

.node-menu-container {
  width: $menu-width;
}

.view-menu-container {
  width: $menu-width;
}

.menu {
  background: $menu-bg;
  width: $menu-width;
  border-radius: 10px;
  padding: $menu-p 0;
  box-shadow: 2px 2px 5px rgba($color: #1d1d1d, $alpha: 0.6);
  font-size: 18px;
}

.menu-container {
  position: absolute;
  transition: opacity ease $menu-duration;
  transform-origin: 0 0;
  user-select: none;
}

.menu-inner {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  transform-origin: 0 0;
  transition: transform ease $menu-duration;
}

.menu-ctx-container {
  padding: 0 $menu-p;
  cursor: pointer;
}

.menu-ctx-container>div {
  position: relative;
  padding: 5px 14px;
  transition: background ease $menu-duration;
  border-radius: 6px;
  color: rgba($color: #dbdbdb, $alpha: 1.0);
  white-space: nowrap;
}

.menu-ctx-container:hover>div {
  background-color: rgba($color: #ffffff, $alpha: 0.05);
}

.menu-ctx-container:hover>div .sec-menu {
  opacity: 1;
  transform: scale(1);
  pointer-events: all;
}

.sec-menu {
  position: absolute;
  width: $sec-menu-width;
  left: 100%;
  top: calc(0px - $menu-p);
  opacity: 0;
  transform: scale(0);
  transform-origin: 0 0;
  pointer-events: none;
  transition: opacity ease $menu-duration, transform ease $menu-duration;
}
</style>