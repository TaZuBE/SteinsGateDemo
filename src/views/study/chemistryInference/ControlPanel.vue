<script lang="ts" setup>
import { computed, reactive, watch, type PropType } from 'vue';
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



watch(store.control, () => {
  store.repel()
  store.Draw()
})


const func = {
  cohering: {
    doing: false,
    down() {
      func.cohering.doing = true
      func.cohering.do()
    },
    do() {
      if (!func.cohering.doing) return
      const barycenter = store.barycenter()
      store.state.nodes.map(n => n.pos.doAdd(n.pos.to(barycenter).normalize().mul(1)))
      store.repel()
      requestAnimationFrame(func.cohering.do)
    },
    up() {
      func.cohering.doing = false
    },
  },
  disperse: {
    doing: false,
    down() {
      func.disperse.doing = true
      func.disperse.do()
    },
    do() {
      if (!func.disperse.doing) return
      const barycenter = store.barycenter()
      store.state.nodes.map(n => {
        let v = n.pos.to(barycenter).normalize()
        v = v.isZero() ? Vector.randomUnit() : v
        return n.pos.doSub(v.mul(1))
      })
      store.repel()
      requestAnimationFrame(func.disperse.do)
    },
    up() {
      func.disperse.doing = false
    },
  }
}


</script>

<template>
  <Transition name="relaxing">
    <div v-if="on"
      class="w-400px h-300px bg-#2a2a2a rounded-6px absolute transform-origin-[0_0] grid grid-rows-[12px_1fr] overflow-hidden select-none"
      :style="{
        left: `${vPos.x}px`, top: `${vPos.y}px`,
        transform: `scale(${store.view.zoon.value * 1.2})`,
      }" @wheel="props.wheel">
      <div class="bg-#222 flex items-center justify-end px-3px" @mousedown="beginDrag">
        <span
          class="material-icons font-size-[0.8em_!important] color-#888 hover:color-#ccc transition-color cursor-pointer"
          @click="on = false">close</span>
      </div>
      <div class="grid grid-cols-2 p-[10px_20px]">
        <div class="flex flex-col">
          <h6 class="color-#888">开关</h6>
          <v-switch label="网格" color="primary" hide-details v-model="store.control.grid"></v-switch>
          <v-switch label="边" color="primary" hide-details v-model="store.control.side"></v-switch>
          <v-switch label="重心" color="primary" hide-details v-model="store.control.barycenter"></v-switch>
          <v-switch label="斥力" color="primary" hide-details v-model="store.control.repulsion"></v-switch>
        </div>
        <div class="flex flex-col gap-12px">
          <h6 class="color-#888">功能</h6>
          <v-btn class="bg-#333 w-80px h-50px font-size-0.8em" prepend-icon="touch_app" @mousedown=func.cohering.down
            @mouseup="func.cohering.up">
            <template v-slot:prepend>
              <v-icon class="font-size-[1.3em_!important]"></v-icon>
            </template>
            紧凑
          </v-btn>
          <v-btn class="bg-#333 w-80px h-50px font-size-0.8em" prepend-icon="touch_app" @mousedown=func.disperse.down
            @mouseup="func.disperse.up">
            <template v-slot:prepend>
              <v-icon class="font-size-[1.3em_!important]"></v-icon>
            </template>
            离散
          </v-btn>
        </div>
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