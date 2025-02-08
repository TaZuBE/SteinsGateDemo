<script lang="ts" setup>
import { ref, watch } from 'vue';
import { FormulaNode, NodeStyle, useFormulaStore } from './data'
import InfoPanelInset from './InfoPanelInset.vue';

const store = useFormulaStore()

const currentNode = ref<FormulaNode | null>(null)
const circle = ref(0)

watch(store.state, () => {
  const lastNode = currentNode.value
  currentNode.value = null
  for (const n of store.state.nodes) {
    if (n.style.type === NodeStyle.shown) {
      currentNode.value = n
      break
    }
  }
  if (lastNode !== currentNode.value) {
    circle.value = (circle.value + 1) % 2
  }
})

</script>

<template>
  <div class="full absolute bg-#2e2e2e font-size-1.1em p-[10px_14px] overflow-x-hidden overflow-y-auto">
    <div class="full relative">
      <Transition name="info-panel" mode="out-in">
        <div v-if="currentNode && circle === 0" class="full absolute">
          <InfoPanelInset :current-node="currentNode"></InfoPanelInset>
        </div>
        <div v-else-if="currentNode && circle === 1" class="full absolute">
          <InfoPanelInset :current-node="currentNode"></InfoPanelInset>
        </div>
        <h2 v-else class="full absolute left-0 top-0 flex-center color-#444 select-none">未选中化学式节点</h2>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
:deep(.markdown blockquote) {
  border-left-color: #222;
  background-color: #292929;
}

::-webkit-scrollbar {
  width: 0;
}
</style>

<style>
.info-panel-leave-active,
.info-panel-enter-active {
  transition: opacity 300ms, transform 300ms;
}

.info-panel-enter-from,
.info-panel-leave-to {
  opacity: 0;
  transform: translateX(10px) scale(0.96);
}
</style>