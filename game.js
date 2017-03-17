
new Vue({
    el: '#game',
    data: {
        title: 'Flood-it',
        version: '0.2.0',
        baseColor: null,
        floodColor: null,
        highscores: null,
        endpoint: 'http://168.235.70.9:8080',
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
            y: 7
        },
        colors: ['royalblue', 'deeppink', 'chartreuse', 'darkorange']
    },
    methods: {
        init: function () {
            this.dbEnabled = (document.location.protocol.indexOf('https') === -1);
            this.getSeedFromUrl();
            this.getStorage();
            this.newGame();
        },
        newGame: function (newSeed) {
            this.gameEnded = false;
            this.sameScore = false;
            this.scoreSubmitted = false;
            this.moves = 0;
            if (newSeed) {
                this.setSeed();
            }
            // delay grid colorize to let dom build cells
            setTimeout(() => this.setGrid(), 200);
            this.getScores();
        },
        restartGame: function () {
            this.newGame();
        },
        useSeed: function () {
            var seed = window.prompt('Please insert the seed you want to play');
            this.setSeed(seed);
            this.restartGame();
        },
        getSeedFromUrl: function () {
            var hash = document.location.hash;
            var matches = hash.match(/(\d+)x(\d+)_(\d+)/);
            if (matches && matches.length === 4) {
                this.size.x = parseInt(matches[1]);
                this.size.y = parseInt(matches[2]);
                var seed = matches[0]; // seed is the all match "7x7_1234"
                console.log('detected seed in url : "' + seed + '"');
                var seedSize = matches[3].length;
                while (seedSize < (this.size.x * this.size.y)) {
                    seed += this.getRandBetween(0, this.colors.length - 1);
                    seedSize++;
                }
                if (seed !== matches[0]) {
                    console.info('seed in url has been fixed');
                }
                this.setSeed(seed, true);
            }
        },
        getSeed: function () {
            console.log('getSeed');
            var seed = this.size.x + 'x' + this.size.y + '_';
            var nbColors = this.colors.length;
            for (var i = 0; i < this.size.x * this.size.y; i++) {
                seed += this.getRandBetween(0, nbColors - 1);
            }
            return seed;
        },
        setSeed: function (seed, avoidSetStorage) {
            console.log('setSeed');
            // create a new seed
            this.seed = seed || this.getSeed();
            if (!avoidSetStorage) {
                // keep it in storage
                this.setStorage();
            }
            // put it in url
            document.location.hash = this.seed;
        },
        firstCap: function (str) {
            str = (str + '');
            str = str.toLowerCase();
            str = str[0].toUpperCase() + str.slice(1);
            return str;
        },
        getRandBetween: function (min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        getOneIn: function (arr) {
            var pos = this.getRandBetween(0, arr.length - 1);
            // console.log('rand pos : ' + pos + ' on ' + arr.length);
            return arr[pos];
        },
        setGrid: function () {
            // this.seed = '7x7_3200013120203221020122022130221111223000303132131'
            // seed = '3200013120203221020122022130221111223000303132131'
            var seed = this.seed.split('_')[1];
            console.log('color the ' + this.size.x + 'x' + this.size.y + ' grid');
            for (var yi = 1; yi <= this.size.y; yi++) {
                for (var xi = 1; xi <= this.size.x; xi++) {
                    var color;
                    var i = seed[0];
                    if (i !== undefined) {
                        // i = 3
                        // color = 'darkorange' if colors is ['royalblue', 'deeppink', 'chartreuse', 'darkorange']
                        color = this.colors[i];
                    } else {
                        // we reach end of seed & i is undefined, we should have a complete seed before coming here
                        console.error('incomplete seed');
                    }

                    // seed = '200013120203221020122022130221111223000303132131'
                    seed = seed.substr(1);
                    this.colorCell(xi, yi, color);
                }
            }
        },
        getScores: function () {
            if (!this.dbEnabled) {
                return;
            }
            this.db('get', '/scores?seed=' + this.seed + '&_sort=score&_order=ASC&_limit=5').then((highscores) => {
                var lastScore;
                for (var i in highscores) {
                    if (lastScore === highscores[i].score) {
                        highscores[i - 1].player += ', ' + highscores[i].player;
                        highscores[i].player = null;
                    }
                    lastScore = highscores[i].score;
                }
                this.highscores = highscores;
            });
        },
        postScore: function () {
            if (!this.dbEnabled) {
                return;
            }
            this.db('get', '/scores?player=' + this.player + '&score=' + this.moves + '&seed=' + this.seed).then((sameScore) => {
                // check if player / score / seed combo does not already exists
                this.sameScore = (sameScore.length > 0);
                // if this combo does not exists, push it to db
                if (!this.sameScore) {
                    this.db('post', '/scores', { player: this.player, score: this.moves, seed: this.seed });
                    this.scoreSubmitted = true;
                    // delay score refresh to let db changes appears
                    setTimeout(() => this.getScores(), 500);
                }
            });
        },
        setStorage: function () {
            console.log('setStorage');
            localStorage.floodIt = JSON.stringify({
                player: this.player,
                seed: this.seed
            });
        },
        getStorage: function () {
            console.log('getStorage');
            try {
                var data = JSON.parse(localStorage.floodIt);
                this.player = data.player;
                // if this.seed is empty, take the one in storage
                if (this.seed === '') {
                    this.setSeed(data.seed, true);
                }
            } catch (error) {
                this.setSeed();
            }
        },
        getCell: function (x, y, noWarn) {
            var cell = document.getElementById(x + '' + y);
            if (!cell) {
                if (!noWarn) {
                    console.error('no cell found on pos x/y : ' + x + '/' + y);
                }
                return;
            }
            return cell;
        },
        getCellColor: function (x, y) {
            var cell = this.getCell(x, y);
            return cell.style.backgroundColor;
        },
        colorCell: function (x, y, color) {
            var cell = this.getCell(x, y);
            cell.style.backgroundColor = color;
        },
        onCellClick: function (event) {
            this.floodColor = event.target.style.backgroundColor;
            this.flood();
        },
        flood: function () {
            this.baseColor = this.getCellColor(1, 1);
            if (this.baseColor === this.floodColor) {
                // if asked color is the same as base color
                return;
            }
            console.log('base is "' + this.baseColor + '" & user asked to flood with "' + this.floodColor + '"');
            this.moves++;
            this.floodCell(1, 1);
        },
        floodCell: function (x, y) {
            var cell = this.getCell(x, y, true);
            if (!cell) {
                return;
            }
            if (cell.style.backgroundColor === this.baseColor) {
                // console.info('flooded');
                cell.style.backgroundColor = this.floodColor;
                this.floodCell(x - 1, y);
                this.floodCell(x + 1, y);
                this.floodCell(x, y - 1);
                this.floodCell(x, y + 1);
                this.checkEnd();
            }
        },
        checkEnd: function () {
            if (this.gameEnded) {
                // avoid multiple sync calls when game is ended
                return;
            }
            setTimeout(() => {
                if (this.gameEnded) {
                    // avoid multiple async calls when game is ended
                    return;
                }
                var gameEnded = true;
                for (var yi = 1; yi <= this.size.y; yi++) {
                    for (var xi = 1; xi <= this.size.x; xi++) {
                        if (gameEnded === false) {
                            // avoid parsing further cols when game is ended
                            break;
                        }
                        var color = this.getCellColor(xi, yi);
                        if (this.floodColor !== color) {
                            gameEnded = false;
                            // console.log('game not ended yet because cell at ' + xi + '/' + yi + ' is "' + color + '"');
                        }
                    }
                    if (gameEnded === false) {
                        // avoid parsing further rows when game is ended
                        break;
                    }
                }
                if (gameEnded) {
                    this.onGameEnded();
                }
            }, 200);
        },
        onGameEnded: function () {
            console.log('tadaa');
            this.gameEnded = true;
            /* TODO : check if player beat highscore
            if (this.best === 0 || this.best > this.moves) {
                // if best has not been set yet
                // or
                // if best is worst than actual moves
                this.best = this.moves;
            }
            */
            if (!this.dbEnabled) {
                return;
            }
            if (this.player.length) {
                this.postScore();
            } else {
                this.askPlayer = true;
            }

        },
        db: function (method, url, payload) {
            var options = { method: method };
            if (payload) {
                options.body = JSON.stringify(payload);
                options.headers = { 'Content-Type': 'application/json' };
            }
            return fetch(this.endpoint + url, options).then((res) => res.json())
        }
    },
    mounted() {
        console.log('app init');
        this.init();
    }
});