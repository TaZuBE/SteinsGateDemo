<script lang="ts" setup>
import type { PropType } from 'vue';
import { marked } from 'marked'
import { FormulaNode, useFormulaStore } from './data'
import Tag from './Tag.vue'

const store = useFormulaStore()

const props = defineProps({
  currentNode: {
    type: Object as PropType<FormulaNode>,
    required: true,
  }
})

</script>

<template>

  <div class="flex gap-10px">
    <Tag v-for="tag in currentNode!.formula.tag" :tag="tag" class="bg-#0b54c1">
      {{ tag }}
    </Tag>
  </div>

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
  <div class="markdown" :class="{
    'color-#999': currentNode.formula.description === '',
  }" v-html="currentNode.formula.description === '' ? '无' : marked(currentNode.formula.description)">
  </div>

  <h1 class="mt-30px pb-10px mb-10px">相关方程：</h1>
  <div
    v-for="equ in store.state.equations.filter(e => e.reactant.find(r => r.formula.deepEqual(currentNode!.formula)) || e.product.find(p => p.formula.deepEqual(currentNode!.formula)))"
    class="mb-6px">

    <div class="flex gap-10px mb-6px font-size-0.8em">
      <Tag v-for="tag in equ.tag" :tag="tag" class="bg-#0b94c1">
        {{ tag }}
      </Tag>
    </div>

    <h3 class="text-wrap break-words mb-4px">{{ equ.string() }}</h3>

    <h4>描述：</h4>
    <div class="markdown mb-18px" :class="{
      'color-#999': currentNode.formula.description === '',
    }" v-html="currentNode.formula.description === '' ? '无' : marked(currentNode.formula.description)"></div>
  </div>
  <div
    v-if="store.state.equations.filter(e => e.reactant.find(r => r.formula.deepEqual(currentNode!.formula)) || e.product.find(p => p.formula.deepEqual(currentNode!.formula))).length === 0">
    无
  </div>
  <div class="h-160px"></div>
</template>