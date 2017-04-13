
var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/web'));

app.listen(app.get('port'), function () {
    console.log('Flood-it is running on port', app.get('port'));
});