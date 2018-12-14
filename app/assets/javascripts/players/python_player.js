class PythonPlayer extends JavascriptPlayer {
  constructor() {
    super();
    this.worker = 'http://127.0.0.1:63454';
    this.code = '';
    this.hasError = false;
    this.htmlWritten = false;
  }

  set_code(code) {
    this.code = code;

    fetch(this.worker, {
      method: "POST",
      body: code
    });
    
    this.update();
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
    content += '<meta charset="utf-8">';
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

    content += ``;

    const appendedCode = ``;
    if (standalone) {
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
    const index = this.getIframeSrc(true);
    const sketch = this.code;

    return {
      'index.html': index,
      'sketch.js': sketch
    };
  }
}
