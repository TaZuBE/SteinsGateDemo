<script lang="ts" setup>
import { ref, watch } from 'vue';
import { FormulaNode, NodeStyle, useFormulaStore } from './data'
import { marked } from 'marked'

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
  <div class="full absolute bg-#2e2e2e p-[10px_14px] font-size-1.1em">
    <div class="full relative">
      <Transition name="info-panel" mode="out-in">
        <div v-if="currentNode && circle === 0" class="full absolute">
          <h1 class="mt-6px pb-10px border-0px border-#ccc border-solid border-b">化学式属性：</h1>

          <div class="mb-2px">化学式：</div>
          <div class="mb-22px">{{ currentNode.formula.string() }}</div>

          <div class="mb-2px">元素个数：</div>
          <div class="mb-22px">{{ currentNode.formula.elementCount() }}</div>

          <div class="mb-2px">相对分子质量：</div>
          <div class="mb-22px">{{ currentNode.formula.weight().toFixed(3) }}</div>

          <div class="mb-4px">空间坐标：</div>
          <div class="mb-22px">({{ currentNode.pos.x.toFixed() }},{{ currentNode.pos.y.toFixed() }})</div>

          <div class="mb-4px">视口坐标：</div>
          <div class="mb-22px">({{ store.toView(currentNode.pos).x.toFixed() }},{{
            store.toView(currentNode.pos).y.toFixed() }})</div>

          <h1 class="mt-30px pb-10px border-0px border-#ccc border-solid border-b">描述：</h1>
          <div class="markdown" v-html="marked(currentNode.formula.description)"></div>
        </div>
        <div v-else-if="currentNode && circle === 1" class="full absolute">
          <h1 class="mt-6px pb-10px border-0px border-#ccc border-solid border-b">化学式属性：</h1>

          <div class="mb-2px">化学式：</div>
          <div class="mb-22px">{{ currentNode.formula.string() }}</div>

          <div class="mb-2px">元素个数：</div>
          <div class="mb-22px">{{ currentNode.formula.elementCount() }}</div>

          <div class="mb-2px">相对分子质量：</div>
          <div class="mb-22px">{{ currentNode.formula.weight().toFixed(3) }}</div>

          <div class="mb-4px">空间坐标：</div>
          <div class="mb-22px">({{ currentNode.pos.x.toFixed() }},{{ currentNode.pos.y.toFixed() }})</div>

          <div class="mb-4px">视口坐标：</div>
          <div class="mb-22px">({{ store.toView(currentNode.pos).x.toFixed() }},{{
            store.toView(currentNode.pos).y.toFixed() }})</div>

          <h1 class="mt-30px pb-10px border-0px border-#ccc border-solid border-b">描述：</h1>
          <div class="markdown" v-html="marked(currentNode.formula.description)"></div>
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