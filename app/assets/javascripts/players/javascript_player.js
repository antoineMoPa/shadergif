
class JavascriptPlayer {
  constructor() {
    this.mathjs_worker = null;
    this.mathjs_processing = false;
    this.compiled = false;
    this.libraries = [];

    /*
      The sandboxed iframe allows us to run scripts while minimizing client-side
      hack risk.
     */
    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute('sandbox', 'allow-scripts'); // Security: dont remove
    window.onmessage = this.onIframeMessage.bind(this);

    this.frames = 10;

    this.canvas = document.createElement('canvas');
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

  getIframeSrc(standalone) {
    let content = '';

    content += '<!DOCTYPE html>';
    content += '<html>';
    content += '<head>';
    content += '<meta charset="utf-8">';
    content += '<style>';
    content += '*{margin:0;padding:0;overflow:hidden;}';
    content += '</style>';
    content += '</head>';
    content += '<body>';

    content += `<canvas width='${this.width}' height='${this.height}'></canvas>`;

    for (const i in this.libraries) {
      content += '<script type="text/javascript">';
      content += this.libraries[i];
      content += '</script>';
    }

    content += `
<script type='text/javascript'>
window.onerror = (message, source, lineno) => {
    parent.postMessage({error: message, lineno: lineno - 8}, "*");
    return true;
};
</script>
`;

    const appendedCode = `
let rendering_gif = ${this.rendering_gif};
let frame = 0;
let canvas = document.querySelectorAll('canvas')[0];
let ctx = canvas.getContext('2d');
/* Lock to animation */
/* To ensure that the gif rendering does not interfere */
/* With regular preview animation */
let play_animation = true;

render(canvas, 0.0);

let player_frames = ${this.frames};
let anim_delay = Math.floor(1000/${this.fps});

function animate() {
    frame %= (player_frames);
    if(play_animation && !rendering_gif) {
        render(canvas, (frame + 1) / player_frames, frame);
    }
    setTimeout(() => {window.requestAnimationFrame(animate)}, anim_delay);
    frame++;
}

window.requestAnimationFrame(animate);

window.onmessage = (event) => {
    let data = event.data;
    if(data.width) {
        canvas.width = data.width;
    }
    if(data.height) {
        canvas.height = data.height;
    }
    if(data.rendering_gif !== undefined){
        if(data.rendering_gif){
            // Hack: reset frame count since we are
            // starting gif
            frame = 0;
        }
        rendering_gif = data.rendering_gif;
    }
    if(data.render) {
        play_animation = false;
        render(canvas, data.render.time, data.frame);
        play_animation = true;
        parent.postMessage({
            time: event.time,
            canvas: canvas.toDataURL() 
        }, '*');
    }
};
`;


    if (standalone) {
      content += "<script type='text/javascript' src='sketch.js'></script>";
      content += "<script type='text/javascript'>";
      content += appendedCode;
      content += '</script>';
    } else {
      // Keep code and try on first line to keep line numbers right in error messages
      content += "<script type='text/javascript'>";
      content += `${this.code};`;
      content += appendedCode;
      content += '</script>';
    }

    content += '</body>';
    content += '</html>';

    return content;
  }

  onIframeMessage(event) {
    const data = event.data;

    if (data.canvas) {
      if (this.receiveFrame) {
        this.receiveFrame(data.canvas);
      }
    }

    if (data.sendCode) {
      this.iframe.contentWindow.postMessage({ code: this.code }, '*');
    }

    if (data.error) {
      const message = data.error;
      const lineno = data.lineno;
      this.setError(`Error at line ${lineno + 1}: ${message}`, lineno);
      this.hasError = true;
    }

    // P5JS sets width and height in the code
    if (data.width) {
      // Hack: I store the app in a global
      // But I save the enormous overhead
      // of a state manager
      // I hate state overhead caused by state managers
      window.app.width = data.width;
      this.iframe.setAttribute('width', data.width);
    }

    if (data.height) {
      window.app.height = data.height;
      this.iframe.setAttribute('height', data.height);
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

  set_fps(fps) {
    this.fps = fps;
    this.update();
  }

  set_frames(frames) {
    this.frames = frames;
    this.update();
  }

  /* callback receives a canvas element */
  render(time, callback, frame) {
    const canvas = this.canvas;

    this.iframe.contentWindow.postMessage({
      render: {
        time,
        frame
      }
    }, '*');

    this.promise = new Promise(((resolve, reject) => {
      this.receiveFrame = (data) => {
        resolve(data);
      };
    })).then(callback);

    const message = {
      code: this.code,
      time
    };
  }

  set_on_error_listener(callback) {
    // Call this on error
    this.on_error_listener = callback;
  }

  pause_anim() {
    this.iframe.contentWindow.postMessage({ rendering_gif: true }, '*');
  }

  resume_anim() {
    this.iframe.contentWindow.postMessage({ rendering_gif: false }, '*');
  }

  dispose() {
    // Nothing to do
  }

  /*
    Used by p5 mode to fetch p5
   */
  fetchLibrary(path) {
    const _ = this;
    const url = `/editor/public_libs/${path}`;

    window.fetch(url).then((data) => {
      data.text().then((text) => {
        _.libraries.push(text);
        _.update();
      });
    });
  }

  /* Mathjs specific functions */

  update() {
    this.hasError = false;
    const now = new Date().getTime();
    this.iframe.contentWindow.postMessage({ code: this.code }, '*');
    this.iframe.contentWindow.postMessage({ width: this.width, height: this.height }, '*');
    this.iframe.src = `data:text/html;charset=utf-8,${encodeURIComponent(this.getIframeSrc(false))}`;
  }

  setError(message, lineno) {
    this.on_error_listener(message, lineno);
  }

  standalone_files() {
    const index = this.getIframeSrc(true);
    const sketch = this.code;

    return {
      'index.html': index,
      'sketch.js': sketch
    };
  }
}
