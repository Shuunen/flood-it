<template>
  <div id="game" :class="gameEnded ? 'game-ended' : ''">
    <h1>{{ title }}</h1>
    <div class="moves">{{ player ? player : "Unknown hero" }} : {{ moves }} moves</div>
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
        <form id="askPlayerForm" @submit.prevent="postScore">
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
      <div v-if="dbEnabled" class="high-scores">
        <strong>High-scores</strong>
        <ol>
          <li v-for="highScore in highScores" v-show="highScore.player" :key="highScore.player + highScore.score">
            {{ highScore.player }} : {{ highScore.score }}
          </li>
        </ol>
        <em v-if="!highScores || highScores.length === 0">No high-scores for this grid yet, do your best !</em>
      </div>
      <div class="menu">
        <button class="btn" @click="restartGame">Restart</button>
        <button class="btn" @click="useSeed">Use seed</button>
        <button class="btn" @click="newGame">New game</button>
      </div>
      <p class="seed">Game seed : {{ seed }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Seed, FetchOptions } from './models'

const SEED_FORMAT = /(\d+)x(\d+)_(\d+)/

export default {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  data: () => ({
    title: 'Flood-it',
    version: '0.2.0',
    baseColor: undefined,
    floodColor: undefined,
    highScores: undefined,
    endpoint: '',
    moves: 0,
    player: '',
    seed: '',
    dbEnabled: false,
    askPlayer: false,
    askPlayerRules: false,
    gameEnded: false,
    sameScore: false,
    scoreSubmitted: false,
    size: {
      x: 7,
      y: 7,
    },
    colors: ['royalblue', 'deeppink', 'chartreuse', 'darkorange'],
  }),
  mounted (): void {
    this.log('app init')
    this.init()
  },
  methods: {
    init (): void {
      this.getSeedFromUrl()
      this.getStorage()
      this.newGame()
    },
    newGame (newSeed): void {
      this.gameEnded = false
      this.sameScore = false
      this.scoreSubmitted = false
      this.moves = 0
      if (newSeed) this.setSeed()
      // delay grid colorize to let dom build cells
      setTimeout(() => this.setGrid(), 200)
      this.getHighScores()
    },
    restartGame (): void {
      this.newGame()
    },
    useSeed (): void {
      const seed = window.prompt('Please insert the seed you want to play')
      this.setSeed(seed)
      this.restartGame()
    },
    log (str): void {
      console.log(str)
    },
    error (str): void {
      console.error(str)
    },
    getSeedFromUrl (): void {
      const hash = document.location.hash
      const matches = hash.match(SEED_FORMAT)
      if (matches && matches.length === 4) {
        this.size.x = Number.parseInt(matches[1])
        this.size.y = Number.parseInt(matches[2])
        let seed = matches[0] // seed is the all match "7x7_1234"
        this.log('detected seed in url : ' + seed)
        let seedSize = matches[3].length
        while (seedSize < (this.size.x * this.size.y)) {
          seed += this.getRandBetween(0, this.colors.length - 1)
          seedSize++
        }
        if (seed !== matches[0]) this.log('seed in url has been fixed')
        this.setSeed(seed, true)
      }
    },
    getSeed (): Seed {
      this.log('getSeed')
      let seed = this.size.x + 'x' + this.size.y + '_'
      const nbColors = this.colors.length
      for (let index = 0; index < this.size.x * this.size.y; index++) seed += this.getRandBetween(0, nbColors - 1)
      return seed
    },
    setSeed (seed, avoidSetStorage): void {
      this.log('setSeed')
      this.seed = seed || this.getSeed() // use or create a new seed
      const matches = this.seed.match(SEED_FORMAT) // update size
      if (!matches || matches.length !== 4) return this.error('seed format seems to be incorrect')
      this.size.x = Number.parseInt(matches[1])
      this.size.y = Number.parseInt(matches[2])
      if (!avoidSetStorage) this.setStorage() // keep it in storage
      document.location.hash = this.seed // put it in url
    },
    firstCap (str): string {
      str = (str + '')
      str = str.toLowerCase()
      str = str[0].toUpperCase() + str.slice(1)
      return str
    },
    getRandBetween (min, max): number {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    getOneIn (array): void {
      const pos = this.getRandBetween(0, array.length - 1)
      return array[pos]
    },
    setGrid (): void {
      // this.seed = '7x7_3200013120203221020122022130221111223000303132131'
      // seed = '3200013120203221020122022130221111223000303132131'
      let seed = this.seed.split('_')[1]
      for (let yi = 1; yi <= this.size.y; yi++)
        for (let xi = 1; xi <= this.size.x; xi++) {
          const index = seed[0]
          let color = 'red'
          if (index !== undefined && this.colors[index]) color = this.colors[index]
          else this.error('incomplete seed') // we reach end of seed & i is undefined, we should have a complete seed before coming here
          // seed = '200013120203221020122022130221111223000303132131'
          seed = seed.slice(1)
          this.colorCell(xi, yi, color)
        }
    },
    getHighScores (): void {
      if (!this.dbEnabled) return
      this.db('get', '/scores?seed=' + this.seed + '&_sort=score&_order=ASC&_limit=15').then((highScores) => this.setHighScores(highScores))
    },
    setHighScores (highScores): void {
      let lastPlayer
      let lastScore
      let nbScores = 1
      const nbScoresMax = 5
      highScores.forEach((highScore, index) => {
        if (nbScores > nbScoresMax) {
          highScore.player = undefined
          return
        }
        if (lastScore === highScore.score) {
          let lastIndex = index - 1
          while (highScores[lastIndex].player === null) lastIndex--
          if (!lastPlayer || !lastPlayer.includes(highScore.player)) lastPlayer = highScores[lastIndex].player = highScores[lastIndex].player + ', ' + highScore.player
          highScore.player = undefined
          nbScores--
        }
        lastScore = highScore.score
        nbScores++
      })
      this.highScores = highScores
    },
    postScore (): void {
      if (!this.dbEnabled) return
      this.db('get', '/scores?player=' + this.player + '&score=' + this.moves + '&seed=' + this.seed).then((sameScore) => {
        // check if player / score / seed combo does not already exists
        this.sameScore = (sameScore.length > 0)
        // if this combo does not exists, push it to db
        if (!this.sameScore) {
          this.db('post', '/scores', {
            player: this.player,
            score: this.moves,
            seed: this.seed,
          })
          this.scoreSubmitted = true
          // delay score refresh to let db changes appears
          setTimeout(() => this.getHighScores(), 500)
        }
      })
    },
    setStorage (): void {
      this.log('setStorage')
      localStorage.floodIt = JSON.stringify({
        player: this.player,
        seed: this.seed,
      })
    },
    getStorage (): void {
      this.log('getStorage')
      try {
        const data = JSON.parse(localStorage.floodIt)
        this.player = data.player
        // if this.seed is empty, take the one in storage
        if (this.seed === '') this.setSeed(data.seed, true)
      } catch {
        this.setSeed()
      }
    },
    getCell (x, y, noWarn): Element | undefined {
      const cell = document.querySelector(`#cell-${x}${y}`)
      if (!cell) {
        if (!noWarn) this.error('no cell found on pos x/y : ' + x + '/' + y)
        return
      }
      return cell
    },
    getCellColor (x, y): string {
      const cell = this.getCell(x, y)
      return cell.style.backgroundColor
    },
    colorCell (x, y, color): void {
      const cell = this.getCell(x, y)
      cell.style.backgroundColor = color
    },
    onCellClick (event): void {
      this.floodColor = event.target.style.backgroundColor
      this.flood()
    },
    flood (): void {
      this.baseColor = this.getCellColor(1, 1)
      // if asked color is the same as base color
      if (this.baseColor === this.floodColor) return
      this.log(`base is "${this.baseColor}" & user asked to flood with "${this.floodColor}"`)
      this.moves++
      this.floodCell(1, 1)
    },
    floodCell (x, y): void {
      const cell = this.getCell(x, y, true)
      if (!cell) return
      if (cell.style.backgroundColor === this.baseColor) {
        cell.style.backgroundColor = this.floodColor
        this.floodCell(x - 1, y)
        this.floodCell(x + 1, y)
        this.floodCell(x, y - 1)
        this.floodCell(x, y + 1)
        this.checkEnd()
      }
    },
    checkEnd (): void {
      // avoid multiple sync calls when game is ended
      if (this.gameEnded) return
      setTimeout(() => {
        // avoid multiple async calls when game is ended
        if (this.gameEnded) return
        let gameEnded = true
        for (let yi = 1; yi <= this.size.y; yi++) {
          for (let xi = 1; xi <= this.size.x; xi++) {
            // avoid parsing further cols when game is ended
            if (gameEnded === false) break
            const color = this.getCellColor(xi, yi)
            if (this.floodColor !== color) gameEnded = false
          }
          // avoid parsing further rows when game is ended
          if (gameEnded === false) break
        }
        if (gameEnded) this.onGameEnded()
      }, 200)
    },
    onGameEnded (): void {
      this.log('game ended')
      this.gameEnded = true
      /* TODO : check if player beat high score
      if (this.best === 0 || this.best > this.moves) {
          // if best has not been set yet
          // or
          // if best is worst than actual moves
          this.best = this.moves;
      }
      */
      if (!this.dbEnabled) return
      if (this.player.length > 0) this.postScore()
      else this.askPlayer = true
    },
    db (method, url, payload): Promise<unknown> {
      const options: FetchOptions = {
        method: method,
      }
      if (payload) {
        options.body = JSON.stringify(payload)
        options.headers = {
          'Content-Type': 'application/json',
        }
      }
      return fetch(this.endpoint + url, options).then(response => response.json())
    },
  },
}
</script>

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
