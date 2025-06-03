<template>
  <div class="flex items-center justify-center gap-6">
    <button @click="$emit('restart')" class="app-btn" type="button">
      Restart
    </button>
    <button @click="$emit('use-seed')" class="app-btn" type="button">
      Use seed
    </button>
    <button @click="$emit('new-game')" class="app-btn" type="button">
      New game
    </button>
  </div>
</template>

<script setup>
defineEmits(['restart', 'use-seed', 'new-game'])
</script>

<style scoped>
@reference "tailwindcss";

.app-btn {
  @apply bg-transparent border border-solid border-current rounded-md text-white cursor-pointer text-lg px-4 py-2 transition-opacity hover:opacity-100 opacity-70;
}
</style>
