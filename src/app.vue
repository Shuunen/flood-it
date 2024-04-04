<script setup lang="ts">
import { getRandomNumber, storage } from 'shuutils'
import { ref } from 'vue'

storage.prefix = 'flood-it_'
// eslint-disable-next-line regexp/no-super-linear-move
const seedFormat = /(?<width>\d+)x(?<height>\d+)_(?<cells>\d+)/u
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
const size = { width: 7, height: 7 }
const colors = ['royalblue', 'deeppink', 'chartreuse', 'darkorange']
const delay = 200

function getCell (positionX: number, positionY: number, willWarn = false) {
  const cell = document.querySelector<HTMLElement>(`#cell-${positionX}${positionY}`)
  if (!cell) {
    if (willWarn) console.error(`no cell found on pos x/y : ${positionX}/${positionY}`)
    return
  }
  // eslint-disable-next-line @typescript-eslint/consistent-return
  return cell
}

function colorCell (positionX: number, positionY: number, color: string) {
  const cell = getCell(positionX, positionY)
  if (!cell) { console.error(`no cell found on pos x/y : ${positionX}/${positionY}`); return }
  cell.style.backgroundColor = color
}

function setGrid () {
  // ex : '7x7_3200013120203221020122022130221111223000303132131'
  // size = '7x7'
  // content = '3200013120203221020122022130221111223000303132131'
  let [, content] = seed.value.split('_')
  if (content === undefined) { console.error('failed to get seed content'); return }
  for (let yi = 1; yi <= size.height; yi += 1)
    for (let xi = 1; xi <= size.width; xi += 1) { // eslint-disable-line sonar/no-redundant-assignments
      const index = Number.parseInt(content.at(0) ?? '', 10)
      // content = '200013120203221020122022130221111223000303132131'
      content = content.slice(1)
      colorCell(xi, yi, colors[index] ?? 'red')
    }
}

function getCellColor (positionX: number, positionY: number): string {
  const cell = getCell(positionX, positionY)
  if (!cell) {
    console.error(`no cell found on pos x/y : ${positionX}/${positionY}`)
    return ''
  }
  return cell.style.backgroundColor
}

function onGameEnded () {
  console.log('game ended')
  gameEnded.value = true
}

function checkEnd () {
  // avoid multiple sync calls when game is ended
  if (gameEnded.value) return
  // eslint-disable-next-line sonarjs/cognitive-complexity
  setTimeout(() => {
    // avoid multiple async calls when game is ended
    if (gameEnded.value) return
    let isEnd = true
    for (let yi = 1; yi <= size.height; yi += 1) {
      for (let xi = 1; xi <= size.width; xi += 1) { // eslint-disable-line sonar/no-redundant-assignments
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

function floodCell (positionX: number, positionY: number) {
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

function flood () {
  baseColor.value = getCellColor(1, 1)
  // if asked color is the same as base color
  if (baseColor.value === floodColor.value) return
  console.log(`base is "${baseColor.value}" & user asked to flood with "${floodColor.value}"`)
  moves.value += 1
  floodCell(1, 1)
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
function onCellClick (event: MouseEvent) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  floodColor.value = (event.target as HTMLElement).style.backgroundColor
  flood()
}

function setStorage () {
  console.log('set storage')
  storage.set('player', player.value)
  storage.set('seed', seed.value)
}

function getRandomSeed (): string {
  console.log('get random seed')
  let random = `${size.width}x${size.height}_`
  const nbColors = colors.length
  for (let index = 0; index < size.width * size.height; index += 1) random += getRandomNumber(0, nbColors - 1)
  return random
}

function setSeed (updatedSeed = getRandomSeed()): void {
  console.log(`set seed to ${updatedSeed}`)
  const { width, height, cells } = seedFormat.exec(updatedSeed)?.groups ?? {}
  if (width === undefined || height === undefined || cells === undefined) { console.error('seed format seems to be incorrect'); return }
  size.width = Number.parseInt(width, 10)
  size.height = Number.parseInt(height, 10)
  document.location.hash = updatedSeed // put it in url
  seed.value = updatedSeed
  setStorage()
}

function renderGame () {
  console.log('render game')
  gameEnded.value = false
  sameScore.value = false
  scoreSubmitted.value = false
  moves.value = 0
  // delay grid colorize to let dom build cells
  setTimeout(() => { setGrid() }, delay)
}

function restartGame () {
  renderGame()
}

function startGame () {
  console.log('start game')
  setSeed()
  restartGame()
}

function useSeed () {
  // eslint-disable-next-line no-alert
  const input = window.prompt('Please insert the seed you want to play')
  if (input === null || input === '') { console.error('seed is empty, cant use it'); return }
  setSeed(input)
  restartGame()
}

// eslint-disable-next-line max-statements
function getSeedFromUrl () {
  const hashSeed = document.location.hash.slice(1)
  if (hashSeed === '') { console.log('no seed in url'); return }
  const { width, height, cells } = seedFormat.exec(hashSeed)?.groups ?? {}
  if (width === undefined || height === undefined || cells === undefined) { console.error('seed format seems to be incorrect'); return }
  size.width = Number.parseInt(width, 10)
  size.height = Number.parseInt(height, 10)
  let fixedSeed = hashSeed // seed is the whole match "7x7_1234"
  console.log(`detected seed in url : ${fixedSeed}`)
  let seedSize = cells.length
  while (seedSize < (size.width * size.height)) {
    fixedSeed += getRandomNumber(0, colors.length - 1)
    seedSize += 1
  }
  if (fixedSeed !== hashSeed) console.log('seed in url has been fixed')
  setSeed(fixedSeed)
}

function postForm () { console.log('postForm') }

function readStorage () {
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
  <div id="game" :class="gameEnded ? 'game-ended' : ''">
    <h1>Flood-it</h1>
    <div class="moves">{{ player }} : {{ moves }} moves</div>
    <div class="grid">
      <div v-for="yi in size.height" :key="yi" class="row">
        <div v-for="xi in size.width" :id="`cell-${xi}${yi}`" :key="xi" class="cell" @click="onCellClick">{{ xi }} / {{ yi }}</div>
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
          <label for="name">
            Hero name :
            <input id="name" v-model="player" maxlength="10" minlength="3" placeholder="hero name" type="text" @focus="askPlayerRules = true" />
          </label>
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
        <button class="btn" type="button" @click="restartGame">Restart</button>
        <button class="btn" type="button" @click="useSeed">Use seed</button>
        <button class="btn" type="button" @click="startGame">New game</button>
      </div>
      <p class="seed">Game seed : {{ seed }}</p>
    </div>
  </div>
</template>

<style scoped>
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

.footer {
  color: wheat;
  font-size: 10px;
  margin-top: auto;
  padding: 15px;
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
