<script lang="ts" setup>
import { Vector } from '@/assets/scripts/data'
import ResizableWindow from '@/components/ResizableWindow.vue'
import { computed, watch } from 'vue'
import { Formula, NodeStyle, useFormulaStore } from './data'
import Tag from './Tag.vue'

const store = useFormulaStore()

const display = defineModel<boolean>('display', { required: true })
const spos = defineModel<Vector>('pos', { required: true })
const vpos = computed(() => store.toView(spos.value))
const vx = computed({
  get: () => vpos.value.x,
  set: v => spos.value.x = store.toSpace(new Vector(v, 0)).x
})
const vy = computed({
  get: () => vpos.value.y,
  set: v => spos.value.y = store.toSpace(new Vector(0, v)).y
})
const width = defineModel<number>('width', { required: true })
const height = defineModel<number>('height', { required: true })
const fontSize = computed(() => 18 + Math.min(width.value - 400, height.value - 300) * 0.05)
const props = defineProps({
  scale: {
    type: Number,
    required: true
  }
})

let lastCursorPos = new Vector()
function beginDrag(e: MouseEvent) {
  document.documentElement.classList.add('cursor-default')
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
  document.documentElement.classList.remove('cursor-default')
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', overDrag)
}

function onclick(tag: string) {
  if (store.state.filteredTags.includes(tag)) {
    store.state.filteredTags = store.state.filteredTags.filter(t => t !== tag)
  } else {
    store.state.filteredTags.push(tag)
  }
  store.filter()
}



</script>

<template>
  <Transition name="filter-tag">
    <ResizableWindow v-if="display" v-model:left="vx" v-model:top="vy" v-model:width="width" v-model:height="height"
      :scale="store.view.zoon.value * scale" :min-width="400" :min-height="300">
      <div class="full bg-#2c2c2c overflow-hidden grid select-none" :style="{
        borderRadius: `${fontSize * 0.5}px`,
        fontSize: `${fontSize}px`,
        gridTemplateRows: `${fontSize * 1.2}px 1fr`,
      }" @mousedown="beginDrag">
        <div class="bg-#282828 flex justify-end items-center">
          <span
            class="material-icons font-size-[1em_!important] color-#888 hover:color-#ccc cursor-pointer transition-color"
            :style="{
              width: `${fontSize * 1.2}px`,
            }" @click="display = false">close</span>
        </div>
        <div class="grid grid-cols-[1fr_0.03em_5em] py-0.5em">
          <div class="px-0.6em overflow-auto">
            <div class="flex items-start flex-wrap gap-0.6em">
              <Tag v-for="tag in store.allTags()"
                class="bg-#444 cursor-pointer hover:brightness-120 transition-[background-color,filter]" :class="{
                  'bg-violet': store.state.filteredTags.includes(tag)
                }" @click="onclick(tag)">
                <span class="color-#888 transition-color" :class="{
                  'color-#eee': store.state.filteredTags.includes(tag),
                }">
                  {{ tag }}
                </span>
              </Tag>
            </div>
          </div>
          <div class="bg-#666"></div>
          <div class="flex flex-col gap-0.3em px-0.6em">
            <v-btn class="bg-#303030 font-size-1em" style="
              border-radius: 0.3em;
              width: full;
              height: 2em;
            " @click="store.state.filteredTags = []; store.filter()">全消</v-btn>
            <v-btn class="bg-#303030 font-size-1em" style="
              border-radius: 0.3em;
              width: full;
              height: 2em;
            " @click="store.state.filteredTags = store.allTags(); store.filter()">全选</v-btn>
            <v-btn class="bg-#303030 font-size-1em" style="
              border-radius: 0.3em;
              width: full;
              height: 2em;
            " @click="store.state.filteredTags = store.allTags().filter(t => !store.state.filteredTags.includes(t)); store.filter()">反选</v-btn>
          </div>
        </div>
      </div>
    </ResizableWindow>
  </Transition>
</template>

<style scoped>
:deep(.markdown blockquote) {
  border-left-color: #222;
  background-color: #292929;
}
</style>

<style>
.filter-tag-leave-active,
.filter-tag-enter-active {
  transition: opacity 300ms, transform 300ms;
}

.filter-tag-enter-from,
.filter-tag-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.3);
}
</style>