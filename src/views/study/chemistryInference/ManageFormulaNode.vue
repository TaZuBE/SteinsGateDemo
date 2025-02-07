<script lang="ts" setup>
import Panel from '@/components/Panel.vue'
import { watch, ref, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { Formula, FormulaNode, NodeStyle, useFormulaStore, pretty } from './data'
import { useToast } from 'vue-toastification'
import { marked } from 'marked'
import { Vector } from '@/assets/scripts/data'
import ResizableWindow from '@/components/ResizableWindow.vue'

const store = useFormulaStore()
const toast = useToast()

let lastCursorPos = new Vector()
const draging = ref(false)
function beginDrag(e: MouseEvent) {
  document.documentElement.classList.add('pointer-events-none')
  draging.value = true
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
  document.documentElement.classList.remove('pointer-events-none')
  draging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', overDrag)
}


const display = defineModel<Boolean>('display', { required: true })
const spos = defineModel<Vector>('pos', { required: true })
const vpos = computed(() => store.toView(spos.value))
const vx = computed({
  get: () => vpos.value.x,
  set: x => spos.value.x = store.toSpace(new Vector(x, 0)).x
})
const vy = computed({
  get: () => vpos.value.y,
  set: y => spos.value.y = store.toSpace(new Vector(0, y)).y
})

const inputFormula = ref<HTMLTextAreaElement | null>(null)
const selection = ref<FormulaNode | null>(null)
const formulaText = ref('')
const descriptionText = ref('')
const invalid = ref(false)
const currentFormula = ref<Formula | null>(null)
const search = ref('')
let focusOnFormula = ref(false)
let focusOnDescription = ref(false)
const width = defineModel<number>('width', { default: 800 })
const height = defineModel<number>('height', { default: 500 })
const fontSize = computed(() => 16 + Math.min(width.value - 600, height.value - 400) * 0.03)
const scale = defineModel<number>('scale', { default: 1 })
const ctxs = defineModel<any>('ctxs', { required: true })

watch(display, () => {
  if (display.value) {
    nextTick(() => {
      if (inputFormula.value) {
        inputFormula.value.focus({ preventScroll: true })
      }
    })
  }
})
watch(formulaText, () => {
  try {
    const f = Formula.parse(formulaText.value)
    f.description = descriptionText.value
    currentFormula.value = f
  } catch {
    currentFormula.value = null
  }
})

onMounted(() => {
  window.addEventListener('keydown', windowkeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', windowkeydown)
})

function windowkeydown(e: KeyboardEvent) {
  if (!display.value || (!focusOnFormula.value && !focusOnDescription.value)) return
  if (e.key === 'Escape') {
    e.preventDefault()
    display.value = false
  } else if (e.key === 'Enter' && focusOnFormula.value) {
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

function onAddFormula(e: MouseEvent) {
  ctxs.value[2].extra.display = true
  ctxs.value[2].extra.scale = 1 / store.view.zoon.value
  ctxs.value[2].extra.pos.set(store.toSpace(new Vector(vx.value + 50, vy.value + 50)))
  ctxs.value[2].extra.setTopic()
}


</script>

<template>
  <Transition name="manage-formula">
    <ResizableWindow v-if="display" v-model:left="vx" v-model:top="vy" v-model:width="width" v-model:height="height"
      :scale="store.view.zoon.value * scale" :min-width="600" :min-height="400" :resizable="!draging">
      <div :class="{ 'shake': invalid }"
        class="absolute transform-origin-[0_0] full bg-#303030 shadow-[0_1px_6px_#282828] rounded-8px overflow-hidden grid select-none"
        @click="e => e.stopPropagation()" :style="{
          fontSize: `${fontSize}px`,
          gridTemplateRows: `${fontSize * 1.5}px 1fr`
        }">
        <div class="bg-#303030 flex items-center flex-justify-end relative px-6px" @mousedown="beginDrag">
          <h5 class="absolute full flex-center color-#ccc pointer-events-none">管理化学式</h5>
          <span
            class="material-icons font-size-[1em_!important] color-#888 hover:color-#ccc transition-color cursor-pointer"
            @click="display = false" @mousedown="e => e.stopPropagation()">close</span>
        </div>
        <div :style="{
          padding: `${fontSize * 0.2}px`
        }">
          <Panel :default-size="20" :p1min="120" :p2min="400" :gap="10">
            <template #1>
              <div class="full grid" :style="{
                gridTemplateRows: `${fontSize * 1.4}px 1fr`,
                gap: `${fontSize * 0.3}px`
              }">
                <div class="grid" :style="{
                  gridTemplateColumns: `1fr ${fontSize * 1.6}px`,
                  gap: `${fontSize * 0.2}px`
                }">
                  <input class="w-full flex-center font-size-1em bg-#333" :style="{
                    borderRadius: `${fontSize * 0.2}px`,
                    height: `${fontSize * 1.4}px`,
                    padding: `${fontSize * 0.2}px ${fontSize * 0.3}px`
                  }" placeholder="Search" v-model="search"></input>
                  <div class="bg-#3a3a3a flex-center color-#999 font-size-0.8em cursor-pointer hoverbright" :style="{
                    borderRadius: `${fontSize * 0.2}px`,
                  }" @click="onAddFormula" @mousedown="e => e.stopPropagation()">
                    +</div>
                </div>
                <div class="flex flex-col overflow-hidden">
                  <div v-for="equ in store.state.nodes.filter(n => n.formula.string().includes(pretty(search)))"
                    class="w-full bg-#303030 font-size-1.2em hover:filter-brightness-120 cursor-pointer relative transition-filter duration-100"
                    @click="select(equ)" :style="{
                      padding: `${fontSize * 0.1}px ${fontSize * 0.32}px`,
                      borderRadius: `${fontSize * 0.2}px`,
                    }">
                    <div class="absolute h-full bg-#eee op-0 left-0 top-0 rounded-10px transition-opacity"
                      :class="{ 'op-100': selection === equ }" :style="{
                        width: `${fontSize * 0.1}px`,
                      }"></div>
                    <div
                      class="full color-#999 font-size-0.7em overflow-hidden text-ellipsis transition-[color,font-weight]"
                      :class="{ 'color-#eee font-bold': selection === equ }">
                      {{ equ.formula.string() }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template #2>
              <Panel :default-size="60" :gap="10" :p1min="200" :p2min="120">
                <template #1>
                  <Panel :default-size="{ 1: fontSize * 1.6 }" :p1min="fontSize * 1.6" direction="vertical"
                    :gap="fontSize * 0.2">
                    <template #1>
                      <textarea ref="inputFormula" :class="{ 'border-#f44': invalid }"
                        class="absolute left-0 top-0 full border-solid border-1 border-[rgba(140,90,90,0)] transition-border-color bg-#383838 rounded-6px resize-none"
                        :style="{
                          padding: `${fontSize * 0}px ${fontSize * 0.3}px`
                        }" v-model="formulaText" placeholder="化学式" @focusin="focusOnFormula = true"
                        @focusout="focusOnFormula = false"></textarea>
                    </template>
                    <template #2>
                      <Panel :gap="fontSize * 0.2">
                        <template #1>
                          <textarea class="full resize-none bg-#383838 rounded-6px p-6px" v-model="descriptionText"
                            placeholder="Markdown描述" @focus="focusOnDescription = true"
                            @blur="focusOnDescription = false"></textarea>
                        </template>
                        <template #2>
                          <div
                            class="full bg-#383838 font-size-1.2em rounded-6px absolute left-0 top-0 p-6px overflow-auto markdown"
                            v-html="marked.parse(descriptionText)"></div>
                        </template>
                      </Panel>

                    </template>
                  </Panel>
                </template>
                <template #2>
                  <div class="full grid grid-rows-[1fr_auto]" :style="{
                    gap: `${fontSize * 0.3}px`
                  }">
                    <div class="overflow-auto flex flex-col gap-4px px-2px font-size-0.8em *:color-#aaa">
                      <h2 class="m-[0_0_3px_0]">化学式属性</h2>
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
                        <span class="float-right">{{ selection && currentFormula &&
                          !selection.formula.deepEqual(currentFormula!) && store.state.nodes.filter(n =>
                            n.formula.deepEqual(currentFormula!)).length ? 'True' : 'False' }}</span>
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
                        <span class="float-right">{{ selection ? selection.style.type === NodeStyle.hidden ? 'False' :
                          'True' : 'Null' }}</span>
                      </div>
                      <div>
                        空间坐标：
                        <span class="float-right">{{ selection ? `(${selection.pos.x.toFixed(2)},
                          ${selection.pos.y.toFixed(2)})` : 'Null' }}</span>
                      </div>
                      <div>
                        视口坐标：
                        <span class="float-right">{{ selection ? `(${store.toView(selection.pos).x.toFixed(2)},
                          ${store.toView(selection.pos).y.toFixed(2)})` : 'Null' }}</span>
                      </div>
                    </div>
                    <div
                      class="flex flex-col *:font-size-0.8em *:shadow-none *:bg-#303030 *:inline *:p-[2px_9px] *:font-thin">
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
                      <button class="hoverbright" @click="update">
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
    </ResizableWindow>
  </Transition>
</template>

<style lang="scss" scoped>
.manage-formula-enter-from,
.manage-formula-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.manage-formula-enter-active,
.manage-formula-leave-active {
  transition-property: opacity, transform;
  transition-duration: 200ms;
}
</style>