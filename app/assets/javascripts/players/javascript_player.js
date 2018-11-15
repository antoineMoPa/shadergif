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
    window.onmessage = this.onIframeMessage;

    // TODO remove, dev only
    window.iframe = this.iframe;
    this.canvas = document.createElement('canvas');
    this.message_area = document.createElement('pre');
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

    {
      this.message_area.classList.add('mathjs-message-area');
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
    content += "<script type='text/javascript'>";
    content += this.code;
    content += `
const canvas = document.querySelectorAll("canvas")[0];
const ctx = canvas.getContext("2d");

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

function animate(){
    const now = new Date().getTime();
    render(canvas, now);
    window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);
/*
parent.postMessage({
    imageData: ctx.getImageData(0,0, canvas.width, canvas.height)
}, "*");*/
`;
    content += "</script>";
    content += "</body>";
    content += "</html>";
    
    return content;
  }

  onIframeMessage(event) {
    let data = event.data;

    if (data.imageData) {
      console.log(data.imageData);
    }
    
  }
  
  /*
     Generic player functions
     (That would be in an interface if Javascript had that)
   */
  set_container(div) {
    div.appendChild(this.iframe);
    div.appendChild(this.message_area);
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
    this.iframe.src = "data:text/html;charset=utf-8," + this.getIframeSrc();
  }

  setMessage(message) {
    this.message_area.innerText = message;
  }
}
