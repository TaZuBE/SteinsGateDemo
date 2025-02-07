<script lang="ts" setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Equation, useFormulaStore } from './data'
import Panel from '@/components/Panel.vue'
import { useToast } from 'vue-toastification'
import { marked } from 'marked'
import { Vector } from '@/assets/scripts/data'
import ResizableWindow from '@/components/ResizableWindow.vue'

const toast = useToast()
const store = useFormulaStore()


const display = defineModel<boolean>('display', { required: true })
const spos = defineModel<Vector>('pos', { required: true })
const vpos = computed(() => store.toView(spos.value))
const left = computed({
  get: () => vpos.value.x,
  set: v => spos.value.x = store.toSpace(new Vector(v, 0)).x
})
const top = computed({
  get: () => vpos.value.y,
  set: v => spos.value.y = store.toSpace(new Vector(0, v)).y
})
const width = defineModel<number>('width', { default: 640 })
const height = defineModel<number>('height', { default: 480 })
  const scale = defineModel<number>('scale', { required: true })
const fontSize = computed(() => 18 + Math.min(width.value - 480, height.value - 360) * 0.03)

const equationText = ref('')
const descriptionText = ref('')
const input1 = ref<HTMLTextAreaElement | null>(null)
const input2 = ref<HTMLTextAreaElement | null>(null)

const equationInfo = reactive({
  valid: {
    text: '有效',
    value: false,
  },
  repeat: {
    text: '重复',
    value: false,
  },
})
let invalid = ref(false)
let lastEnterTime = -1
let focusOnText = ref(false)
let focusOnDescription = ref(false)

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

watch(display, () => {
  if (display.value) {
    equationText.value = ''
    descriptionText.value = ''
    nextTick(() => {
      if (input1.value) {
        input1.value.focus({ preventScroll: true })
      }
    })
    window.addEventListener('keydown', windowkeydown)
  } else {
    window.removeEventListener('keydown', windowkeydown)
  }
})
watch(equationText, onchangeEquationText)
function onchangeEquationText() {
  try {
    const equ = Equation.parse(equationText.value)
    equationInfo.valid.value = true
    equationInfo.repeat.value = store.state.equations.find(e => e.deepEqual(equ)) ? true : false
  } catch {
    equationInfo.valid.value = false
    equationInfo.repeat.value = false
  }
}
function prettyPrint(str: string) {
  if (str === 'false') {
    return '假'
  }
  if (str === 'true') {
    return '真'
  }
  if (str === '-1') {
    return '...'
  }
  return str
}

function windowkeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && (focusOnText.value || focusOnDescription.value)) {
    display.value = false
  } else if (e.key === 'Enter' && focusOnText.value) {
    e.preventDefault()
    confirm()
  }
}

function setInvalid() {
  invalid.value = true
  setTimeout(() => invalid.value = false, 500)
}

function confirm() {
  if (Date.now() - lastEnterTime < 800) return
  lastEnterTime = Date.now()
  toast.clear()
  if (!equationInfo.valid.value) {
    toast.error('无效方程式')
    setInvalid()
  } else if (equationInfo.repeat.value) {
    toast.error('方程式重复')
    setInvalid()
  } else {
    toast.success('成功添加方程式')
    const equ = Equation.parse(equationText.value)
    equ.description = descriptionText.value
    store.addEquation(equ)
    display.value = false
  }
  onchangeEquationText()
}


</script>

<template>
  <Transition name="t0">
    <ResizableWindow v-if="display" v-model:left="left" v-model:top="top" v-model:width="width" v-model:height="height"
      :min-width="480" :min-height="300" :scale="store.view.zoon.value * scale" :resizable="!draging">
      <div :class="invalid ? 'shake' : ''" class="full bg-#303030 shadow-[#222_0_1px_8px] grid select-none" :style="{
        fontSize: `${fontSize}px`,
        gridTemplateRows: `${fontSize * 1.5}px 1fr`,
        borderRadius: `${fontSize * 0.5}px`
      }" @click="(e) => e.stopPropagation()">
        <div class="relative">
          <h5 class="full flex-center mt--1px" @mousedown="beginDrag">添加方程式</h5>
          <div class="h-full absolute right-0 top-0 flex justify-end items-center">
            <span
              class="material-icons font-size-[0.8em_!important] color-#888 hover:color-#ccc transition-color cursor-pointer"
              :style="{
                width: `${fontSize}px`
              }" @click="display = false">close</span>
          </div>
        </div>
        <div :style="{
          padding: `0 ${fontSize * 1}px ${fontSize * 0.6}px ${fontSize * 1}px`,
        }">
          <Panel :gap="fontSize * 0.2" :default-size="70" :p1min="fontSize * 10" :p2min="fontSize * 8">
            <template #1>
              <Panel :gap="fontSize * 0.2" :default-size="{ 1: fontSize * 2 }" :p1min="fontSize * 2" :p2min="100"
                direction="vertical">
                <template #1>
                  <textarea ref="input1" :class="{ 'border-[rgba(200,50,50,1)]': invalid }"
                    class="full bg-#383838 border-1 border-solid resize-none border-[rgba(200,50,50,0)] transition-border-color"
                    :style="{
                      padding: `${fontSize * 0.2}px`
                    }" placeholder="方程式" v-model="equationText" @focusin="focusOnText = true" @focusout="focusOnText = false"></textarea>
                </template>
                <template #2>
                  <Panel :gap="fontSize * 0.2">
                    <template #1>
                      <textarea ref="input2" class="full bg-#383838 border-none resize-none outline-none" :style="{
                        padding: `${fontSize * 0.2}px`
                      }" placeholder="Markdown描述" v-model="descriptionText" @focusin="focusOnDescription = true" @focusout="focusOnDescription = false"></textarea>
                    </template>
                    <template #2>
                      <div class="full bg-#383838 rounded-6px absolute left-0 top-0 overflow-auto markdown" :style="{
                        padding: `${fontSize * 0.2}px`
                      }" v-html="marked.parse(descriptionText)">
                      </div>
                    </template>
                  </Panel>
                </template>
              </Panel>
            </template>
            <template #2>
              <div class="full relative grid grid-rows-[1fr_auto]" :style="{
                gap: `${fontSize * 0.3}px`
              }">
                <div class="overflow-auto h-full p-x-10px *:m-b-8px *:color-#ccc font-size-0.9em">
                  <h3 class="m-0">方程式属性：</h3>
                  <div v-for="info in equationInfo">{{ info.text }}：{{ prettyPrint(info.value.toString()) }}</div>
                </div>
                <div
                  class="full flex flex-col *:shadow-none *:bg-#303030 *:inline *:p-[4px_18px] *:font-thin font-size-0.9em">
                  <button class="hoverbright" @click="display = false">
                    <span class="float-left">取消</span>
                    <span class="float-right">Esc</span>
                  </button>
                  <button class="hoverbright" @click="confirm">
                    <span class="float-left">确认</span>
                    <span class="float-right">Enter</span>
                  </button>
                </div>
              </div>
            </template>
          </Panel>
        </div>
      </div>
    </ResizableWindow>
  </Transition>
</template>

<style lang="scss" scoped>
.t0-enter-active,
.t0-leave-active {
  transition: opacity 200ms, transform 200ms;
}

.t0-enter-from,
.t0-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>