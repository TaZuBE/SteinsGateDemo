<script lang="ts" setup>
import { computed, reactive, watch, type PropType } from 'vue';
import { FormulaNode, useFormulaStore } from './data'
import { Vector } from '@/assets/scripts/data';
import ResizableWindow from '@/components/ResizableWindow.vue';

const store = useFormulaStore()

const spos = defineModel<Vector>('pos', { required: true })
const display = defineModel<boolean>('display', { required: true })
const width = defineModel<number>('width', { required: true })
const height = defineModel<number>('height', { required: true })
const vpos = computed(() => store.toView(spos.value))
const vx = computed({
  get: () => vpos.value.x,
  set: v => spos.value.x = store.toSpace(new Vector(v, 0)).x
})
const vy = computed({
  get: () => vpos.value.y,
  set: v => spos.value.y = store.toSpace(new Vector(0, v)).y
})
const fontSize = computed(() => 14 + Math.min(width.value - 300, height.value - 225) * 0.03)
const props = defineProps({
  scale: {
    type: Number,
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
  spos.value.doAdd(store.toSpace(lastCursorPos).to(store.toSpace(cursorPos)))
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
  <Transition name="control-panel">
    <ResizableWindow v-if="display" v-model:width="width" v-model:height="height" v-model:left="vx" v-model:top="vy"
      :scale="store.view.zoon.value * scale" :min-width="300" :min-height="225">
      <div class="full bg-#2a2a2a absolute grid select-none overflow-hidden" :style="{
        gridTemplateRows: `${fontSize * 1.1}px 1fr`,
        borderRadius: `${fontSize * 0.3}px`,
        fontSize: `${fontSize}px`
      }">
        <div class="bg-#222 flex items-center justify-end" @mousedown="beginDrag">
          <span
            class="material-icons font-size-[0.9em_!important] color-#888 hover:color-#ccc transition-color cursor-pointer"
            :style="{
              width: `${fontSize * 1.1}px`
            }" @click="display = false">close</span>
        </div>
        <div class="grid grid-cols-2 p-[10px_20px]">
          <div class="flex flex-col">
            <h6 class="color-#888">开关</h6>
            <div class="origin-[0_0] mb-0" :style="{
              transform: `scale(${fontSize * 0.04})`,
            }">
              <v-switch label="网格" color="primary" hide-details v-model="store.control.grid"></v-switch>
              <v-switch label="边" color="primary" hide-details v-model="store.control.side"></v-switch>
              <v-switch label="重心" color="primary" hide-details v-model="store.control.barycenter"></v-switch>
              <v-switch label="斥力" color="primary" hide-details v-model="store.control.repulsion"></v-switch>
            </div>
          </div>
          <div class="flex flex-col" :style="{
            gap: `${fontSize * 0.4}px`
          }">
            <h6 class="color-#888">功能</h6>
            <v-btn class="bg-#333 w-80px h-50px font-size-0.8em" :style="{
              width: `${fontSize * 4.5}px`,
              height: `${fontSize * 2}px`,
            }" prepend-icon="touch_app" @mousedown=func.cohering.down @mouseup="func.cohering.up">
              <template v-slot:prepend>
                <v-icon class="font-size-[1.3em_!important]"></v-icon>
              </template>
              紧凑
            </v-btn>
            <v-btn class="bg-#333 w-80px h-50px font-size-0.8em" :style="{
              width: `${fontSize * 4.5}px`,
              height: `${fontSize * 2}px`,
            }" prepend-icon="touch_app" @mousedown=func.disperse.down @mouseup="func.disperse.up">
              <template v-slot:prepend>
                <v-icon class="font-size-[1.3em_!important]"></v-icon>
              </template>
              离散
            </v-btn>
          </div>
        </div>
      </div>
    </ResizableWindow>
  </Transition>
</template>

<style scoped>
.control-panel-enter-from,
.control-panel-leave-to {
  opacity: 0;
}

.control-panel-enter-active,
.control-panel-leave-active {
  transition: opacity 200ms;
}
</style>