<script lang="ts" setup>
import { Vector } from '@/assets/scripts/data'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

// ne = northeast
enum Area {
  none,
  n,
  ne,
  e,
  se,
  s,
  sw,
  w,
  nw,
}
const cursorStyle = [
  'default',
  'ns-resize',
  'nesw-resize',
  'ew-resize',
  'nwse-resize',
  'ns-resize',
  'nesw-resize',
  'ew-resize',
  'nwse-resize',
]
const FIXED_WIDTH = 2

const props = defineProps({
  resizable: {
    type: Boolean,
    default: true,
  },
  handleWidth: {
    type: Number,
    default: 10,
  },
  cornerOffset: {
    type: Number,
    default: 6,
  },
  minWidth: {
    type: Number,
    default: 100,
  },
  minHeight: {
    type: Number,
    default: 100,
  },
  scale: {
    type: Number,
    default: 1,
  },
  handleVisible: {
    type: Boolean,
    default: false,
  }
})
watch(props, () => {
  if (!props.resizable) {
    document.documentElement.style.cursor = cursorStyle[Area.none]
  }
})
const left = defineModel<number>('left', { default: 0 })
const top = defineModel<number>('top', { default: 0 })
const _width = defineModel<number>('width', { default: 300 })
const _height = defineModel<number>('height', { default: 300 })
const width = computed({
  get() {
    return _width.value * props.scale
  },
  set(v) {
    _width.value = v / props.scale
  }
})
const height = computed({
  get: () => _height.value * props.scale,
  set: v => _height.value = v / props.scale
})
const handleWidth = computed(() => props.handleWidth * props.scale)
const minWidth = computed(() => props.minWidth * props.scale)
const minHeight = computed(() => props.minHeight * props.scale)
const emit = defineEmits(['resize-area'])
const container = ref<HTMLDivElement | null>()
let state = Area.none
let resizing = false
let fcursor = new Vector()
let ftop = 0
let fleft = 0
let fwidth = 0
let fheight = 0

function inRect(p: Vector, nw: Vector, se: Vector) {
  return nw.x <= p.x && p.x <= se.x && nw.y <= p.y && p.y <= se.y
}

function inArea(pos: Vector) {
  if (!container.value) return Area.none
  const rect = container.value.getBoundingClientRect()
  if (rect.width === 0) return Area.none
  const
    top = rect.top,
    right = rect.left + container.value.offsetWidth,
    bottom = rect.top + container.value.offsetHeight,
    left = rect.left
  const
    nw = new Vector(left, top),
    ne = new Vector(right, top),
    se = new Vector(right, bottom),
    sw = new Vector(left, bottom),
    r = new Vector(1, 0),
    d = new Vector(0, 1),
    o = props.cornerOffset,
    w = handleWidth.value / 2
  const inN = inRect(pos,
    nw.add(r.mul(o)).add(d.mul(-w)),
    ne.add(r.mul(-o).add(d.mul(w)))
  )
  const inNE = inRect(pos,
    ne.add(r.mul(-o)).add(d.mul(-w)),
    ne.add(r.mul(o)).add(r.mul(w))
  ) || inRect(pos,
    ne.add(r.mul(-w)).add(d.mul(-w)),
    ne.add(r.mul(w)).add(d.mul(o))
  )
  const inE = inRect(pos,
    ne.add(r.mul(-w)).add(d.mul(o)),
    se.add(r.mul(w)).add(d.mul(-o))
  )
  const inSE = inRect(pos,
    se.add(r.mul(-w)).add(d.mul(-o)),
    se.add(r.mul(o)).add(r.mul(w))
  ) || inRect(pos,
    se.add(r.mul(-o)).add(d.mul(-w)),
    se.add(r.mul(w)).add(d.mul(o))
  )
  const inS = inRect(pos,
    sw.add(r.mul(o)).add(d.mul(-w)),
    se.add(r.mul(-o).add(d.mul(w)))
  )
  const inSW = inRect(pos,
    sw.add(r.mul(-w)).add(d.mul(-o)),
    sw.add(r.mul(o)).add(r.mul(w))
  ) || inRect(pos,
    sw.add(r.mul(-o)).add(d.mul(-w)),
    sw.add(r.mul(w)).add(d.mul(o))
  )
  const inW = inRect(pos,
    nw.add(r.mul(-w)).add(d.mul(o)),
    sw.add(r.mul(w)).add(d.mul(-o))
  )
  const inNW = inRect(pos,
    nw.add(r.mul(-w)).add(d.mul(-o)),
    nw.add(r.mul(o)).add(r.mul(w))
  ) || inRect(pos,
    nw.add(r.mul(-o)).add(d.mul(-w)),
    nw.add(r.mul(w)).add(d.mul(o))
  )
  return inNW ? Area.nw :
    inNE ? Area.ne :
      inSE ? Area.se :
        inSW ? Area.sw :
          inN ? Area.n :
            inE ? Area.e :
              inS ? Area.s :
                inW ? Area.w : Area.none
}

function mousemove(e: MouseEvent) {
  if (resizing || !props.resizable) return
  const cursor = new Vector(e.clientX, e.clientY)
  const area = inArea(cursor)
  if (state !== area) {
    document.documentElement.style.cursor = cursorStyle[area]
    state = area
    emit('resize-area', state)
  }
}

function beginResize(e: MouseEvent) {
  if (state === Area.none) return
  document.documentElement.classList.add('pointer-events-none')
  resizing = true
  fcursor = new Vector(e.clientX, e.clientY)
  ftop = top.value
  fleft = left.value
  fwidth = width.value
  fheight = height.value
  window.addEventListener('mousemove', doResize)
  window.addEventListener('mouseup', endResize)
}
function doResize(e: MouseEvent) {
  if (!container.value) return
  const cursor = new Vector(e.clientX, e.clientY)
  const dcursor = cursor.sub(fcursor)
  const dw = dcursor.x
  const dh = dcursor.y

  if (state === Area.n) {
    top.value = ftop + Math.min(dh, fheight - minHeight.value)
    height.value = Math.max(fheight - dh, minHeight.value)
  } else if (state === Area.ne) {
    top.value = ftop + Math.min(dh, fheight - minHeight.value)
    height.value = Math.max(fheight - dh, minHeight.value)
    width.value = Math.max(fwidth + dw, minWidth.value)
  } else if (state === Area.e) {
    width.value = Math.max(fwidth + dw, minWidth.value)
  } else if (state === Area.se) {
    height.value = Math.max(fheight + dh, minHeight.value)
    width.value = Math.max(fwidth + dw, minWidth.value)
  } else if (state === Area.s) {
    height.value = Math.max(fheight + dh, minHeight.value)
  } else if (state === Area.sw) {
    left.value = fleft + Math.min(dw, fwidth - minWidth.value)
    width.value = Math.max(fwidth - dw, minWidth.value)
    height.value = Math.max(fheight + dh, minHeight.value)
  } else if (state === Area.w) {
    left.value = fleft + Math.min(dw, fwidth - minWidth.value)
    width.value = Math.max(fwidth - dw, minWidth.value)
  } else if (state === Area.nw) {
    top.value = ftop + Math.min(dh, fheight - minHeight.value)
    height.value = Math.max(fheight - dh, minHeight.value)
    left.value = fleft + Math.min(dw, fwidth - minWidth.value)
    width.value = Math.max(fwidth - dw, minWidth.value)
  }
}
function endResize(e: MouseEvent) {
  document.documentElement.classList.remove('pointer-events-none')
  resizing = false
  window.removeEventListener('mousemove', doResize)
  window.removeEventListener('mouseup', endResize)
}

onMounted(() => {
  window.addEventListener('mousedown', beginResize)
  window.addEventListener('mousemove', mousemove)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', mousemove)
})


</script>

<template>
  <div ref="container" class="absolute" :style="{
    left: `${left}px`, top: `${top}px`,
    width: `${width}px`, height: `${height}px`,
  }">

    <div class="origin-[0_0]" :style="{
      width: `${_width}px`, height: `${_height}px`,
      transform: `scale(${props.scale})`,
    }">
      <slot></slot>
    </div>

    <!-- n -->
    <div class="absolute" :class="{ 'bg-violet': props.handleVisible }" :style="{
      left: `${props.cornerOffset}px`, top: `${-handleWidth / 2 - 1}px`,
      width: `calc(100% - ${props.cornerOffset * 2}px)`, height: `${handleWidth + FIXED_WIDTH}px`
    }" @dragstart="e => e.preventDefault()"></div>
    <!-- neH -->
    <div class="absolute" :class="{ 'bg-violet': props.handleVisible }" :style="{
      right: `${-handleWidth / 2 - 1}px`, top: `${-handleWidth / 2 - 1}px`,
      width: `${props.cornerOffset + handleWidth + FIXED_WIDTH}px`, height: `${handleWidth + FIXED_WIDTH}px`
    }" @dragstart="e => e.preventDefault()"></div>
    <!-- neV -->
    <div class="absolute" :class="{ 'bg-violet': props.handleVisible }" :style="{
      right: `${-handleWidth / 2 - 1}px`, top: `${-handleWidth / 2 - 1}px`,
      width: `${handleWidth + FIXED_WIDTH}px`, height: `${props.cornerOffset + handleWidth + FIXED_WIDTH}px`
    }" @dragstart="e => e.preventDefault()"></div>
    <!-- e -->
    <div class="absolute" :class="{ 'bg-violet': props.handleVisible }" :style="{
      right: `${-handleWidth / 2 - 1}px`, top: `${props.cornerOffset}px`,
      width: `${handleWidth + FIXED_WIDTH}px`, height: `calc(100% - ${props.cornerOffset * 2}px)`
    }" @dragstart="e => e.preventDefault()"></div>
    <!-- seH -->
    <div class="absolute" :class="{ 'bg-violet': props.handleVisible }" :style="{
      right: `${-handleWidth / 2 - 1}px`, bottom: `${-handleWidth / 2 - 1}px`,
      width: `${props.cornerOffset + handleWidth + FIXED_WIDTH}px`, height: `${handleWidth + FIXED_WIDTH}px`
    }" @dragstart="e => e.preventDefault()"></div>
    <!-- seV -->
    <div class="absolute" :class="{ 'bg-violet': props.handleVisible }" :style="{
      right: `${-handleWidth / 2 - 1}px`, bottom: `${-handleWidth / 2 - 1}px`,
      width: `${handleWidth + FIXED_WIDTH}px`, height: `${props.cornerOffset + handleWidth + FIXED_WIDTH}px`
    }" @dragstart="e => e.preventDefault()"></div>
    <!-- s -->
    <div class="absolute" :class="{ 'bg-violet': props.handleVisible }" :style="{
      left: `${props.cornerOffset - 1}px`, bottom: `${-handleWidth / 2 - 1}px`,
      width: `calc(100% - ${props.cornerOffset * 2}px)`, height: `${handleWidth + FIXED_WIDTH}px`
    }" @dragstart="e => e.preventDefault()"></div>
    <!-- swH -->
    <div class="absolute" :class="{ 'bg-violet': props.handleVisible }" :style="{
      left: `${-handleWidth / 2 - 1}px`, bottom: `${-handleWidth / 2 - 1}px`,
      width: `${props.cornerOffset + handleWidth + FIXED_WIDTH}px`, height: `${handleWidth + FIXED_WIDTH}px`
    }" @dragstart="e => e.preventDefault()"></div>
    <!-- swV -->
    <div class="absolute" :class="{ 'bg-violet': props.handleVisible }" :style="{
      left: `${-handleWidth / 2 - 1}px`, bottom: `${-handleWidth / 2 - 1}px`,
      width: `${handleWidth + FIXED_WIDTH}px`, height: `${props.cornerOffset + handleWidth + FIXED_WIDTH}px`
    }" @dragstart="e => e.preventDefault()"></div>
    <!-- w -->
    <div class="absolute" :class="{ 'bg-violet': props.handleVisible }" :style="{
      left: `${-handleWidth / 2 - 1}px`, top: `${props.cornerOffset - 1}px`,
      width: `${handleWidth + FIXED_WIDTH}px`, height: `calc(100% - ${props.cornerOffset * 2}px)`
    }" @dragstart="e => e.preventDefault()"></div>
    <!-- nwH -->
    <div class="absolute" :class="{ 'bg-violet': props.handleVisible }" :style="{
      left: `${-handleWidth / 2 - 1}px`, top: `${-handleWidth / 2 - 1}px`,
      width: `${props.cornerOffset + handleWidth + FIXED_WIDTH}px`, height: `${handleWidth + FIXED_WIDTH}px`
    }" @dragstart="e => e.preventDefault()"></div>
    <!-- nwV -->
    <div class="absolute" :class="{ 'bg-violet': props.handleVisible }" :style="{
      left: `${-handleWidth / 2 - 1}px`, top: `${-handleWidth / 2 - 1}px`,
      width: `${handleWidth + FIXED_WIDTH}px`, height: `${props.cornerOffset + handleWidth + FIXED_WIDTH}px`
    }" @dragstart="e => e.preventDefault()"></div>

  </div>
</template>