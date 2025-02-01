<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="screen-container">
    <div class="nav">
      <RouterLink to="/study/blank">
        <span class="material-icons">school</span>
      </RouterLink>
    </div>
    <div class="view">
      <RouterView />
    </div>
  </div>
  <video class="background" src="/videos/background-cover/龙族-绘梨衣.mp4" autoplay muted loop />
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
.view {
  position: relative;
}
a {
  background-color: $nav-color;
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
span {
  font-size: 1.7em;
}
.nav img {
  background-color: $nav-color;
  width: 30px;
  height: 30px;
}

.background {
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  opacity: 0.1;
  pointer-events: none;
}
</style>
