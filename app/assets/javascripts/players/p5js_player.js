
class P5JSPlayer extends JavascriptPlayer {
  constructor() {
    super();
    this.code = '';
    this.hasError = false;
    this.htmlWritten = false;
    this.libraryCount = 1;
    this.fetchLibrary('p5.min.js');
  }

  getIframeSrc() {
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

window.onmessage = (event) => {
    let data = event.data;
    let canvas = document.querySelectorAll('canvas');
    /* fix bug when canvas not yet created */
    if(canvas.length != 0){
        canvas = canvas[0];
    }
    if(data.render) {
        /* 
           P5JS does not allow rendering at arbitrary time 
           So we just always record 10 frames dumbly at fixed
           interval. (30 fps for 2 second)
        */
        for(let i = 0; i < 20; i++){
            setTimeout(() => {
                parent.postMessage({
                    time: event.time,
                    canvas: canvas.toDataURL() 
                }, '*');
            },1000/30);
        }
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
    content += "<script type='text/javascript'>";
    // Keep code and try on first line to keep line numbers right in error messages
    content += appendedCode;
    content += 'parent.postMessage({sendCode: true}, "*");';
    content += '</script>';
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
      this.iframe.src = `data:text/html;charset=utf-8,${encodeURIComponent(this.getIframeSrc())}`;
      this.htmlWritten = true;
      this.hasError = false;
    } else {
      this.iframe.contentWindow.postMessage({ code: this.code }, '*');
    }
  }
}
