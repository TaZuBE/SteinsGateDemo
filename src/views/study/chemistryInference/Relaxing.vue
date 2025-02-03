<script lang="ts" setup>
import { computed, reactive, type PropType } from 'vue';
import { FormulaNode, useFormulaStore } from './data'
import { Vector } from '@/assets/scripts/data';

const store = useFormulaStore()

const sPos = defineModel<Vector>('pos', { required: true })
const on = defineModel<boolean>('on', { required: true })
const vPos = computed(() => store.toView(sPos.value))
const props = defineProps({
  wheel: {
    type: Function as PropType<(e: WheelEvent) => void>,
    required: true,
  }
})
let lastCursorPos = new Vector()

function beginDrag(e: MouseEvent) {
  lastCursorPos = new Vector(e.clientX, e.clientY)
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', overDrag)
}
function onDrag(e: MouseEvent) {
  const cursorPos = new Vector(e.clientX, e.clientY)
  sPos.value.doAdd(store.toSpace(lastCursorPos).to(store.toSpace(cursorPos)))
  lastCursorPos = cursorPos
}
function overDrag() {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', overDrag)
}

let animationId: number | null = null
const coef = 0.002
function beginRelax() {
  relax()
}
function relax() {
  const d = new Map<FormulaNode, Vector>(store.state.nodes.map(n => [n, new Vector()]))
  const link = new Map<FormulaNode, FormulaNode>()
  for (const n of store.state.nodes) {
    for (const r of n.react) {
      if (link.get(n) === r || link.get(r) === n) continue
      link.set(n, r)
      d.get(n)!.doAdd(n.pos.to(r.pos).mul(coef))
      d.get(r)!.doAdd(r.pos.to(n.pos).mul(coef))
    }
    for (const p of n.produce) {
      if (link.get(n) === p || link.get(p) === n) continue
      link.set(n, p)
      d.get(n)!.doAdd(n.pos.to(p.pos).mul(coef))
      d.get(p)!.doAdd(p.pos.to(n.pos).mul(coef))
    }
  }

  for (const n of store.state.nodes) {
    n.pos.doAdd(d.get(n)!)
  }
  store.repel()
  animationId = requestAnimationFrame(relax)
}
function overRelax() {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
}

</script>

<template>
  <Transition name="relaxing">
    <div v-if="on"
      class="w-140px h-60px bg-#2a2a2a rounded-6px absolute transform-origin-[0_0] grid grid-rows-[12px_1fr] overflow-hidden select-none"
      :style="{
        left: `${vPos.x}px`, top: `${vPos.y}px`,
        transform: `scale(${store.state.zoon.value * 1.2})`,
      }" @wheel="props.wheel">
      <div class="bg-#222 flex items-center justify-end px-3px" @mousedown="beginDrag">
        <span
          class="material-icons font-size-[0.8em_!important] color-#888 hover:color-#ccc transition-color cursor-pointer" @click="on = false">close</span>
      </div>
      <div class="p-[6px_10px] grid grid-cols-[auto_1fr] gap-6px">
        <div class="flex-center">
          <span class="material-icons font-size-[1.4em_!important]">touch_app</span>
        </div>
        <button class="full bg-#303030 font-size-[0.9em_!important] hover:bg-#383838 active:bg-#404040 transition-background-color" @mousedown="beginRelax" @mouseup="overRelax">
          按住松弛
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.relaxing-enter-from,
.relaxing-leave-to {
  opacity: 0;
}

.relaxing-enter-active,
.relaxing-leave-active {
  transition: opacity 200ms;
}

</style>