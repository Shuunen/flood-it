<template>
  <div>
    <p class="mb-2 text-xl underline underline-offset-8">
      You win in <span>{{ moves }}</span> moves<span v-if="sameScore"> again</span>!
    </p>
    <small v-if="scoreSubmitted">Score has been submitted.</small>
    <div v-if="askPlayer && !scoreSubmitted">
      <p>
        You want to be in the high-scores?<br>
        What's your name?
      </p>
      <form @submit.prevent="$emit('post-form')" id="askPlayerForm">
        <label for="name">
          Hero name :
          <input @focus="$emit('show-player-rules')" id="name" maxlength="10" minlength="3" placeholder="hero name" type="text" :value="player"
            @input="handlePlayerInput">
        </label>
        <input @click="$emit('set-storage')" type="submit" value="Send !">
        <ul v-if="askPlayerRules">
          <li v-if="!player || player.length === 0">
            Name cannot be empty.
          </li>
          <li v-if="player.length < 3 || player.length > 10">
            Name should be between 3 & 10 characters long.
          </li>
        </ul>
      </form>
    </div>
  </div>
</template>

<script setup>
defineProps({
  askPlayer: { default: false, type: Boolean },
  askPlayerRules: { default: false, type: Boolean },
  moves: { default: 0, type: Number },
  player: { default: '', type: String },
  sameScore: { default: false, type: Boolean },
  scoreSubmitted: { default: false, type: Boolean },
})

const emit = defineEmits([
  'post-form',
  'set-storage',
  'show-player-rules',
  'update:player',
])

function handlePlayerInput(event) {
  const target = event.target
  emit('update:player', target?.value ?? '')
}
</script>
