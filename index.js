var jsonServer = require('json-server')
var server = jsonServer.create()
var router = jsonServer.router('db.json')
var middlewares = jsonServer.defaults()
var port = Number(process.env.PORT || 8080)
server.use(middlewares)
server.use(router)
server.listen(port, function () {
  // eslint-disable-next-line no-console
  console.log('Flood-it is running on port', port)
})
