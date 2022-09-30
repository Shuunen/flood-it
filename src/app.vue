<script setup lang="ts">
import { getRandomNumber, storage } from 'shuutils'
import { ref } from 'vue'

storage.prefix = 'flood-it_'

const SEED_FORMAT = /(\d+)x(\d+)_(\d+)/
const baseColor = ref('')
const floodColor = ref('')
const moves = ref(0)
const player = ref('Unknown hero')
const seed = ref('')
const askPlayer = ref(false)
const askPlayerRules = ref(false)
const gameEnded = ref(false)
const sameScore = ref(false)
const scoreSubmitted = ref(false)
const size = { x: 7, y: 7 }
const colors = ['royalblue', 'deeppink', 'chartreuse', 'darkorange']

const setGrid = (): void => {
  // ex : '7x7_3200013120203221020122022130221111223000303132131'
  // size = '7x7'
  // content = '3200013120203221020122022130221111223000303132131'
  let [, content] = seed.value.split('_')
  if (!content) return console.error('failed to get seed content')
  for (let yi = 1; yi <= size.y; yi++)
    for (let xi = 1; xi <= size.x; xi++) {
      if (!content[0]) continue
      const index = Number.parseInt(content[0])
      // content = '200013120203221020122022130221111223000303132131'
      content = content.slice(1)
      colorCell(xi, yi, colors[index] ?? 'red')
    }
}

const onCellClick = (event: MouseEvent): void => {
  floodColor.value = (event.target as HTMLElement)?.style.backgroundColor
  flood()
}

const getCell = (x: number, y: number, noWarn = false): HTMLElement | undefined => {
  const cell = document.querySelector(`#cell-${x}${y}`)
  if (!cell) {
    if (!noWarn) console.error('no cell found on pos x/y : ' + x + '/' + y)
    return
  }
  return cell as HTMLElement
}

const getCellColor = (x: number, y: number): string => {
  const cell = getCell(x, y)
  if (!cell) {
    console.error('no cell found on pos x/y : ' + x + '/' + y)
    return ''
  }
  return cell.style.backgroundColor
}

const colorCell = (x: number, y: number, color: string): void => {
  const cell = getCell(x, y)
  if (!cell) return console.error('no cell found on pos x/y : ' + x + '/' + y)
  cell.style.backgroundColor = color
}

const flood = (): void => {
  baseColor.value = getCellColor(1, 1)
  // if asked color is the same as base color
  if (baseColor.value === floodColor.value) return
  console.log(`base is "${baseColor.value}" & user asked to flood with "${floodColor.value}"`)
  moves.value++
  floodCell(1, 1)
}

const floodCell = (x: number, y: number): void => {
  const cell = getCell(x, y, true)
  if (!cell) return
  if (cell.style.backgroundColor === baseColor.value) {
    cell.style.backgroundColor = floodColor.value
    floodCell(x - 1, y)
    floodCell(x + 1, y)
    floodCell(x, y - 1)
    floodCell(x, y + 1)
    checkEnd()
  }
}

const checkEnd = (): void => {
  // avoid multiple sync calls when game is ended
  if (gameEnded.value) return
  setTimeout(() => {
    // avoid multiple async calls when game is ended
    if (gameEnded.value) return
    let end = true
    for (let yi = 1; yi <= size.y; yi++) {
      for (let xi = 1; xi <= size.x; xi++) {
        // avoid parsing further cols when game is ended
        if (end === false) break
        const color = getCellColor(xi, yi)
        if (floodColor.value !== color) end = false
      }
      // avoid parsing further rows when game is ended
      if (end === false) break
    }
    if (end) onGameEnded()
  }, 200)
}

const onGameEnded = (): void => {
  console.log('game ended')
  gameEnded.value = true
}

const renderGame = (): void => {
  console.log('render game')
  gameEnded.value = false
  sameScore.value = false
  scoreSubmitted.value = false
  moves.value = 0
  // delay grid colorize to let dom build cells
  setTimeout(() => setGrid(), 200)
}

const newGame = (): void => {
  setSeed()
  restartGame()
}

const restartGame = (): void => {
  renderGame()
}

const useSeed = (): void => {
  const input = window.prompt('Please insert the seed you want to play')
  if (!input) return console.error('seed is empty, cant use it')
  setSeed(input)
  restartGame()
}

const getSeedFromUrl = (): void => {
  const hash = document.location.hash
  const matches = hash.match(SEED_FORMAT)
  if (!matches || matches.length !== 4 || !matches[0] || !matches[1] || !matches[2] || !matches[3]) return console.error('seed format seems to be incorrect')
  size.x = Number.parseInt(matches[1])
  size.y = Number.parseInt(matches[2])
  let match = matches[0] // seed is the all match "7x7_1234"
  console.log('detected seed in url : ' + match)
  let seedSize = matches[3].length
  while (seedSize < (size.x * size.y)) {
    match += getRandomNumber(0, colors.length - 1)
    seedSize++
  }
  if (match !== matches[0]) console.log('seed in url has been fixed')
  setSeed(match)
}

const getRandomSeed = (): string => {
  console.log('get random seed')
  let random = size.x + 'x' + size.y + '_'
  const nbColors = colors.length
  for (let index = 0; index < size.x * size.y; index++) random += getRandomNumber(0, nbColors - 1)
  return random
}

const setSeed = (newSeed = getRandomSeed()): void => {
  console.log('set seed to ' + newSeed)
  const matches = newSeed.match(SEED_FORMAT) // update size
  if (!matches || matches.length !== 4 || !matches[1] || !matches[2]) return console.error('seed format seems to be incorrect')
  size.x = Number.parseInt(matches[1])
  size.y = Number.parseInt(matches[2])
  document.location.hash = newSeed // put it in url
  seed.value = newSeed
  setStorage()
}

const setStorage = (): void => {
  console.log('set storage')
  storage.set('player', player.value)
  storage.set('seed', seed.value)
}

const postForm = (): void => console.log('postForm')

const readStorage = (): void => {
  console.log('read storage')
  player.value = storage.get('player', player.value)
  if (seed.value) return
  seed.value = storage.get('seed', seed.value)
  if (seed.value) setSeed(seed.value)
}

getSeedFromUrl()
readStorage()
renderGame()
</script>

<template>
  <div id="game" :class="gameEnded ? 'game-ended' : ''">
    <h1>Flood-it</h1>
    <div class="moves">{{ player }} : {{ moves }} moves</div>
    <div class="grid">
      <div v-for="yi in size.y" :key="yi" class="row">
        <div v-for="xi in size.x" :id="'cell-' + xi + '' + yi" :key="xi" class="cell" @click="onCellClick">{{ xi }} / {{ yi }}</div>
      </div>
    </div>
    <div v-show="gameEnded">
      <br />
      <h3>You win in {{ moves }} moves {{ sameScore ? "again " : "" }} !</h3>
      <small v-show="scoreSubmitted">Score has been submitted.</small>
      <div v-show="askPlayer && !scoreSubmitted">
        <p>
          You want to be in the high-scores ?
          <br />What's your name ?
        </p>
        <form id="askPlayerForm" @submit.prevent="postForm">
          <input v-model="player" type="text" placeholder="hero name" minlength="3" maxlength="10" @focus="askPlayerRules = true" />
          <input type="submit" value="Send !" @click="setStorage" />
          <ul v-show="askPlayerRules" class="rules">
            <li v-show="!player || player.length === 0">Name cannot be empty.</li>
            <li v-show="player.length < 3 || player.length > 10">Name should be between 3 & 10 characters long.</li>
          </ul>
        </form>
      </div>
    </div>
    <div class="footer">
      <div class="menu">
        <button class="btn" @click="restartGame">Restart</button>
        <button class="btn" @click="useSeed">Use seed</button>
        <button class="btn" @click="newGame">New game</button>
      </div>
      <p class="seed">Game seed : {{ seed }}</p>
    </div>
  </div>
</template>

<style>
html * {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
}

body {
  background-color: darkslategrey;
  color: snow;
  font-family: monospace;
  font-size: 16px;
  margin: 0;
  padding-top: 2vw;
  text-align: center;
}

.menu {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

#game {
  display: flex;
  flex-direction: column;
  height: 100%;
}

h1 {
  font-size: 30px;
  letter-spacing: -4px;
  margin: 2vw 0;
}

h3 {
  font-size: 20px;
}

.btn {
  background: none;
  border: 1px solid;
  border-radius: 3px;
  color: inherit;
  cursor: pointer;
  font-size: 20px;
  margin-bottom: 6px;
  opacity: .6;
  padding: 6px 12px;
  text-decoration: none;
  transition: .3s opacity;
}

.btn:hover {
  opacity: 1;
}

.grid {
  align-items: center;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  margin-top: 4vw;
}

.row {
  display: flex;
}

.cell {
  color: gray;
  cursor: pointer;
  font-size: 0;
  height: 14vw;
  line-height: 50px;
  max-height: 50px;
  max-width: 50px;
  opacity: 1;
  transition: .3s background-color, .3s opacity;
  width: 14vw;
}

.cell:hover {
  opacity: .8;
}

.game-ended .cell {
  animation: win 1s linear infinite;
  animation-direction: alternate;
}

@keyframes win {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(.9);
  }

  100% {
    transform: scale(1) rotate(90deg);
  }
}

.header {
  display: flex;
  height: 12vw;
  justify-content: space-around;
  max-height: 50px;
}

.footer {
  color: wheat;
  font-size: 10px;
  margin-top: auto;
  padding: 15px;
}

.high-scores {
  display: flex;
  flex-direction: column;
  font-size: 15px;
  line-height: 25px;
  margin-bottom: 20px;
}

.high-scores strong {
  font-size: 20px;
  letter-spacing: -1px;
  margin-bottom: 12px;
  padding-bottom: 11px;
  position: relative;
  text-transform: uppercase;
}

.high-scores strong::before,
.high-scores strong::after {
  background-color: currentColor;
  bottom: 0;
  content: "";
  display: block;
  height: 2px;
  left: calc(50% - 10px);
  position: absolute;
  transform: rotate(30deg);
  width: 20px;
}

.high-scores strong::after {
  transform: rotate(-30deg);
}

.high-scores ol {
  margin: auto;
  padding-left: 28px;
  text-align: left;
}

#askPlayerForm .rules {
  color: darkseagreen;
  padding: 0;
  width: 100%;
}

#askPlayerForm .rules li {
  list-style: none;
}

input {
  border: none;
  border-radius: 3px;
  padding: 8px 12px;
}

input[type="submit"] {
  cursor: pointer;
}

.seed {
  word-break: break-word;
}
</style>
