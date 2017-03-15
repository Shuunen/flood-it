
new Vue({
    el: '#game',
    data: {
        title: 'Flood-it',
        version: '0.1.0',
        baseColor: null,
        floodColor: null,
        best: 0,
        moves: 0,
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
            this.colorGrid();
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
            // console.log('rand col', this.pick(this.colors));
            for (var yi = 1; yi <= this.size.y; yi++) {
                for (var xi = 1; xi <= this.size.x; xi++) {
                    var color = this.pick(this.colors);
                    this.colorCell(xi, yi, color);
                }
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
                            console.log('game not ended yet because cell at ' + xi + '/' + yi + ' is "' + color + '"');
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
                    if (this.best === 0 || this.best > this.moves) {
                        // if best has not been set yet
                        // or
                        // if best is worst than actual moves
                        this.best = this.moves;
                    }
                }
            }, 200);
        }
    },
    mounted() {
        console.log('app init');
        this.init();
    }
});