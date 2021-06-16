<template>
  <div id="game" :class="gameEnded ? 'game-ended' : ''">
    <h1>{{ title }}</h1>
    <div class="moves">{{ player ? player : "Unknown hero" }} : {{ moves }} moves</div>
    <div class="grid">
      <div v-for="yi in size.y" :key="yi" class="row">
        <div v-for="xi in size.x" :id="xi + '' + yi" :key="xi" class="cell" @click="onCellClick">{{ xi }} / {{ yi }}</div>
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
            <li v-show="!player || !player.length">Name cannot be empty.</li>
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
        <em v-if="!highScores || !highScores.length">No high-scores for this grid yet, do your best !</em>
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

<script>
export default {
  data: function() {
    return {
      title: 'Flood-it',
      version: '0.2.0',
      baseColor: null,
      floodColor: null,
      highScores: null,
      endpoint: '',
      moves: 0,
      player: '',
      seed: '',
      seedFormat: /(\d+)x(\d+)_(\d+)/,
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
    }
  },
  mounted () {
    this.log('app init')
    this.init()
  },
  methods: {
    init: function() {
      this.getSeedFromUrl()
      this.getStorage()
      this.newGame()
    },
    newGame: function(newSeed) {
      this.gameEnded = false
      this.sameScore = false
      this.scoreSubmitted = false
      this.moves = 0
      if (newSeed) {
        this.setSeed()
      }
      // delay grid colorize to let dom build cells
      setTimeout(() => this.setGrid(), 200)
      this.getHighScores()
    },
    restartGame: function() {
      this.newGame()
    },
    useSeed: function() {
      var seed = window.prompt('Please insert the seed you want to play')
      this.setSeed(seed)
      this.restartGame()
    },
    log (str) {
      console.log(str)
    },
    error (str) {
      console.error(str)
    },
    getSeedFromUrl: function() {
      var hash = document.location.hash
      var matches = hash.match(this.seedFormat)
      if (matches && matches.length === 4) {
        this.size.x = parseInt(matches[1])
        this.size.y = parseInt(matches[2])
        var seed = matches[0] // seed is the all match "7x7_1234"
        this.log('detected seed in url : ' + seed)
        var seedSize = matches[3].length
        while (seedSize < (this.size.x * this.size.y)) {
          seed += this.getRandBetween(0, this.colors.length - 1)
          seedSize++
        }
        if (seed !== matches[0]) {
          this.log('seed in url has been fixed')
        }
        this.setSeed(seed, true)
      }
    },
    getSeed: function() {
      this.log('getSeed')
      var seed = this.size.x + 'x' + this.size.y + '_'
      var nbColors = this.colors.length
      for (var i = 0; i < this.size.x * this.size.y; i++) {
        seed += this.getRandBetween(0, nbColors - 1)
      }
      return seed
    },
    setSeed: function(seed, avoidSetStorage) {
      this.log('setSeed')
      // use or create a new seed
      this.seed = seed || this.getSeed()
      // update size
      var matches = this.seed.match(this.seedFormat)
      if (matches && matches.length === 4) {
        this.size.x = parseInt(matches[1])
        this.size.y = parseInt(matches[2])
      } else {
        this.error('seed format seems to be incorrect')
      }
      if (!avoidSetStorage) {
        // keep it in storage
        this.setStorage()
      }
      // put it in url
      document.location.hash = this.seed
    },
    firstCap: function(str) {
      str = (str + '')
      str = str.toLowerCase()
      str = str[0].toUpperCase() + str.slice(1)
      return str
    },
    getRandBetween: function(min, max) {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    getOneIn: function(arr) {
      var pos = this.getRandBetween(0, arr.length - 1)
      return arr[pos]
    },
    setGrid: function() {
      // this.seed = '7x7_3200013120203221020122022130221111223000303132131'
      // seed = '3200013120203221020122022130221111223000303132131'
      var seed = this.seed.split('_')[1]
      for (var yi = 1; yi <= this.size.y; yi++) {
        for (var xi = 1; xi <= this.size.x; xi++) {
          var i = seed[0]
          var color = 'red'
          if (i !== undefined && this.colors[i]) {
            color = this.colors[i]
          } else {
            // we reach end of seed & i is undefined, we should have a complete seed before coming here
            this.error('incomplete seed')
          }
          // seed = '200013120203221020122022130221111223000303132131'
          seed = seed.substr(1)
          this.colorCell(xi, yi, color)
        }
      }
    },
    getHighScores: function() {
      if (!this.dbEnabled) {
        return
      }
      this.db('get', '/scores?seed=' + this.seed + '&_sort=score&_order=ASC&_limit=15').then((highScores) => this.setHighScores(highScores))
    },
    setHighScores: function(highScores) {
      var lastPlayer
      var lastScore
      var nbScores = 1
      var nbScoresMax = 5
      highScores.forEach((highScore, index) => {
        if (nbScores > nbScoresMax) {
          highScore.player = null
          return
        }
        if (lastScore === highScore.score) {
          var lastIndex = index - 1
          while (highScores[lastIndex].player === null) { lastIndex-- }
          if (!lastPlayer || lastPlayer.indexOf(highScore.player) === -1) {
            lastPlayer = highScores[lastIndex].player = highScores[lastIndex].player + ', ' + highScore.player
          }
          highScore.player = null
          nbScores--
        }
        lastScore = highScore.score
        nbScores++
      })
      this.highScores = highScores
    },
    postScore: function() {
      if (!this.dbEnabled) {
        return
      }
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
    setStorage: function() {
      this.log('setStorage')
      localStorage.floodIt = JSON.stringify({
        player: this.player,
        seed: this.seed,
      })
    },
    getStorage: function() {
      this.log('getStorage')
      try {
        var data = JSON.parse(localStorage.floodIt)
        this.player = data.player
        // if this.seed is empty, take the one in storage
        if (this.seed === '') {
          this.setSeed(data.seed, true)
        }
      } catch (error) {
        this.setSeed()
      }
    },
    getCell: function(x, y, noWarn) {
      var cell = document.getElementById(x + '' + y)
      if (!cell) {
        if (!noWarn) {
          this.error('no cell found on pos x/y : ' + x + '/' + y)
        }
        return
      }
      return cell
    },
    getCellColor: function(x, y) {
      var cell = this.getCell(x, y)
      return cell.style.backgroundColor
    },
    colorCell: function(x, y, color) {
      var cell = this.getCell(x, y)
      cell.style.backgroundColor = color
    },
    onCellClick: function(event) {
      this.floodColor = event.target.style.backgroundColor
      this.flood()
    },
    flood: function() {
      this.baseColor = this.getCellColor(1, 1)
      if (this.baseColor === this.floodColor) {
        // if asked color is the same as base color
        return
      }
      this.log(`base is "${this.baseColor}" & user asked to flood with "${this.floodColor}"`)
      this.moves++
      this.floodCell(1, 1)
    },
    floodCell: function(x, y) {
      var cell = this.getCell(x, y, true)
      if (!cell) {
        return
      }
      if (cell.style.backgroundColor === this.baseColor) {
        cell.style.backgroundColor = this.floodColor
        this.floodCell(x - 1, y)
        this.floodCell(x + 1, y)
        this.floodCell(x, y - 1)
        this.floodCell(x, y + 1)
        this.checkEnd()
      }
    },
    checkEnd: function() {
      if (this.gameEnded) {
        // avoid multiple sync calls when game is ended
        return
      }
      setTimeout(() => {
        if (this.gameEnded) {
          // avoid multiple async calls when game is ended
          return
        }
        var gameEnded = true
        for (var yi = 1; yi <= this.size.y; yi++) {
          for (var xi = 1; xi <= this.size.x; xi++) {
            if (gameEnded === false) {
              // avoid parsing further cols when game is ended
              break
            }
            var color = this.getCellColor(xi, yi)
            if (this.floodColor !== color) {
              gameEnded = false
            }
          }
          if (gameEnded === false) {
            // avoid parsing further rows when game is ended
            break
          }
        }
        if (gameEnded) {
          this.onGameEnded()
        }
      }, 200)
    },
    onGameEnded: function() {
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
      if (!this.dbEnabled) {
        return
      }
      if (this.player.length) {
        this.postScore()
      } else {
        this.askPlayer = true
      }
    },
    db: function(method, url, payload) {
      var options = {
        method: method,
      }
      if (payload) {
        options.body = JSON.stringify(payload)
        options.headers = {
          'Content-Type': 'application/json',
        }
      }
      return fetch(this.endpoint + url, options).then((res) => res.json())
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
