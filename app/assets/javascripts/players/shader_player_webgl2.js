class ShaderPlayerWebGL2 {
  constructor() {
    this.fps = 10;
    this.compiled = false;
    this.canvas = document.createElement('canvas');
    this.gl = null;
    this.fragment_shader = '';
    this.vertex_shader = '';
    this.rttTexture = [];
    this.framebuffer = [];
    this.renderbuffer = [];
    this.renderBufferDim = [];
    this.textures = [];
    this.passes_defined_in_code = false;
    this.frames_defined_in_code = false;
    this.native_webgl2_supported = false;
    this.window_focused = true;
    this.anim_timeout = null;

    // TODO: synchronize with vue
    this.width = 540;
    this.height = 540;
    this.passes = 1;
    this.frames = 10;
    this.rendering_gif = false;
    this.mouse = [0, 0];

    // Better fit mobile screens
    if (window.innerWidth < 540) {
      this.width = window.innerWidth;
    }

    // Audio stuff
    this.pixels = new Uint8Array(this.width * this.height * 4);
    this.audioCtx = new AudioContext();
    this.currentSource = null;
    this.lastChunk = 0;
    this.time = 0.0;
    this.timeout = null;

    this.on_error_listener = function () {
      console.log('Shader compilation error');
    };

    {
      // Init canvas
      const gl = this.canvas.getContext('webgl2');

      // Detect webgl2 native problems
      // (read: my old laptop's graphics card is too old)
      // We default to not working
      if (gl != null) {
        this.native_webgl2_supported = true;
      }

      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.canvas.addEventListener('mousemove', this.canvas_mousemove.bind(this));
      this.gl = gl;
      this.init_gl();
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

  /*
     Generic player functions
     (That would be in an interface if Javascript had that)
   */

  set_container(div) {
    div.appendChild(this.canvas);
  }

  set_code(code) {
    this.fragment_shader = code;
    this.update();
  }

  set_width(w) {
    this.width = w;
    this.update();
  }

  set_height(h) {
    this.height = h;
    this.update();
  }

  set_fps(fps) {
    this.fps = fps;
    this.update();
  }

  /* callback receives a canvas element */
  render(time, callback) {
    callback = callback || function () {};
    this.draw_gl(time);
    callback(this.canvas);
  }

  set_on_error_listener(callback) {
    // Call this on error
    this.on_error_listener = callback;
  }

  dispose() {
    if (this.anim_timeout != null) {
      window.clearTimeout(this.anim_timeout);
    }
  }

  /* Shader player specific functions */

  set_vertex_shader(code) {
    this.vertex_shader = code;
    this.update();
  }

  update() {
    const now = new Date().getTime();

    if (this.fragmentShader == '' || this.vertex_shader == '') {
      return;
    }

    this.manage_passes();

    // Needed when changing passes number
    // (renderbuffer & stuff)
    if (this.gl == null) {
      // Only init once
      this.init_gl();
    }

    // TODO: rename this update_program
    this.init_program();
    this.animate();
  }

  // Took from MDN:
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
  // Initialize a texture and load an image.
  // When the image finished loading copy it into the texture.
  //
  add_texture(url) {
    function isPowerOf2(value) {
      return (value & (value - 1)) == 0;
    }

    const gl = this.gl;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(
      gl.TEXTURE_2D, level, internalFormat,
      width, height, border, srcFormat, srcType,
      pixel);

    const image = new Image();
    image.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, image);

      // WebGL1 has different requirements for power of 2 images
      // vs non power of 2 images so check if the image is a
      // power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        // No, it's not a power of 2. Turn of mips and set
        // wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
    };
    image.src = url;

    this.textures.push(texture);
  }

  delete_texture(index) {
    const gl = this.gl;
    gl.deleteTexture(this.textures[index]);
    this.textures.splice(index, 1);
  }

  // Recursive dom tool to find page offset
  // of an element
  offset_parent(element, offset) {
    if (element.offsetParent != null) {
      const p = this.offset_parent(element.offsetParent, offset);
    } else {
      offset[0] -= window.scrollX;
      offset[1] -= window.scrollY;
    }

    if (element.offsetLeft) {
      offset[0] += element.offsetLeft - element.scrollLeft;
    }
    if (element.offsetTop) {
      offset[1] += element.offsetTop - element.scrollTop;
    }

    return offset;
  }

  canvas_mousemove(e) {
    const c = e.target;
    const offset = this.offset_parent(c, [0, 0]);

    const ratio = c.width / c.height;
    const x = ((e.clientX - offset[0]) / c.width - 0.5) * ratio;
    const y = ((e.clientY - offset[1]) / c.width - 0.5 / ratio) * ratio;

    this.mouse = [x, -y];
  }

  init_gl() {
    this.compiled = false;

    if (this.gl == null) {
      return;
    }

    const gl = this.gl;
    let ww = 2;
    let hh = 2;

    // Delete previous textures
    for (var i = 0; i < this.rttTexture.length; i++) {
      gl.deleteTexture(this.rttTexture[i]);
      gl.deleteRenderbuffer(this.renderbuffer[i]);
      gl.deleteFramebuffer(this.framebuffer[i]);
    }

    // Find nearest power of 2 above width and height
    while (this.width > ww) {
      ww <<= 1;
    }
    while (this.height > hh) {
      hh <<= 1;
    }

    this.renderBufferDim = [ww, hh];

    for (var i = 0; i < 10; i++) {
      this.rttTexture[i] = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[i]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ww, hh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      // Render to texture stuff
      this.framebuffer[i] = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer[i]);

      this.renderbuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.rttTexture[i], 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer[i]);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, ww, hh);
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Triangle strip for whole screen square
    const vertices = [
      -1, -1, 0,
      -1, 1, 0,
      1, -1, 0,
      1, 1, 0
    ];

    const tri = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tri);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    this.compiled = true;
  }

  init_program() {
    this.compiled = false;
    const player = this;

    if (this.gl == null) {
      return;
    }

    const gl = this.gl;

    // Delete previous program
    if (typeof gl.program !== 'undefined') {
      gl.useProgram(gl.program);
      if (this.fragment_shader_object > -1) {
        gl.detachShader(gl.program, this.fragment_shader_object);
      }
      if (this.vertex_shader_object > -1) {
        gl.detachShader(gl.program, this.vertex_shader_object);
      }
      gl.deleteShader(gl.fragment_shader);
      gl.deleteShader(gl.vertex_shader);
      gl.deleteProgram(gl.program);
    }

    gl.program = gl.createProgram();

    const vertex_shader =      add_shader(gl.VERTEX_SHADER, this.vertex_shader);

    const fragment_shader =      add_shader(gl.FRAGMENT_SHADER, this.fragment_shader);

    this.fragment_shader_object = fragment_shader;
    this.vertex_shader_object = vertex_shader;

    function add_shader(type, content) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, content);
      gl.compileShader(shader);

      // TODO: Find out right error pre

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const err = gl.getShaderInfoLog(shader);

        player.on_error_listener(err);
      } else {
        //
      }

      gl.attachShader(gl.program, shader);

      return shader;
    }

    if (vertex_shader == -1 || fragment_shader == -1) {
      return;
    }

    gl.linkProgram(gl.program);

    if (!gl.getProgramParameter(gl.program, gl.LINK_STATUS)) {
      console.log(gl.getProgramInfoLog(gl.program));
    }

    gl.useProgram(gl.program);

    const positionAttribute = gl.getAttribLocation(gl.program, 'position');

    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);
    this.compiled = true;
  }

  // TODO: TEST SOUND
  play_sound() {
    const gl = this.gl;
    this.draw_gl(0);
    gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);

    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    const source = this.audioCtx.createBufferSource();
    const frameCount = this.audioCtx.sampleRate * 1.0;
    const audioArrayBuffer = this.audioCtx.createBuffer(1, 48000, 48000);
    const nowBuffering = audioArrayBuffer.getChannelData(0);

    this.currentSource = source;

    let i = 0;
    let j = 0;

    while (j < 48000) {
      // Copy and skip alpha
      nowBuffering[j + 0] = (this.pixels[i + 0] / 255) - 0.5;
      nowBuffering[j + 1] = (this.pixels[i + 1] / 255) - 0.5;
      nowBuffering[j + 2] = (this.pixels[i + 2] / 255) - 0.5;
      i += 4;
      j += 3;
    }

    // set the buffer in the AudioBufferSourceNode
    source.buffer = audioArrayBuffer;

    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    source.connect(this.audioCtx.destination);

    if (this.lastChunk == 0) {
      // start the source playing
      source.start(0);
      this.lastChunk = this.audioCtx.currentTime + 1;
    } else {
      source.start(this.lastChunk);
      this.lastChunk += 1;
    }

    // Find some resonable time for next computation
    const deltat = (this.lastChunk - this.audioCtx.currentTime) * 1000 - 500;
    this.timeout = window.setTimeout(this.play_sound.bind(this), deltat);
  }

  draw_gl(time) {
    if (!this.compiled) {
      return;
    }

    const gl = this.gl;

    if (gl == null || gl.program == null || typeof gl.program === 'undefined') {
      return;
    }

    for (let pass = 0; pass < this.passes; pass++) {
      if (pass < this.passes - 1) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer[pass]);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }

      // Manage lastpass
      if (pass > 0) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[pass - 1]);
        gl.uniform1i(gl.getUniformLocation(gl.program, 'lastPass'), pass - 1);
      }

      let i = 0;

      // Warning: i is continued in other loop
      for (; i < this.passes; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        if (i == pass) {
          // Unbind current to prevent feedback loop
          gl.bindTexture(gl.TEXTURE_2D, null);
          continue;
        }
        var att = gl.getUniformLocation(gl.program, `pass${i}`);
        gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[i]);
        gl.uniform1i(att, i);
      }

      for (let j = 0; j < this.textures.length; j++, i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        var att = gl.getUniformLocation(gl.program, `texture${j}`);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[j]);
        gl.uniform1i(att, i);
      }

      gl.uniform2fv(
        gl.getUniformLocation(gl.program, 'renderBufferRatio'),
        [
          this.renderBufferDim[0] / this.width,
          this.renderBufferDim[1] / this.height
        ]
      );

      gl.uniform2fv(
        gl.getUniformLocation(gl.program, 'mouse'),
        [this.mouse[0], this.mouse[1]]
      );

      const passAttribute = gl.getUniformLocation(gl.program, 'pass');
      gl.uniform1i(passAttribute, pass + 1);

      const soundTimeAttribute = gl.getUniformLocation(gl.program, 'soundTime');

      gl.uniform1f(soundTimeAttribute, this.lastChunk);

      // Set time attribute
      const tot_time = this.frames * this.anim_delay;

      const timeAttribute = gl.getUniformLocation(gl.program, 'time');
      gl.uniform1f(timeAttribute, time);

      const iGlobalTimeAttribute = gl.getUniformLocation(gl.program, 'iGlobalTime');
      const date = new Date();
      let gtime = (date.getTime()) / 1000.0 % (3600 * 24);
      // Add seconds
      gtime += time;
      gl.uniform1f(iGlobalTimeAttribute, gtime);


      const iResolutionAttribute = gl.getUniformLocation(gl.program, 'iResolution');

      gl.uniform3fv(
        iResolutionAttribute,
        new Float32Array(
          [
            this.width,
            this.height,
            1.0
          ]
        ));

      // Screen ratio
      const ratio = this.width / this.height;

      const ratioAttribute = gl.getUniformLocation(gl.program, 'ratio');
      gl.uniform1f(ratioAttribute, ratio);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.viewport(0, 0, this.width, this.height);
    }
  }

  animate() {
    const player = this;
    let frame = 0;

    // Update width/height
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    if (this.anim_already_started) {
      return;
    }

    this.anim_already_started = true;

    function _animate() {
      const anim_delay = Math.floor(1000 / this.fps);

      frame %= (this.frames);

      // When rendering gif, draw is done elsewhere
      if (!player.rendering_gif && player.window_focused) {
        player.draw_gl((frame + 1) / player.frames);
      }

      this.anim_timeout = window.setTimeout(() => {
        window.requestAnimationFrame(_animate.bind(this));
      }, anim_delay);

      frame++;
    }

    window.requestAnimationFrame(_animate.bind(this));
  }

  manage_passes() {
    const c = this.fragment_shader;
    // Verify if passes is set there
    var re = /\/\/PASSES=([0-6])/;
    var result = re.exec(c);

    if (result == null) {
      this.passes_defined_in_code = false;
    } else {
      this.passes_defined_in_code = true;
      this.passes = parseInt(result[1]);
    }

    // Verify if frames is set in code
    var re = /\/\/FRAMES=([0-9]*)/;
    var result = re.exec(c);

    if (result == null) {
      this.frames_defined_in_code = false;
    } else {
      const qty = parseInt(result[1]);
      if (isNaN(qty) || qty < 1) {
        this.frames_defined_in_code = false;
      } else {
        this.frames_defined_in_code = true;
        this.frames = qty;
      }
    }
  }

  getStandaloneHTML() {
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
    content += '<script type="text/javascript" src="ShaderPlayerWebGL2.js"></script>\n';
    content += '<script type="text/javascript">\n';
    content += 'player = new ShaderPlayerWebGL2();\n';
    content += 'player.set_container(document.body);\n';
    content += 'fetch("vertex_shader.glsl").then((response) => \n';
    content += '{response.text().then((text) => {\n';
    content += '    player.set_vertex_shader(text);\n';
    content += '})});\n';
    content += 'fetch("sketch.glsl").then((response) => \n';
    content += '{response.text().then((text) => {\n';
    content += '    player.set_code(text);\n';
    content += '})});\n';
    content += '</script>';
    content += '</body>';
    content += '</html>';

    return content;
  }

  standalone_files() {
    const index = this.getStandaloneHTML();
    const sketch = this.fragment_shader;

    return {
      'index.html': index,
      'sketch.glsl': sketch,
      'vertex_shader.glsl': this.vertex_shader,
      'ShaderPlayerWebGL2.js': ShaderPlayerWebGL2.toSource()
    };
  }
}
