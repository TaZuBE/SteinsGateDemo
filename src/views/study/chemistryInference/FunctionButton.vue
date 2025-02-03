<script lang="ts" setup>
import { useToast } from 'vue-toastification'
import { useFormulaStore } from './data'

declare global {
  interface Window {
    showSaveFilePicker: (...args: any) => Promise<any>
    showOpenFilePicker: (...args: any) => Promise<any>
  }
}

const store = useFormulaStore()
const toast = useToast()

async function saveFile() {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: '化学式推断图.json',
      types: [
        {
          description: 'Text Files',
          accept: { 'application/json': ['.json'] },
        },
      ],
    })
    const writable = await handle.createWritable()
    await writable.write(store.formData())
    await writable.close()
    toast.success('保存成功！', {
      timeout: 2000
    })
  } catch (error) {
    toast.info('保存取消', {
      timeout: 2000
    })
  }
}

async function openFile() {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: '保存的化学推断图',
          accept: { 'application/json': ['.json'] },
        },
      ],
    })
    try {
      store.saveCopyData()
      store.restoreJson(await (await handle.getFile()).text())
      toast.success('已解析文件！', {
        timeout: 2000
      })
    } catch {
      store.fromCopy()
      toast.error('文件格式错误！', {
        timeout: 2000
      })
    }
  } catch {
    toast.info('上传文件取消', {
      timeout: 2000
    })
  }
}

</script>

<template>
  <div
    class="full absolute flex flex-row p-4px gap-4px pointer-events-none *:pointer-events-auto *:size-35px *:rounded-6px *:bg-#444 *:bg-op-50 *:flex-center *:font-size-1.6em *:cursor-pointer *:select-none *:shadow-[1px_1px_4px_#222]">
    <div class="flex-center hoverbright" @click="saveFile">
      <span class="material-icons">save</span>
    </div>
    <div class="flex-center hoverbright" @click="saveFile">
      <span class="material-icons">upgrade</span>
    </div>
  </div>
</template>