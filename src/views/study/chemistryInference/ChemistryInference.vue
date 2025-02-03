<script lang="ts" setup>
import Panel from '@/components/Panel.vue'
import View from './View.vue'
import { onMounted, onUnmounted, ref } from 'vue'
import * as data from './data.ts'
import InfoPanel from './InfoPanel.vue'

const store = data.useFormulaStore()

// view
let viewWidth = ref(0)
let viewHeight = ref(0)
let formulas: data.Formula[] = []
const resizePanel = (rect1: DOMRect, rect2: DOMRect) => {
  viewWidth.value = rect1.right - rect1.left
  viewHeight.value = rect1.bottom - rect1.top
}

onMounted(() => {
  window.addEventListener('unload', finish)
  store.fromStorage()
})
function finish() {
  window.removeEventListener('unload', finish)
  store.toStorage()
}
onUnmounted(finish)

</script>

<template>
  <Panel :default-size="{ 2: 280 }" p2closable="prefer" :p1min="300" :p2min="250" @resize="resizePanel">
    <template #1>
      <View :width="viewWidth" :height="viewHeight"></View>
    </template>
    <template #2>
      <InfoPanel></InfoPanel>
    </template>
  </Panel>
</template>

<style lang="scss" scoped></style>
