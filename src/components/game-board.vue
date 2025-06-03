<template>
  <div class="mb-2 flex shrink-0 flex-col items-center drop-shadow-md">
    <div :key="yi" class="flex" v-for="yi in size.height">
      <div :class="gameEnded ? 'animate-win' : ''" :id="`cell-${xi}${yi}`" :key="xi" @click="$emit('cell-click', $event)"
        class="size-14 cursor-pointer text-transparent transition-all duration-300 hover:opacity-80" v-for="xi in size.width">
        {{ xi }}/ {{ yi }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  gameEnded: { default: false, type: Boolean },
  size: {
    default: () => ({ height: 7, width: 7 }),
    type: Object,
  },
})
defineEmits(['cell-click'])
</script>

<style scoped>
@reference "tailwindcss";

.animate-win {
  animation: win 1s linear infinite;
  animation-direction: alternate;
}

@keyframes win {
  0% { transform: scale(1); }
  50% { transform: scale(.9); }
  100% { transform: scale(1) rotate(90deg); }
}
</style>
