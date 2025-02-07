<script lang="ts" setup>
import { onMounted, ref, nextTick, onUnmounted, watch } from 'vue'

const HANDLE_WIDTH = 10


// size:
// number 百分比
// { 1: number } div1像素
// { 2: number } div2像素
const props = withDefaults(defineProps<{
  p1min?: number
  p2min?: number
  p1closable?: boolean | 'prefer'
  p2closable?: boolean | 'prefer'
  direction?: 'horizontal' | 'vertical'
  defaultSize?: number | { 1: number } | { 2: number }
  gap?: number
}>(), {
  p1min: 50,
  p2min: 50,
  p1closable: false,
  p2closable: false,
  direction: 'horizontal',
  defaultSize: 50,
  gap: 0,
})
watch(props, () => {
  updateState()
  updateSize(size)
})


function handleWidth() {
  return Math.max(HANDLE_WIDTH, props.gap)
}
const emits = defineEmits(['resize'])

const container = ref<HTMLDivElement | null>(null)
const d1 = ref<HTMLDivElement | null>(null)
const handle = ref<HTMLDivElement | null>(null)
const d2 = ref<HTMLDivElement | null>(null)
const transitionable = ref(false)
// 0 H %
// 1 V %
// 2 H px
// 3 V px
// 4 H %-px
// 5 V %-px
let state = -1
let closing = 0
let size: number | { 1: number } | { 2: number } = props.defaultSize

onMounted(() => {
  if (!container.value || !d1.value || !handle.value || !d2.value) return

  size = props.defaultSize
  updateState()
  updateSize(size)
  if (props.direction === 'horizontal') {
    handle.value.style.width = `${handleWidth()}px`
    handle.value.style.height = '100%'
    handle.value.style.cursor = 'ew-resize'
    d1.value.style.height = d2.value.style.height = '100%'
    d2.value.style.right = '0'
  } else {
    handle.value.style.width = '100%'
    handle.value.style.height = `${handleWidth()}px`
    handle.value.style.cursor = 'ns-resize'
    d2.value.style.bottom = '0'
    d1.value.style.width = d2.value.style.width = '100%'
  }

  const containerResizeObserver = new ResizeObserver(() => {
    if (!d1.value || !d2.value) return
    updateSize(size)
    emits('resize', d1.value.getBoundingClientRect(), d2.value.getBoundingClientRect())
  })
  containerResizeObserver.observe(container.value)

  onUnmounted(() => {
    containerResizeObserver.disconnect()
  })
})



// because of gap, panels' real size will be smaller
const resize = () => {
  if (!container.value || !d1.value || !handle.value || !d2.value) return
  const rect = container.value.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return
  const { width, height } = rect
  if (state === 0) {
    const s = size as number
    handle.value.style.left = `calc(${s}% - ${handleWidth() / 2}px)`
    d1.value.style.width = `calc(${s}% - ${Math.min(props.gap / 2, width * s / 100)}px)`
    d2.value.style.width = `calc(${100 - s}% - ${Math.min(props.gap / 2, width * (1 - s / 100))}px)`
  } else if (state === 1) {
    const s = size as number
    handle.value.style.top = `calc(${s}% - ${handleWidth() / 2}px)`
    d1.value.style.height = `calc(${s}% - ${Math.min(props.gap / 2, height * s / 100)}px)`
    d2.value.style.height = `calc(${100 - s}% - ${Math.min(props.gap / 2, height * s / 100)}px)`
  } else if (state === 2) {
    const s = (size as { 1: number })[1]
    handle.value.style.left = `${s - handleWidth() / 2}px`
    d1.value.style.width = `${Math.max(s - props.gap / 2, 0)}px`
    d2.value.style.width = `calc(100% - ${Math.min(s + props.gap / 2, width)}px)`
  } else if (state === 3) {
    const s = (size as { 1: number })[1]
    handle.value.style.top = `${s - handleWidth() / 2}px`
    d1.value.style.height = `${Math.max(s - props.gap / 2, 0)}px`
    d2.value.style.height = `calc(100% - ${Math.min(s + props.gap / 2, height)}px)`
  } else if (state === 4) {
    const s = (size as { 2: number })[2]
    handle.value.style.right = `${s - handleWidth() / 2}px`
    d1.value.style.width = `calc(100% - ${Math.min(s + props.gap / 2, width)}px)`
    d2.value.style.width = `${Math.max(s - props.gap / 2, 0)}px`
  } else {
    const s = (size as { 2: number })[2]
    handle.value.style.bottom = `${s - handleWidth() / 2}px`
    d1.value.style.height = `calc(100% - ${Math.min(s + props.gap / 2, height)}px)`
    d2.value.style.height = `${Math.max(s - props.gap / 2, 0)}px`
  }
  nextTick(() => {
    emits('resize', d1.value!.getBoundingClientRect(), d2.value!.getBoundingClientRect())
  })
}
// set size in a fixed value and resize panel
function updateSize(_s: number | { 1: number } | { 2: number }) {
  if (!container.value) return
  const width = container.value.offsetWidth
  const height = container.value.offsetHeight
  if (width === 0 || height === 0) return
  if (state === 0) {
    const s = _s as number
    const low = (props.p1min + props.gap / 2) / width * 100
    const high = 100 - (props.p2min + props.gap / 2) / width * 100
    if (s < low / 2 && closing !== 1 && props.p1closable) {
      closing = 1
      console.log
    } else if (s > high + (100 - high) / 2 && closing !== 2 && props.p2closable) {
      closing = 2
    } else if (s >= low / 2 && s <= high + (100 - high) / 2 && closing) {
      closing = 0
    }
    closing =
      low <= high ? closing :
        props.p1closable === 'prefer' ? 1 : 2
    size =
      closing === 0 ? Math.min(Math.max(s, low), high) :
        closing === 1 ? 0 : 100
  } else if (state === 1) {
    const s = _s as number
    const low = (props.p1min + props.gap / 2) / height * 100
    const high = 100 - (props.p2min + props.gap / 2) / height * 100
    if (s < low / 2 && closing !== 1 && props.p1closable) {
      closing = 1
    } else if (s > high + (100 - high) / 2 && closing !== 2 && props.p2closable) {
      closing = 2
    } else if (s >= low / 2 && s <= high + (100 - high) / 2 && closing) {
      closing = 0
    }
    closing =
      low <= high ? closing :
        props.p1closable === 'prefer' ? 1 : 2
    size =
      closing === 0 ? Math.min(Math.max(s, low), high) :
        closing === 1 ? 0 : 100
  } else if (state === 2) {
    const s = (_s as { 1: number })[1]
    const low = props.p1min + props.gap / 2
    const high = width - props.p2min - props.gap / 2
    size = { 1: Math.min(Math.max(s, low), high) }
    if (s < low / 2 && closing !== 1 && props.p1closable) {
      closing = 1
    } else if (s > high + (width - high) / 2 && closing !== 2 && props.p2closable) {
      closing = 2
    } else if (s >= low / 2 && s <= high + (width - high) / 2 && closing) {
      closing = 0
    }
    closing =
      low <= high ? closing :
        props.p1closable === 'prefer' ? 1 : 2
    size = closing === 0 ? size :
      closing === 1 ? { 1: 0 } : { 1: width }
  } else if (state === 3) {
    const s = (_s as { 1: number })[1]
    const low = props.p1min + props.gap / 2
    const high = height - props.p2min - props.gap / 2
    if (s < low / 2 && closing !== 1 && props.p1closable) {
      closing = 1
    } else if (s > high + (height - high) / 2 && closing !== 2 && props.p2closable) {
      closing = 2
    } else if (s >= low / 2 && s <= high + (height - high) / 2 && closing) {
      closing = 0
    }
    closing =
      low <= high ? closing :
        props.p1closable === 'prefer' ? 1 : 2
    size =
      closing === 0 ? { 1: Math.min(Math.max(s, low), high) } :
        closing === 1 ? { 1: 0 } : { 1: height }
  } else if (state === 4) {
    const s = (_s as { 2: number })[2]
    const low = props.p2min + props.gap / 2
    const high = width - props.p1min - props.gap / 2
    if (s < low / 2 && closing !== 1 && props.p2closable) {
      closing = 2
    } else if (s > high + (width - high) / 2 && closing !== 2 && props.p1closable) {
      closing = 1
    } else if (s >= low / 2 && s <= high + (width - high) / 2 && closing) {
      closing = 0
    }
    closing =
      low <= high ? closing :
        props.p1closable === 'prefer' ? 1 : 2
    size =
      closing === 0 ? { 2: Math.min(Math.max(s, low), high) } :
        closing === 1 ? { 2: width } : { 2: 0 }
  } else {
    const s = (_s as { 2: number })[2]
    const low = props.p2min + props.gap / 2
    const high = height - props.p1min - props.gap / 2
    if (s < low / 2 && closing !== 1 && props.p2closable) {
      closing = 2
    } else if (s > high + (height - high) / 2 && closing !== 2 && props.p1closable) {
      closing = 1
    } else if (s >= low / 2 && s <= high + (height - high) / 2 && closing) {
      closing = 0
    }
    closing =
      low <= high ? closing :
        props.p1closable === 'prefer' ? 1 : 2
    size =
      closing === 0 ? { 2: Math.min(Math.max(s, low), high) } :
        closing === 1 ? { 2: height } : { 2: 0 }
  }
  // panel恢复显示后如果较大幅度更新位置，会造成卡顿
  // 原因：css transition如果更新最终值会重置duration
  // if (closing) {
  //   transitionable.value = true
  // }
  // 备用方案：恢复显示时不过渡
  transitionable.value = closing !== 0
  // nextTick(resize)
  resize()
}
function updateState() {
  state =
    typeof size === 'number' && props.direction === 'horizontal' ? 0 :
      typeof size === 'number' && props.direction === 'vertical' ? 1 :
        1 in (size as object) && props.direction === 'horizontal' ? 2 :
          1 in (size as object) && props.direction === 'vertical' ? 3 :
            2 in (size as object) && props.direction === 'horizontal' ? 4 :
              5
}
const onMousemove = (e: MouseEvent) => {
  e.preventDefault()
  if (!container.value) return
  const { top, right, bottom, left } = container.value.getBoundingClientRect()
  const scale = (right - left) / container.value.offsetWidth
  const s =
    state === 0 ? (e.clientX - left) / (right - left) * 100 :
      state === 1 ? (e.clientY - top) / (bottom - top) * 100 :
        state === 2 ? { 1: (e.clientX - left) / scale } :
          state === 3 ? { 1: (e.clientY - top) / scale } :
            state === 4 ? { 2: (right - e.clientX) / scale } :
              { 2: (bottom - e.clientY) / scale }
  updateSize(s)
}
const onMouseUp = () => {
  window.removeEventListener('mousemove', onMousemove)
  window.removeEventListener('mouseup', onMouseUp)
  document.documentElement.style.cursor = ''
  document.body.classList.remove('select-none')
}
const onMousedown = (e: MouseEvent) => {
  window.addEventListener('mousemove', onMousemove)
  window.addEventListener('mouseup', onMouseUp)
  document.documentElement.style.cursor = state & 1 ? 'ns-resize' : 'ew-resize'
  document.body.classList.add('select-none')
}

</script>

<template>
  <div ref="container" class="full relative">
    <div ref="d1" class="absolute overflow-hidden"
      :class="{ 'transition-[width,height] transition-duration-150': transitionable }"
      @transitionend="transitionable = false">
      <slot name="1"></slot>
    </div>
    <div ref="d2" class="absolute overflow-hidden"
      :class="{ 'transition-[width,height] transition-duration-150': transitionable }">
      <slot name="2"></slot>
    </div>
    <div ref="handle" class="absolute" @mousedown="onMousedown"></div>
  </div>
</template>