<script lang="ts" setup>
import Panel from '@/components/Panel.vue'
import { watch, ref, nextTick } from 'vue'
import { Formula, FormulaNode, NodeStyle, useFormulaStore, pretty } from './data'
import { useToast } from 'vue-toastification'
import AddFormula from './AddFormula.vue'
import { marked } from 'marked'

const store = useFormulaStore()
const toast = useToast()

const props = defineProps({
  display: {
    type: Boolean,
    required: false,
  },
  toView: {
    type: Function,
    required: true,
  }
})
const emit = defineEmits(['close'])

watch(props, () => {
  if (props.display) {
    window.addEventListener('keydown', windowkeydown)
    selection.value = null
    formulaText.value = ''
    descriptionText.value = ''
  } else {
    window.removeEventListener('keydown', windowkeydown)
  }
})


const selection = ref<FormulaNode | null>(null)
const formulaText = ref('')
const descriptionText = ref('')
const invalid = ref(false)
const currentFormula = ref<Formula | null>(null)
const search = ref('')
const addingFormula = ref(false)
let enableShortcut = true
let focusOnDescription = ref(false)


watch(formulaText, () => {
  try {
    const f = Formula.parse(formulaText.value)
    f.description = descriptionText.value
    currentFormula.value = f
  } catch {
    currentFormula.value = null
  }
})

function windowkeydown(e: KeyboardEvent) {
  if (!enableShortcut) return
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  } else if (e.key === 'Enter' && !focusOnDescription.value) {
    e.preventDefault()
    update()
  } else if (e.ctrlKey && (e.key == 'R' || e.key == 'r')) {
    e.preventDefault()
    act.reset()
  } else if (e.ctrlKey && e.key === 'Delete') {
    e.preventDefault()
    act.delete()
  }
}

function select(node: FormulaNode) {
  if (update()) {
    selection.value = node
    formulaText.value = node.formula.string()
    descriptionText.value = node.formula.description
  }
}

function setInvalid() {
  invalid.value = true
  setTimeout(() => invalid.value = false, 500)
}

function update() {
  if (!selection.value) return true
  try {
    const f = Formula.parse(formulaText.value)
    f.description = descriptionText.value
    if (store.state.nodes.filter(n => n.formula.deepEqual(f)).length && !selection.value.formula.deepEqual(f)) {
      toast.dismiss('formula repeated')
      nextTick(() => toast.error('化学式重复', {
        id: 'formula repeated',
      }))
      return false
    } else {
      toast.dismiss('saved formula')
      nextTick(() => toast.success('保存成功', {
        id: 'saved formula',
      }))
      selection.value.formula.set(f)
      return true
    }
  } catch {
    toast.dismiss('formula invalid')
      nextTick(() => toast.error('化学式无效', {
        id: 'formula invalid',
      }))
    setInvalid()
    return false
  }
}

const act = {
  reset() {
    if (!selection.value) return
    formulaText.value = selection.value.formula.string()
    descriptionText.value = selection.value.formula.description
  },
  delete() {
    if (!selection.value) return
    store.deleteNode(selection.value)
    formulaText.value = ''
    descriptionText.value = ''
    selection.value = null
  },
  hide() {
    if (!selection.value) return
    selection.value.setStyle(NodeStyle.hidden)
  },
  visualized() {
    if (!selection.value) return
    selection.value.setStyle(NodeStyle.normal)
  },
}

function onAddFormula() {
  addingFormula.value = true
  enableShortcut = false
}

function afterAddFormula() {
  addingFormula.value = false
  enableShortcut = true
}


</script>

<template>
  <Teleport to=".screen-container">
    <Transition name="manage-formula">
      <div v-show="display" class="w-100vw h-300vh bg-#000 bg-op-60 absolute top--100vh left-0 flex-center"
        @click="emit('close')">
        <div :class="{ 'shake': invalid }"
          class="w-1000px h-700px p-[10px_20px] bg-#333 rounded-xl grid grid-rows-[40px_1fr]"
          @click="e => e.stopPropagation()">
          <h2 class="flex-center mt-5px">管理化学式</h2>
          <Panel :default-size="{ 1: 180 }" :p1min="100" :p2min="300" :gap="10">
            <template #1>
              <div class="full grid grid-rows-[25px_1fr] gap-10px">
                <div class="mx-6px grid grid-cols-[1fr_40px] gap-6px">
                  <input class="w-full flex-center px-10px py-4px rounded-20px font-size-15px bg-#333"
                    placeholder="搜索" v-model="search"></input>
                  <div class="bg-#3a3a3a rounded-10px flex-center color-#999 font-size-20px cursor-pointer hoverbright"
                    @click="onAddFormula">
                    +</div>
                </div>
                <div class="flex flex-col overflow-auto">
                  <div
                    v-for="node in store.state.nodes.filter(n => n.formula.string().includes(pretty(search)))"
                    class="bg-#333 rounded-8px px-16px py-5px font-size-18px hover:filter-brightness-120 cursor-pointer relative"
                    @click="select(node)">
                    <div class="color-#999 relative select-none transition-[font-weight,color]"
                      :class="{ 'color-#eee font-bold': selection === node }">
                      <div class="absolute w-2px h-full bg-#eee op-0 left--8px top-0 rounded-10px transition-opacity"
                        :class="{ 'op-100': selection === node }"></div>
                      {{ node.formula.string() }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template #2>
              <Panel :default-size="60" :gap="10" :p2min="220">
                <template #1>
                  <Panel :default-size="{ 1: 0 }" :p1min="50" direction="vertical" :gap="6">
                    <template #1>
                      <textarea :class="{ 'outline-#f44': invalid }"
                        class="full outline outline-1 outline-[rgba(140,90,90,0)] transition-outline-color resize-none bg-#383838 rounded-6px font-size-1.2em"
                        v-model="formulaText" placeholder="化学式"></textarea>
                    </template>
                    <template #2>
                      <Panel :gap="6">
                        <template #1>
                          <textarea class="full resize-none bg-#383838 rounded-6px font-size-1.2em"
                          v-model="descriptionText" placeholder="Markdown描述" @focus="focusOnDescription = true" @blur="focusOnDescription = false"></textarea>
                        </template>
                        <template #2>
                          <div
                            class="full bg-#383838 font-size-20px rounded-6px absolute left-0 top-0 p-10px overflow-auto markdown"
                            v-html="marked.parse(descriptionText)"></div>
                        </template>
                      </Panel>
                      
                    </template>
                  </Panel>
                </template>
                <template #2>
                  <div class="full grid grid-rows-[1fr_auto]">
                    <div class="flex flex-col gap-8px px-4px">
                      <h2 class="m-[0_0_6px_0]">化学式属性</h2>
                      <div>
                        原元素：
                        <span class="float-right">{{ selection ? selection.formula.string() : 'Null' }}</span>
                      </div>
                      <div>
                        元素有效：
                        <span class="float-right">{{ currentFormula ? 'True' : 'False' }}</span>
                      </div>
                      <div>
                        元素重复：
                        <span class="float-right">{{ selection && currentFormula && !selection.formula.deepEqual(currentFormula!) && store.state.nodes.filter(n => n.formula.deepEqual(currentFormula!)).length ? 'True' : 'False' }}</span>
                      </div>
                      <div>
                        元素个数：
                        <span class="float-right">{{ currentFormula ? currentFormula.elementCount() : 'Null' }}</span>
                      </div>
                      <div>
                        相对分子质量：
                        <span class="float-right">{{ currentFormula ? currentFormula.weight().toFixed(3) : 'Null'
                          }}</span>
                      </div>
                      <h2 class="m-[12px_0_6px_0]">节点属性</h2>
                      <div>
                        可见：
                        <span class="float-right">{{ selection ? selection.style.type === NodeStyle.hidden ? 'False' : 'True' : 'Null' }}</span>
                      </div>
                      <div>
                        空间坐标：
                        <span class="float-right">{{ selection ? `(${selection.pos.x.toFixed(2)},
                          ${selection.pos.y.toFixed(2)})` : 'Null' }}</span>
                      </div>
                      <div>
                        视口坐标：
                        <span class="float-right">{{ selection ? `(${toView(selection.pos).x.toFixed(2)},
                          ${toView(selection.pos).y.toFixed(2)})` : 'Null' }}</span>
                      </div>
                    </div>
                    <div
                      class="flex flex-col *:font-size-1em *:shadow-none *:bg-#333 *:inline *:p-[4px_18px] *:font-thin">
                      <button class="hoverbright" @click="act.reset">
                        <span class="float-left">重置</span>
                        <span class="float-right">Ctrl+R</span>
                      </button>
                      <button class="hoverbright" @click="act.delete">
                        <span class="float-left">删除</span>
                        <span class="float-right">Ctrl+Delete</span>
                      </button>
                      <button class="hoverbright" @click="act.hide">
                        <span class="float-left">隐藏</span>
                      </button>
                      <button class="hoverbright" @click="act.visualized">
                        <span class="float-left">显示</span>
                      </button>
                      <button class="hoverbright" @click="act.visualized">
                        <span class="float-left">保存</span>
                        <span class="float-right">Enter</span>
                      </button>
                    </div>
                  </div>
                </template>
              </Panel>
            </template>
          </Panel>
        </div>
      </div>
    </Transition>
  </Teleport>

  <AddFormula :display="addingFormula" @close="afterAddFormula"></AddFormula>
</template>

<style lang="scss" scoped>
.manage-formula-enter-from,
.manage-formula-leave-to {
  opacity: 0;
  transform: translateY(40px);
}

.manage-formula-enter-active,
.manage-formula-leave-active {
  transition-property: opacity, transform;
  transition-duration: 200ms;
}
</style>