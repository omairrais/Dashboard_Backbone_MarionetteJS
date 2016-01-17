var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname)).listen(8080, function(){ console.log('server initiated'); });
/*var express = require('express');
var app = express();

app.use('/', express.static(__dirname));
app.listen(3000, function() { console.log('listening')});*/