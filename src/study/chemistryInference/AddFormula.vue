<script lang="ts" setup>
import { nextTick, reactive, ref, watch } from 'vue'
import { Formula, FormulaNode, useFormulaStore } from './data'
import Panel from '@/components/Panel.vue'
import { useToast } from 'vue-toastification'
import { marked } from 'marked'

const toast = useToast()
const store = useFormulaStore()


const props = defineProps({
  display: {
    type: Boolean,
    required: true,
  }
})
const emit = defineEmits(['close'])


const formulaText = ref('')
const descriptionText = ref('')
const input1 = ref<HTMLTextAreaElement | null>(null)
const input2 = ref<HTMLTextAreaElement | null>(null)

const tip1 = ref<HTMLSpanElement | null>(null)
const p1min = ref(0)
const tip2 = ref<HTMLSpanElement | null>(null)
const p2min = ref(0)

const formulaInfo = reactive({
  valid: {
    text: '有效',
    value: false,
  },
  repeat: {
    text: '重复',
    value: false,
  },
  length: {
    text: '长度',
    value: 0,
  },
  elementCount: {
    text: '元素数量',
    value: -1,
  },
  weight: {
    text: '相对分子质量',
    value: -1,
  }
})
let invalid = ref(false)
let lastEnterTime = -1


watch(props, () => {
  if (props.display) {
    formulaText.value = ''
    descriptionText.value = ''
    nextTick(() => {
      if (input1.value && tip1.value && tip2.value) {
        input1.value.focus()
        p1min.value = tip1.value.getBoundingClientRect().width + 12
        p2min.value = tip2.value.getBoundingClientRect().width + 12
      }
    })
    window.addEventListener('keydown', windowkeydown)
  } else {
    window.removeEventListener('keydown', windowkeydown)
  }
})
watch(formulaText, () => {
  try {
    const f = Formula.parse(formulaText.value)
    formulaInfo.valid.value = true
    formulaInfo.repeat.value = store.state.nodes.find(n => n.formula.deepEqual(f)) ? true : false
    formulaInfo.elementCount.value = f.elementCount()
    formulaInfo.weight.value = f.weight()
  } catch {
    formulaInfo.valid.value = false
    formulaInfo.repeat.value = false
    formulaInfo.elementCount.value = -1
    formulaInfo.weight.value = -1
  }
  formulaInfo.length.value = formulaText.value.length
})
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
  if (e.key === 'Escape') {
    emit('close')
  } else if (e.key === 'Enter' && document.activeElement !== input2.value) {
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
  if (!formulaInfo.valid.value) {
    toast.error('无效化学式')
    setInvalid()
  } else if (formulaInfo.repeat.value) {
    toast.error('化学式重复')
    setInvalid()
  } else {
    toast.success('成功添加化学式')
    const f = Formula.parse(formulaText.value)
    f.description = descriptionText.value
    store.addNode(new FormulaNode(f))
    emit('close')
  }
}


</script>

<template>
  <Teleport to=".screen-container">
    <Transition name="t0">
      <div v-show="props.display"
        class="absolute w-100vw h-300vh top--100vh flex justify-center items-center bg-[rgb(15,15,15,0.5)]"
        @click="emit('close')">
        <div :class="invalid ? 'shake' : ''"
          class="w-800px h-600px bg-#333 rounded-xl shadow-2xl grid grid-rows-[60px_1fr] p-[10px_30px]"
          @click="(e) => e.stopPropagation()">
          <h1 class="flex items-center justify-center font-size-26px">添加化学式</h1>
          <div>
            <Panel :gap="6" :default-size="70" :p1min="200" :p2min="160">
              <template #1>
                <Panel :gap="6" :default-size="{ 1: 0 }" :p1min="50" :p2min="100" direction="vertical">
                  <template #1>
                    <textarea ref="input1" :class="{ 'outline-[rgba(200,50,50,1)]': invalid }"
                      class="full bg-#383838 border-none resize-none font-size-20px outline outline-1 outline-[rgba(200,50,50,0)] transition-outline-color"
                      placeholder="化学式" v-model="formulaText"></textarea>
                  </template>
                  <template #2>
                    <Panel :gap="6">
                      <template #1>
                        <textarea ref="input2"
                          class="full bg-#383838 border-none resize-none font-size-20px outline-none"
                          placeholder="Markdown描述" v-model="descriptionText"></textarea>
                      </template>
                      <template #2>
                        <div
                          class="full bg-#383838 font-size-20px rounded-6px absolute left-0 top-0 p-10px overflow-auto markdown"
                          v-html="marked.parse(descriptionText)">
                        </div>
                      </template>
                    </Panel>
                  </template>
                </Panel>
              </template>
              <template #2>
                <div class="full relative">
                  <div class="p-x-10px *:m-b-8px">
                    <h3 class="m-0">化学式属性：</h3>
                    <div v-for="info in formulaInfo">{{ info.text }}：{{ prettyPrint(info.value.toString()) }}</div>
                  </div>
                  <div
                    class="absolute bottom-0 w-full flex flex-col *:font-size-1em *:shadow-none *:bg-#333 *:inline *:p-[4px_18px] *:font-thin">
                    <button class="hoverbright" @click="emit('close')">
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
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.t0-enter-active,
.t0-leave-active {
  transition: opacity 200ms, transform 200ms;
}

.t0-enter-from,
.t0-leave-to {
  transform: translateY(60px);
  opacity: 0;
}
</style>