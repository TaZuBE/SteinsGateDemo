<script lang="ts" setup>
import { RouterLink, RouterView } from 'vue-router'
import Panel from '@/components/Panel.vue'
</script>

<template>
  <div class="full relative">
    <Panel :default-size="{1: 200}" p1closable :p1min="130">
      <template #1>
        <div class="full bg-#272727 flex flex-col select-none overflow-hidden">
          <RouterLink to="/study/chemistry-inference">Chemical inference</RouterLink>
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

<style lang="scss" scoped>
$nav-color: #272727;
a {
  width: calc(100% - 32px);
  background-color: $nav-color;
  margin: 10px 10px 0 10px;
  padding: 6px;
  border-radius: 5px;
  text-decoration: none;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

a:hover {
  filter: brightness(1.3);
}
</style>