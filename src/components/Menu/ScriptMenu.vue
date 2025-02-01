<script lang="ts" setup>
import { Vector } from '@/assets/scripts/data'
import { ref, watch } from 'vue';

// props
const props = defineProps({
	port: {
		type: Boolean,
		defualt: true,
	},
	on: {
		type: Boolean,
		required: true
	},
	pos: {
		type: Vector,
		required: true
	},
	context: {
		type: Object as () => {
			text: string,
			sec?: boolean,
			onclick?: Function,
		}[],
		required: true
	}
})
watch(props, () => {
	setMenu(props.on)
})


const menu = ref<HTMLDivElement | null>(null)

function setMenu(on: boolean) {
	if (!menu.value) return
	if (on) {
		// menu.value.style.left = `${props.pos.x}px`
		// menu.value.style.top = `${props.pos.y}px`
	} else {

	}
}

</script>

<template>
	<Teleport to="body" v-if="props.port">
		<div ref="menu" class="menu" :style="{
			opacity: `${props.on ? 100 : 0}%`,
			pointerEvents: props.on ? 'all' : 'none',
			left: `${props.pos.x}px`,
			top: `${props.pos.y}px`,
		}">
			<span v-for="item in props.context" class="item">{{ item.text }}</span>
		</div>
	</Teleport>
</template>

<style lang="scss" scoped>

.menu {
	position: absolute;
	padding: 10px;
	border-radius: 10px;
	background: rgba(45, 45, 45, 0.8);
	box-shadow: 2px 2px 8px #222;
	transition: opacity ease 150ms;

	display: flex;
	flex-direction: column;
}
.item {
	cursor: pointer;
	padding: 5px;
	border-radius: 5px;
	transition: background ease 200ms;
}
.item:hover {
	background-color: rgba(255, 255, 255, 0.1);
}
</style>