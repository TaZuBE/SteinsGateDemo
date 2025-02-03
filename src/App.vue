<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router'
import { RouterLink, RouterView } from 'vue-router'

const links = [
  {
    to: '/study',
    icon: 'school',
  },
  {
    to: '/debug',
    icon: 'bug_report'
  },
]
const route = useRoute()

</script>

<template>
  <div class="screen-container">
    <div class="nav">
      <RouterLink v-for="(link, i) in links" :to="link.to">
        <span class="material-icons font-size-[1.8em_!important] color-#888 transition-color transition-duration-300"
          :class="{ 'color-#eee': route.path.includes(link.to) }">{{ link.icon }}</span>
      </RouterLink>
    </div>
    <div class="view">
      <RouterView />
    </div>
  </div>
  <video class="absolute left-0 top-0 full object-cover op-10 pointer-events-none"
    src="/videos/background-cover/龙族-绘梨衣.mp4" autoplay muted loop />
</template>

<style lang="scss" scoped>
$nav-color: #1a1a1a;

.screen-container {
  background-color: #333333;
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  opacity: 1;
  display: grid;
  grid-template-columns: 60px 1fr;
  overflow: hidden;
}

.nav {
  background-color: $nav-color;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
}

a {
  width: 44px;
  height: 44px;
  margin: 8px 8px 0 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  transition: filter 0.3s;
  text-decoration: none;
}

a:hover {
  filter: brightness(1.3);
}
</style>
