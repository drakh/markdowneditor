var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8088);

var cursors={};

function handler (req, res) 
{
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}
io.sockets.on('disconnect',function(socket){
	cursors[socket.id]=null;
});
io.sockets.on('connection', function (socket) 
{
	socket.emit('mycursor',socket.id);
  //socket.emit('news', { hello: 'world' });
  socket.on('reconnect',function(){
  	socket.emit('mynewcursor',socket.id);
  });
  socket.on('caretmove', function (data) 
  {
	  cursors[socket.id]=data;
	  console.log(cursors);
	  socket.broadcast.emit('carets', cursors);//broadcast to all other clients
  });
});