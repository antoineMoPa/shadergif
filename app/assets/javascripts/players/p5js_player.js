
class P5JSPlayer extends JavascriptPlayer {
  constructor() {
    super();
    this.code = '';
    this.hasError = false;
    this.htmlWritten = false;
    this.libraryCount = 1;
    this.fetchLibrary('p5.min.js');
  }

  getIframeSrc(standalone) {
    // Libraries ready?
    if (this.libraries.length != 1) {
      return '';
    }

    let content = '';

    content += '<!DOCTYPE html>';
    content += '<html>';
    content += '<head>';
    content += '<style>';
    content += '*{margin:0;padding:0;overflow:hidden;}';
    content += '</style>';
    content += '</head>';
    content += '<body>';

    for (const i in this.libraries) {
      content += '<script type="text/javascript">';
      content += this.libraries[i];
      content += '</script>';
    }

    content += `
<script type='text/javascript'>
// An initial setup is required at page load
window.setup = () => {createCanvas(540, 540)};
window.draw = () => {createCanvas(540, 540)};
window.onerror = (message, source, lineno) => {
    
    parent.postMessage({error: message, lineno: lineno - 1}, "*");
    return true;
};
</script>
`;

    const appendedCode = `;
var looksInfinite = false;
window.fps = 10;
window.frames = 20;

window.onmessage = (event) => {
    let data = event.data;
    let canvas = document.querySelectorAll('canvas');
    /* fix bug when canvas not yet created */
    if(canvas.length != 0){
        canvas = canvas[0];
    }
    if(data.render) {
        // Override p5js millis() time functions
        let _old_millis = window.millis;
        let _old_draw = window.draw;
        window.millis = () => {return data.render.time * 1000;};
        // We dont want preview to override anim
        window.draw = () => {};

        _old_draw();
        parent.postMessage({
            time: event.time,
            canvas: canvas.toDataURL() 
        }, '*');

        window.millis = _old_millis;
        window.draw = _old_draw;
    }
    if(data.fps) {
        window.fps = data.fps;
    }
    if(data.frames) {
        window.frames = data.frames;
    }
    if(data._looksInfinite) {
        looksInfinite = _looksInfinite; 
        if(looksInfinite){
            window.draw = () => {};
        }
    }
    if(data.code && !looksInfinite) {
        let script = document.createElement("script");
        script.innerHTML = data.code;
        document.body.appendChild(script);
        window.setup = setup;
        window.draw = draw;
        window.setup();
    }
};
`;
    if(standalone) {
      content += "<script type='text/javascript' src='sketch.js'></script>";
    } else {
      content += "<script type='text/javascript'>";
      // Keep code and try on first line to keep line numbers right in error messages
      content += appendedCode;
      content += 'parent.postMessage({sendCode: true}, "*");';
      content += '</script>';
    }
    content += '</body>';
    content += '</html>';

    return content;
  }

  update() {
    if (this.looksInfinite) {
      return;
    }
    if ((!this.htmlWritten || this.hasError == true)
        && this.libraries.length == this.libraryCount) {
      this.iframe.src = `data:text/html;charset=utf-8,${encodeURIComponent(this.getIframeSrc(false))}`;
      this.htmlWritten = true;
      this.hasError = false;
    } else {
      this.iframe.contentWindow.postMessage({ code: this.code, fps: this.fps, frames: this.frames }, '*');
    }
  }

  standalone_files() {
    let index = encodeURIComponent(this.getIframeSrc(true));
    let sketch = this.code;
    
    return {
      "index.html": index,
      "sketch.js": sketch
    };
  }
}
