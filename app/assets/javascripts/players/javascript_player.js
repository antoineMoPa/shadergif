/*
function render(can, time) {
    const ctx = can.getContext("2d");
    ctx.clearRect(0,0,can.width,can.height);
    ctx.fillRect(0,0, 40+ (30.0 * Math.cos(time * 0.001)), 40);
    ctx.font="30px Verdana";
    ctx.fillText(time, 10, 100);
}
*/

class JavascriptPlayer {
  constructor() {
    this.mathjs_worker = null;
    this.mathjs_processing = false;
    this.compiled = false;

    /* 
      The sandboxed iframe allows us to run scripts while minimizing client-side 
      hack risk.
     */
    this.iframe = document.createElement("iframe");
    this.iframe.setAttribute("sandbox", "allow-scripts"); // Security: dont remove
    window.onmessage = this.onIframeMessage.bind(this);

    this.frames = 10;
    this.anim_delay = 100;
    
    this.canvas = document.createElement('canvas');
    this.frames_defined_in_code = false;
    this.window_focused = true;
    this.code = '';
    this.anim_interval = null;

    // TODO: synchronize with vue
    this.width = 540;
    this.height = 540;
    this.rendering_gif = false;

    this.on_error_listener = function (error) {
      console.log(`Error: ${error}`);
    };

    {
      // Init canvas
      this.mathjs_worker = new Worker('/assets/mathjs-worker.js');
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }

    {
      // To save CPU / GPU
      window.addEventListener('focus', function () {
        this.window_focused = true;
      });

      window.addEventListener('blur', function () {
        this.window_focused = false;
      });
    }
  }
  
  getIframeSrc() {
    let content = "";

    content += "<!DOCTYPE html>";
    content += "<html>";
    content += "<head>";
    content += "<style>";
    content += "*{margin:0;padding:0;overflow:hidden;}";
    content += "</style>";
    content += "</head>";
    content += "<body>";
    
    content += "<canvas width='"+this.width+"' height='"+this.height+"'></canvas>";

    content += `
<script type='text/javascript'>
window.onerror = (message, source, lineno) => {
    parent.postMessage({error: message, lineno: lineno - 8}, "*");
    return true;
};
</script>
`;
    
    let appendedCode = `
let frame = 0;
let canvas = document.querySelectorAll('canvas')[0];
let ctx = canvas.getContext('2d');
/* Lock to animation */
/* To ensure that the gif rendering does not interfere */
/* With regular preview animation */
let play_animation = true;
render(canvas, 0.0);

window.addEventListener('message',(event) => {
    let data = event.data;
    if(data.width) {
        canvas.width = data.width;
    }
    if(data.height) {
        canvas.height = data.height;
    }
    if(data.render) {
        render(canvas, data.render.time);
    }
});
let player_frames = `+ this.frames +`;
let anim_delay = `+ this.anim_delay +`;

function animate() {
    frame %= (player_frames);
    if(play_animation) {
        const now = new Date().getTime();
        render(canvas, (frame + 1) / player_frames);
    }
    setTimeout(() => {window.requestAnimationFrame(animate)}, anim_delay);
    frame++;
}

window.requestAnimationFrame(animate);

window.onmessage = (event) => {
    if(event.data.render) {
        play_animation = false;
        render(canvas, event.data.render.time);
        play_animation = true;
        parent.postMessage({
            time: event.time,
            canvas: canvas.toDataURL() 
        }, '*');
    }
};
`;
    content += "<script type='text/javascript'>";
    // Keep code and try on first line to keep line numbers right in error messages
    content += this.code + ";";
    content += appendedCode;
    content += "</script>";
    content += "</body>";
    content += "</html>";
    
    return content;
  }

  onIframeMessage(event) {
    let data = event.data;

    if (data.canvas) {
      if(this.receiveFrame){
        this.receiveFrame(data.canvas);
      }
    }

    if(data.error) {
      let message = data.error;
      let lineno = data.lineno;
      this.setError("Error at line " + (lineno+1) + ": " + message, lineno);
    }
    
  }

  /*
     Generic player functions
     (That would be in an interface if Javascript had that)
   */
  set_container(div) {
    div.appendChild(this.iframe);
  }

  set_code(code) {
    this.code = code;
    this.update();
  }

  set_width(w) {
    this.width = w;
    this.iframe.width = w;
    this.update();
  }

  set_height(h) {
    this.height = h;
    this.iframe.height = h;
    this.update();
  }

  /* callback receives a canvas element */
  render(time, callback) {
    const canvas = this.canvas;

    this.iframe.contentWindow.postMessage({
      render:{
        time: time
      }
    },"*");

    this.promise = new Promise(((resolve, reject) => {
      this.receiveFrame = (data) => {
        resolve(data);
      };
    }).bind(this)).then(callback);
    
    const message = {
      code: this.code,
      time,
    };

  }

  set_on_error_listener(callback) {
    // Call this on error
    this.on_error_listener = callback;
  }

  dispose() {
    // Nothing to do
  }

  /* Mathjs specific functions */

  update() {
    const now = new Date().getTime();
    this.iframe.contentWindow.postMessage({code: this.code},"*");
    this.iframe.contentWindow.postMessage({width: this.width, height: this.height},"*");
    this.iframe.src = "data:text/html;charset=utf-8," + encodeURIComponent(this.getIframeSrc());

  }

  setError(message, lineno) {
    this.on_error_listener(message, lineno);
  }
}
