<!-- eslint-disable jsdoc/require-jsdoc -->
<!-- eslint-disable no-console -->
<!-- eslint-disable no-magic-numbers -->
<script setup lang="ts">
import { randomNumber, storage } from 'shuutils'
import { ref } from 'vue'
import GameBoard from './components/game-board.vue'
import GameButtons from './components/game-buttons.vue'
import MoveCounter from './components/move-counter.vue'
import WinDialog from './components/win-dialog.vue'

storage.prefix = 'flood-it_'

const seedFormat = /(?<width>\d+)x(?<height>\d+)_(?<cells>\d+)/u
const baseColor = ref('')
const floodColor = ref('')
const moves = ref(0)
const player = ref('Unknown hero')
const seed = ref('')
const askPlayer = ref(false) // eslint-disable-line no-useless-assignment
const askPlayerRules = ref(false) // eslint-disable-line no-useless-assignment
const gameEnded = ref(false)
const sameScore = ref(false)
const scoreSubmitted = ref(false)
const size = { height: 7, width: 7 }
const colors = ['royalblue', 'deeppink', 'chartreuse', 'darkorange']
const delay = 200

function getCell(positionX, positionY, willThrow = false) {
  const cell = document.querySelector<HTMLElement>(`#cell-${positionX}${positionY}`)
  // eslint-disable-next-line no-restricted-syntax
  if (!cell && willThrow) throw new Error(`no cell found on pos x/y : ${positionX}/${positionY}`)
  return cell
}

function colorCell(positionX, positionY, color) {
  const cell = getCell(positionX, positionY)
  if (!cell) { console.error(`no cell found on pos x/y : ${positionX}/${positionY}`); return }
  cell.style.backgroundColor = color
}

function setGrid() {
  // ex : '7x7_3200013120203221020122022130221111223000303132131'
  // size = '7x7'
  // content = '3200013120203221020122022130221111223000303132131'
  let [, content] = seed.value.split('_')
  if (content === undefined) { console.error('failed to get seed content'); return }
  for (let yi = 1; yi <= size.height; yi += 1)
    for (let xi = 1; xi <= size.width; xi += 1) {
      const index = Number.parseInt(content[0] ?? '', 10)
      // content = '200013120203221020122022130221111223000303132131'
      content = content.slice(1)
      colorCell(xi, yi, colors[index] ?? 'red')
    }
}

function getCellColor(positionX, positionY) {
  const cell = getCell(positionX, positionY)
  if (!cell) {
    console.error(`no cell found on pos x/y : ${positionX}/${positionY}`)
    return ''
  }
  return cell.style.backgroundColor
}

function onGameEnded() {
  console.log('game ended')
  gameEnded.value = true
}

function checkEnd() {
  // avoid multiple sync calls when game is ended
  if (gameEnded.value) return
  setTimeout(() => {
    // avoid multiple async calls when game is ended
    if (gameEnded.value) return
    let isEnd = true
    for (let yi = 1; yi <= size.height; yi += 1) {
      for (let xi = 1; xi <= size.width; xi += 1) {
        // avoid parsing further cols when game is ended
        if (!isEnd) break
        const color = getCellColor(xi, yi)
        if (floodColor.value !== color) isEnd = false
      }
      // avoid parsing further rows when game is ended
      if (!isEnd) break
    }
    if (isEnd) onGameEnded()
  }, delay)
}

function floodCell(positionX, positionY) {
  const cell = getCell(positionX, positionY)
  if (!cell) return
  if (cell.style.backgroundColor === baseColor.value) {
    cell.style.backgroundColor = floodColor.value
    floodCell(positionX - 1, positionY)
    floodCell(positionX + 1, positionY)
    floodCell(positionX, positionY - 1)
    floodCell(positionX, positionY + 1)
    checkEnd()
  }
}

function flood() {
  baseColor.value = getCellColor(1, 1)
  // if asked color is the same as base color
  if (baseColor.value === floodColor.value) return
  console.log(`base is "${baseColor.value}" & user asked to flood with "${floodColor.value}"`)
  moves.value += 1
  floodCell(1, 1)
}

function onCellClick(event) {
  floodColor.value = event.target.style.backgroundColor
  flood()
}

function setStorage() {
  console.log('set storage')
  storage.set('player', player.value)
  storage.set('seed', seed.value)
}

function getRandomSeed() {
  console.log('get random seed')
  let random = `${size.width}x${size.height}_`
  const nbColors = colors.length
  for (let index = 0; index < size.width * size.height; index += 1) random += randomNumber(0, nbColors - 1)
  return random
}

function setSeed(updatedSeed = getRandomSeed()) {
  console.log(`set seed to ${updatedSeed}`)
  const { cells, height, width } = seedFormat.exec(updatedSeed)?.groups ?? {}
  if (width === undefined || height === undefined || cells === undefined) { console.error('seed format seems to be incorrect'); return }
  size.width = Number.parseInt(width, 10)
  size.height = Number.parseInt(height, 10)
  document.location.hash = updatedSeed // put it in url
  seed.value = updatedSeed
  setStorage()
}

function renderGame() {
  console.log('render game')
  gameEnded.value = false
  sameScore.value = false
  scoreSubmitted.value = false
  moves.value = 0
  // delay grid colorize to let dom build cells
  setTimeout(() => { setGrid() }, delay)
}

function restartGame() {
  renderGame()
}

function startGame() {
  console.log('start game')
  setSeed()
  restartGame()
}

function useSeed() {
  // eslint-disable-next-line no-alert
  const input = globalThis.prompt('Please insert the seed you want to play')
  if (input === null || input === '') { console.error('seed is empty, cant use it'); return }
  setSeed(input)
  restartGame()
}


// eslint-disable-next-line max-statements
function getSeedFromUrl() {
  const hashSeed = document.location.hash.slice(1)
  if (hashSeed === '') { console.log('no seed in url'); return }
  const { cells, height, width } = seedFormat.exec(hashSeed)?.groups ?? {}
  if (width === undefined || height === undefined || cells === undefined) { console.error('seed format seems to be incorrect'); return }
  size.width = Number.parseInt(width, 10)
  size.height = Number.parseInt(height, 10)
  let fixedSeed = hashSeed // seed is the whole match "7x7_1234"
  console.log(`detected seed in url : ${fixedSeed}`)
  let seedSize = cells.length
  while (seedSize < (size.width * size.height)) {
    fixedSeed += randomNumber(0, colors.length - 1)
    seedSize += 1
  }
  if (fixedSeed !== hashSeed) console.log('seed in url has been fixed')
  setSeed(fixedSeed)
}

function postForm() { console.log('postForm') }

function readStorage() {
  console.log('read storage')
  player.value = storage.get('player', player.value)
  const storedSeed = storage.get('seed', seed.value || getRandomSeed())
  if (seed.value !== storedSeed) setSeed(storedSeed)
}

console.clear()
getSeedFromUrl()
readStorage()
renderGame()
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-5xl font-bold tracking-tighter text-green-100 drop-shadow-md">
      Flood-it
    </h1>
    <MoveCounter :moves="moves" />
    <GameBoard :size="size" :game-ended="gameEnded" @cell-click="onCellClick" />
    <WinDialog v-if="gameEnded" :moves="moves" :same-score="sameScore" :score-submitted="scoreSubmitted" :ask-player="askPlayer"
      :ask-player-rules="askPlayerRules" :player="player" @post-form="postForm" @set-storage="setStorage" @show-player-rules="askPlayerRules = true"
      @update:player="player = $event" />
    <GameButtons @restart="restartGame" @use-seed="useSeed" @new-game="startGame" />
    <p class="text-xs tracking-tighter opacity-50">
      Game seed : {{ seed }}
    </p>
    <div />
  </div>
</template>
