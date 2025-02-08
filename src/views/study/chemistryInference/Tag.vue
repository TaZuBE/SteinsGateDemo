<script lang="ts" setup>

</script>

<template>
  <div class="grid grid-cols-[0.6em_1fr] rounded-r-0.4em p-[1px_3px_1px_0] select-none" style="
    clip-path: polygon(0 50%, 0.6em 0, 100% 0, 100% 100%, 0.6em 100%);
  ">
    <div></div>
    <div>
      <slot></slot>
    </div>
  </div>
</template>