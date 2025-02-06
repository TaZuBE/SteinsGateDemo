<script lang="ts" setup>
import { Vector } from '@/assets/scripts/data';
import ResizableWindow from '@/components/ResizableWindow.vue';
import { ref } from 'vue';

const left = ref(0)
const top = ref(0)

let lastCursorPos = new Vector()
function beginDrag(e: MouseEvent) {
  lastCursorPos = new Vector(e.clientX, e.clientY)
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', overDrag)
}
function onDrag(e: MouseEvent) {
  const cursorPos = new Vector(e.clientX, e.clientY)
  const d = cursorPos.sub(lastCursorPos)
  left.value += d.x
  top.value += d.y
  lastCursorPos = cursorPos
}
function overDrag() {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', overDrag)
}


</script>

<template>
  <ResizableWindow v-model:left="left" v-model:top="top" :scale="1.3">
    <div class="full bg-blue" @mousedown="beginDrag" @dragstart="e => e.preventDefault()"></div>
  </ResizableWindow>
</template>