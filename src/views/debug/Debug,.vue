<script lang="ts" setup>
import { RoundTransition, SmoothTransition } from '@/assets/scripts/transition'
import { onMounted, ref } from 'vue';

const cvs = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  drawBezier()
})

function drawBezier() {
  if (!cvs.value) return
  const ctx = cvs.value.getContext('2d')
  if (!ctx) return

  const ost = new RoundTransition()
  const cst = new SmoothTransition()
  ost.duration = cst.duration = 500
  ost.value = cst.value = 400
  ost.ontransition((v: number, p: number) => {
    ctx.fillStyle = '#58e'
    ctx.beginPath()
    ctx.arc(p, 1000 - v, 3, 0, Math.PI * 2)
    ctx.fill()
  })
  cst.ontransition((v: number, p: number) => {
    ctx.fillStyle = '#8ae'
    ctx.beginPath()
    ctx.arc(p, 1000 - v, 3, 0, Math.PI * 2)
    ctx.fill()
  })
  setTimeout(() => {
    cst.value = 800
  }, 100)
  setTimeout(() => {
    cst.value = 0
  }, 400)
  setTimeout(() => {
    cst.value = 800
  }, 600)
  // let count = 1
  // setInterval(() => {
  //   ost.value = 400
  //   // count == 100
  // }, 100)
}

</script>

<template>
  <div class="p-50px">
    <h1>This is the Testing Area.</h1>
    <canvas ref="cvs" width="1600" height="1000" class="w-1600px h-1000px bg-#58e bg-op-30 "></canvas>
  </div>
</template>