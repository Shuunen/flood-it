<template>
  <div>{{ moves }} moves</div>
</template>

<script setup>
defineProps({
  moves: { default: 0, type: Number },
})
</script>
