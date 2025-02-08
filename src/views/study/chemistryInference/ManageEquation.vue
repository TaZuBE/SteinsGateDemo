<script lang="ts" setup>
import Panel from '@/components/Panel.vue'
import { watch, ref, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { Formula, FormulaNode, NodeStyle, useFormulaStore, pretty, Equation } from './data'
import { useToast } from 'vue-toastification'
import { marked } from 'marked'
import { Vector } from '@/assets/scripts/data'
import ResizableWindow from '@/components/ResizableWindow.vue'

const store = useFormulaStore()
const toast = useToast()

let lastCursorPos = new Vector()
const draging = ref(false)
function beginDrag(e: MouseEvent) {
  document.documentElement.classList.add('cursor-default')
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
  document.documentElement.classList.remove('cursor-default')
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
const inputEquation = ref<HTMLTextAreaElement | null>(null)
const selection = ref<Equation | null>(null)
const EquationText = ref('')
const descriptionText = ref('')
const tagText = ref('')
const invalid = ref(false)
const currentEquation = ref<Equation | null>(null)
const search = ref('')
const focusOnEquation = ref(false)
const focusOnDescription = ref(false)
const focusOnTag = ref(false)
const width = defineModel<number>('width', { default: 800 })
const height = defineModel<number>('height', { default: 500 })
const fontSize = computed(() => 16 + Math.min(width.value - 600, height.value - 400) * 0.03)
const scale = defineModel<number>('scale', { default: 1 })
const ctxs = defineModel<any>('ctxs', { required: true })

watch(display, () => {
  if (display.value) {
    nextTick(() => {
      if (inputEquation.value) {
        inputEquation.value.focus({ preventScroll: true })
      }
    })
  }
})
watch(EquationText, () => {
  try {
    const equ = Equation.parse(EquationText.value)
    currentEquation.value = equ
  } catch {
    currentEquation.value = null
  }
})

onMounted(() => {
  window.addEventListener('keydown', windowkeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', windowkeydown)
})

function windowkeydown(e: KeyboardEvent) {
  if (!display.value || (!focusOnEquation.value && !focusOnDescription.value && !focusOnTag.value)) return
  if (e.key === 'Escape') {
    e.preventDefault()
    display.value = false
  } else if (e.key === 'Enter' && focusOnEquation.value) {
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

function select(equ: Equation) {
  if (update()) {
    selection.value = equ
    EquationText.value = equ.string()
    descriptionText.value = equ.description
    tagText.value = equ.tag.join(' ')
  }
}

function setInvalid() {
  invalid.value = true
  setTimeout(() => invalid.value = false, 500)
}

function update() {
  if (!selection.value) return true
  try {
    const equ = Equation.parse(EquationText.value)
    equ.description = descriptionText.value
    equ.tag = tagText.value.split(' ').filter(t => t !== '')
    if (store.state.equations.filter(e => e.deepEqual(equ)).length && !selection.value.deepEqual(equ)) {
      toast.dismiss('equation repeated')
      nextTick(() => toast.error('方程式重复', {
        id: 'equation repeated',
      }))
      return false
    } else {
      toast.dismiss('saved equation')
      nextTick(() => toast.success('保存成功', {
        id: 'saved equation',
      }))
      selection.value.set(equ)
      return true
    }
  } catch {
    toast.dismiss('equation invalid')
    nextTick(() => toast.error('方程式无效', {
      id: 'equation invalid',
    }))
    setInvalid()
    return false
  }
}

const act = {
  reset() {
    if (!selection.value) return
    EquationText.value = selection.value.string()
    descriptionText.value = selection.value.description
  },
  delete() {
    if (!selection.value) return
    store.deleteEquation(selection.value)
    EquationText.value = ''
    descriptionText.value = ''
    selection.value = null
  },
}

function onAddFormula(e: MouseEvent) {
  ctxs.value[4].extra.display = true
  ctxs.value[4].extra.scale = 1 / store.view.zoon.value
  ctxs.value[4].extra.pos.set(store.toSpace(new Vector(vx.value + 50, vy.value + 50)))
  ctxs.value[4].extra.setTopic()
}


</script>

<template>
  <Transition name="manage-equation">
    <ResizableWindow v-if="display" v-model:left="vx" v-model:top="vy" v-model:width="width" v-model:height="height"
      :scale="store.view.zoon.value * scale" :min-width="600" :min-height="400" :resizable="!draging">
      <div :class="{ 'shake': invalid }"
        class="absolute full bg-#303030 shadow-[0_1px_6px_#282828] rounded-8px overflow-hidden grid select-none"
        @click="e => e.stopPropagation()" :style="{
          fontSize: `${fontSize}px`,
          gridTemplateRows: `${fontSize * 1.5}px 1fr`
        }">
        <div class="bg-#303030 flex items-center flex-justify-end relative px-6px" @mousedown="beginDrag">
          <h5 class="absolute full flex-center color-#ccc cursor-default pointer-events-none">管理方程式</h5>
          <span
            class="material-icons font-size-[1em_!important] color-#888 hover:color-#ccc transition-color cursor-pointer"
            @click="display = false" @mousedown="e => e.stopPropagation()">close</span>
        </div>
        <div :style="{
          padding: `${fontSize * 0.2}px`
        }">
          <Panel :default-size="30" :p1min="120" :p2min="400" :gap="10">
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
                  <div v-for="equ in store.state.equations.filter(e => e.string().includes(pretty(search)))"
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
                      {{ equ.string() }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template #2>
              <Panel :default-size="60" :gap="10" :p1min="200" :p2min="160">
                <template #1>
                  <Panel :default-size="{ 1: fontSize * 1.6 }" :p1min="fontSize * 1.6" direction="vertical"
                    :gap="fontSize * 0.2">
                    <template #1>
                      <textarea ref="inputEquation" :class="{ 'border-#f44': invalid }"
                        class="absolute left-0 top-0 full border-solid border-1 border-[rgba(140,90,90,0)] transition-border-color bg-#383838 rounded-6px resize-none"
                        :style="{
                          padding: `${fontSize * 0}px ${fontSize * 0.3}px`
                        }" v-model="EquationText" placeholder="方程式" @focusin="focusOnEquation = true"
                        @focusout="focusOnEquation = false"></textarea>
                    </template>
                    <template #2>
                      <Panel direction="vertical" :gap="fontSize * 0.2" :default-size="{ 2: fontSize * 2.3 }" :p2min="fontSize * 2.3">
                        <template #1>
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
                        <template #2>
                          <textarea class="full resize-none bg-#383838 rounded-6px p-6px" v-model="tagText"
                            placeholder="标签" @focus="focusOnTag = true" @blur="focusOnTag = false"></textarea>
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
                      <h2 class="m-[0_0_3px_0]">方程式属性</h2>
                      <div>
                        原方程：
                        <span class="float-right">{{ selection ? selection.string() : 'Null' }}</span>
                      </div>
                      <div>
                        方程有效：
                        <span class="float-right">{{ currentEquation ? 'True' : 'False' }}</span>
                      </div>
                      <div>
                        方程重复：
                        <span class="float-right">{{ selection && currentEquation &&
                          !selection.deepEqual(currentEquation!) && store.state.equations.filter(n =>
                            n.deepEqual(currentEquation!)).length ? 'True' : 'False' }}</span>
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
.manage-equation-leave-active,
.manage-equation-enter-active {
  transition: opacity 200ms, transform 200ms;
}

.manage-equation-enter-from,
.manage-equation-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.3);
}
</style>