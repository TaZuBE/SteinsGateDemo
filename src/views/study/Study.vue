<script lang="ts" setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import Panel from '@/components/Panel.vue'
import { ref } from 'vue'

const links = [
  {
    to: '/study/chemistry-inference',
    icon: 'science',
    text: 'ChemistryInference',
  },
]
const route = useRoute()

</script>

<template>
  <div class="full relative">
    <Panel :default-size="{ 1: 200 }" p1closable :p1min="130">
      <template #1>
        <div class="full bg-#272727 p-8px select-none overflow-hidden">
          <h5 class="m-[2px_0_10px_8px] color-#666">Study</h5>
          <div class="flex flex-col gap-16px">
            <RouterLink v-for="(link, i) in links" :to="link.to"
              class="w-full decoration-none flex gap-4px *:color-#888 *:hover:brightness-130 *:transition-[filter,color]"
              :class="{ '*:color-[#eee_!important]': route.path.includes(link.to) }">
              <span class="material-icons">{{ link.icon }}</span>
              <span class="overflow-hidden text-ellipsis">{{ link.text }}</span>
            </RouterLink>
          </div>
        </div>
      </template>
      <template #2>
        <div class="full overflow-hidden">
          <RouterView />
        </div>
      </template>
    </Panel>
  </div>
</template>