var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const rooms = {};

app.get('/list', function(req, res){
  res.send(JSON.stringify['default']);
});


app.get('/', function(req, res){
  res.send('');
});


function join_room(socket, room_id, content){
  let count;
  
  if(rooms[room_id] == undefined){
    rooms[room_id] = {
      users_count: 1,
      content: ""
    };
    count = 1;
  } else {
    count = ++rooms[room_id].users_count;
  }

  socket.join(room_id);
  io.to(room_id).emit('users-count', count);
}

io.on('connection', function(socket){
  let room_id = null;

  socket.on("join", (data) => {
    room_id = data.room_id;
    join_room(socket, room_id, data.content);
  });

  socket.on('disconnect', function () {
    if(room_id != null){
      rooms[room_id].users_count--;
    }
  });

  socket.on('content', function(content){
    rooms[room_id].content = content;
    // Diffuse content except to sender
    socket.broadcast.to(room_id).emit('content', content);
  });
  
});

http.listen(3005, function(){
  console.log('listening on *:3005');
});
