<script lang="ts" setup>
import Panel from '@/components/Panel.vue'
import { watch, ref } from 'vue'
import { Equation, NodeStyle, pretty, useFormulaStore } from './data'
import { useToast } from 'vue-toastification'
import AddEquation from './AddEquation.vue'
import { marked } from 'marked'

const store = useFormulaStore()
const toast = useToast()

const props = defineProps({
  display: {
    type: Boolean,
    required: false,
  },
})
const emit = defineEmits(['close'])

watch(props, () => {
  if (props.display) {
    window.addEventListener('keydown', windowkeydown)
    selection.value = null
    equationText.value = ''
    descriptionText.value = ''
  } else {
    window.removeEventListener('keydown', windowkeydown)
  }
})


const selection = ref<Equation | null>(null)
const equationText = ref('')
const descriptionText = ref('')
const invalid = ref(false)
const currentEquation = ref<Equation | null>(null)
const search = ref('')
const addingEquation = ref(false)
let enableShortcut = true


watch(equationText, () => {
  try {
    const e = Equation.parse(equationText.value)
    e.description = descriptionText.value
    currentEquation.value = e
  } catch {
    currentEquation.value = null
  }
})

function windowkeydown(e: KeyboardEvent) {
  if (!enableShortcut) return
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
  if (e.ctrlKey && (e.key == 'R' || e.key == 'r')) {
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
    equationText.value = equ.string()
    descriptionText.value = equ.description
  }
}

function setInvalid() {
  invalid.value = true
  setTimeout(() => invalid.value = false, 500)
}

function update() {
  if (!selection.value || (currentEquation.value && selection.value.deepEqual(currentEquation.value))) return true
  if (currentEquation.value) {
    currentEquation.value.description = descriptionText.value
    if (store.state.equations.filter(e => e.deepEqual(currentEquation.value!)).length && !selection.value.deepEqual(currentEquation.value)) {
      toast.error('重复的方程式')
      return false
    } else {
      console.log('save')
      selection.value.set(currentEquation.value)
      return true
    }
  } else {
    toast.error('无效的方程式')
    setInvalid()
    return false
  }
}

const act = {
  reset() {
    if (!selection.value) return
    equationText.value = selection.value.string()
    descriptionText.value = selection.value.description
  },
  delete() {
    if (!selection.value) return
    store.deleteEquation(selection.value)
    equationText.value = ''
    descriptionText.value = ''
    selection.value = null
  },
}

function onAddEquation() {
  addingEquation.value = true
  enableShortcut = false
}

function afterAddEquation() {
  addingEquation.value = false
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
          <h2 class="flex-center mt-5px">管理方程式</h2>
          <Panel :default-size="{ 1: 240 }" :p1min="150" :p2min="300" :gap="10">
            <template #1>
              <div class="full grid grid-rows-[25px_1fr] gap-10px">
                <div class="mx-6px grid grid-cols-[1fr_40px] gap-6px">
                  <input class="w-full flex-center px-10px py-4px rounded-20px font-size-15px bg-#333" placeholder="搜索"
                    v-model="search"></input>
                  <div class="bg-#3a3a3a rounded-10px flex-center color-#999 font-size-20px cursor-pointer hoverbright"
                    @click="onAddEquation">
                    +</div>
                </div>
                <div class="flex flex-col overflow-hidden">
                  <div v-for="equ in store.state.equations.filter(e => e.string().includes(pretty(search)))"
                    class="bg-#333 rounded-8px pl-14px py-5px font-size-18px hover:filter-brightness-120 cursor-pointer relative"
                    @click="select(equ)">
                    <div class="w-full relative">
                      <div class="absolute w-2px h-full bg-#eee op-0 left--8px top-0 rounded-10px transition-opacity"
                        :class="{ 'op-100': selection === equ }"></div>
                      <div class="w-full overflow-hidden text-ellipsis color-#999 transition-[font-weight,color] select-none"
                        :class="{ 'color-#eee font-bold': selection === equ }">
                        {{ equ.string() }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template #2>
              <Panel :default-size="{ 2: 200 }" :gap="10" :p2min="220">
                <template #1>
                  <Panel :default-size="{ 1: 0 }" :p1min="50" direction="vertical" :gap="6">
                    <template #1>
                      <textarea :class="{ 'outline-#f44': invalid }"
                        class="full outline outline-1 outline-[rgba(140,90,90,0)] transition-outline-color resize-none bg-#383838 rounded-6px font-size-1.2em"
                        v-model="equationText" placeholder="方程式"></textarea>
                    </template>
                    <template #2>
                      <Panel :gap="6">
                        <template #1>
                          <textarea class="full resize-none bg-#383838 rounded-6px font-size-1.2em"
                            v-model="descriptionText" placeholder="Markdown描述"></textarea>
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
                  <div class="full grid grid-rows-[1fr_auto]">
                    <div class="w-full flex flex-col gap-8px px-4px overflow-hidden *:w-full">
                      <h2 class="m-[0_0_6px_0]">方程式属性</h2>
                      <div>
                        原方程：
                        <div class="break-words">
                          {{ selection ? selection.string() : 'Null' }}
                        </div>
                      </div>
                      <div>
                        方程有效：
                        <div class="float-right">{{ currentEquation ? 'True' : 'False' }}</div>
                      </div>
                      <div>
                        方程重复：
                        <div class="float-right">
                          {{ currentEquation && !selection!.deepEqual(currentEquation) && store.state.equations.filter(e => e.deepEqual(currentEquation!)).length ? 'True' : 'False' }}
                        </div>
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

  <AddEquation :display="addingEquation" @close="afterAddEquation"></AddEquation>
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