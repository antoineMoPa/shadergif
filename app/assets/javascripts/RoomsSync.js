class RoomsSync{
  constructor(){
    this.connect();
    this.shadow = "";
    this.socket = null;
    this.room_id = /\/rooms\/(.*)/.exec(window.location)[1];
    this.users_count = 0;
    this.updater = null;
  }

  // Public API follows
  
  // This is part of the public API
  // Updater is a function that is called when we recieve modifications
  set_updater(updater){
    this.updater = updater;
  }
  
  // This is part of the public API
  send_update(content){
    if(this.socket != null){
      this.shadow = content;
      this.socket.emit("content", {content: content});
    }
  }

  // Private API follows
  
  connect(){
    let rs = this;
    let socket_io_url =
        window.location.protocol + "//" +
        window.location.hostname +
        ":3005";

    window._socket_ready = () => {
      let socket = io(socket_io_url);
      rs.socket = socket;
      rs.bind_socket_events.bind(this)(socket);
    };
    
    let script_url = socket_io_url + "/socket.io/socket.io.js";
    
    document.write("<script src='"+script_url+"' onload='_socket_ready()'></script>");
  }

  
  bind_socket_events(socket){
    let rs = this;
    socket.emit("join", {room_id: rs.room_id});
    socket.on("content", (content) => {
      rs.receive_update.bind(rs)(content);
    });
    socket.on("users-count", (count) => {
      rs.users_count = count;
    });
  }

  receive_update(data){
    if(this.updater != null){
      if(data.content != this.shadow){
        this.updater(data.content);
      }
    }
  }
}

const rs = new RoomsSync();

// `app` is Vue app for editor
app.set_room_sync(rs);
