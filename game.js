
new Vue({
    el: '#game',
    data: {
        title: 'Flood-it',
        version: '0.1.0',
        baseColor: null,
        floodColor: null,
        highscores: null,
        moves: 0,
        player: '',
        seed: '7x7_0203320220210300203212213232303131321333010021331',
        gameEnded: false,
        size: {
            x: 7,
            y: 7
        },
        colors: ['royalblue', 'deeppink', 'chartreuse', 'darkorange']
    },
    methods: {
        init: function () {
            this.gameEnded = false;
            this.moves = 0;
            // this.createSeed(); // commented to use the default seed
            this.colorGrid();
            this.getHighscores();
        },
        createSeed: function () {
            var seed = this.size.x + 'x' + this.size.y + '_';
            var nbColors = this.colors.length;
            for (var i = 0; i < this.size.x * this.size.y; i++) {
                seed += this.getRandBetween(0, nbColors - 1);
            }
            this.seed = seed;
            return seed;
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
        pick: function (arr) {
            var pos = this.getRandBetween(0, arr.length - 1);
            // console.log('rand pos : ' + pos + ' on ' + arr.length);
            return arr[pos];
        },
        colorGrid: function () {
            // this.seed = '7x7_3200013120203221020122022130221111223000303132131'
            // seed = '3200013120203221020122022130221111223000303132131'
            var seed = this.seed.split('_')[1];
            for (var yi = 1; yi <= this.size.y; yi++) {
                for (var xi = 1; xi <= this.size.x; xi++) {
                    // i = 3
                    var i = seed[0];
                    // color = 'darkorange' if colors is ['royalblue', 'deeppink', 'chartreuse', 'darkorange']
                    var color = this.colors[i];
                    // seed = '200013120203221020122022130221111223000303132131'
                    seed = seed.substr(1);
                    this.colorCell(xi, yi, color);
                }
            }
        },
        getHighscores: function () {
            this.db('get', '/scores?seed=' + this.seed).then((highscores) => {
                this.highscores = highscores;
            });
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
                    console.log('tadaa');
                    this.gameEnded = true;
                    /*
                    if (this.best === 0 || this.best > this.moves) {
                        // if best has not been set yet
                        // or
                        // if best is worst than actual moves
                        this.best = this.moves;
                    }
                    */
                }
            }, 200);
        },
        db: function (method, url, payload) {
            var options = { method: method };
            if (payload) {
                options.body = JSON.stringify(payload);
                options.headers = { 'Content-Type': 'application/json' };
            }
            return fetch(url, options).then((res) => res.json())
        }
    },
    mounted() {
        console.log('app init');
        this.init();
        /*
        this.db('post', '/scores', { player: 'hueï', score: 14, grid: 123233221143 }).then((data) => {
            console.log(data);
        });
        */
    }
});