//= require lib/codemirror/lib/codemirror.js
//= require lib/codemirror/addon/dialog/dialog.js
//= require lib/codemirror/addon/search/searchcursor.js
//= require lib/codemirror/addon/search/search.js
//= require lib/codemirror/addon/scroll/annotatescrollbar.js
//= require lib/codemirror/addon/search/matchesonscrollbar.js

//= require lib/codemirror-webgl-clike.js
// todo: remove base.js
//= require lib/base.js
//= require lib/gif-export/lib/gifjs/gif.js

/*
  Resources:

  * https://gist.github.com/mbostock/5440492
  * http://memfrag.se/blog/simple-vertex-shader-for-2d
  * https://www.opengl.org/wiki/Data_Type_%28GLSL%29#Vector_constructors
  * https://www.opengl.org/wiki/Built-in_Variable_%28GLSL%29
  * https://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf

  */

const is_example = window.location.href.match(/\?file\=([_a-zA-Z0-9\/]+\.glsl?(\?v=[0-9]+))/);
const DEFAULT_WIDTH = 540;
const DEFAULT_HEIGHT = 540;
const cm_errorLines = [];
let start_gif = load_script('start-gif').trim();


if (start_gif != '') {
  start_gif = JSON.parse(start_gif);

  if (typeof (start_gif.textures) === 'undefined') {
    start_gif.textures = null;
  }
} else {
  start_gif = null;
}

function default_fragment_policy() {
  let code = '';

  if (start_gif != null) {
    // If we are viewing a draft, use it
    code = start_gif.code.replace(/\r\n/g, '\n');
  } else if (
    window.localStorage.code != undefined
      && window.localStorage.code != ''
  ) {
    // Not a draft, use last edited code saved in localstorage
    // (Prevents losing code when reloading the page)
    code = window.localStorage.code;
  } else {
    code = load_script('default-fragment-shader');
    window.localStorage.lang = 'shader_webgl2';
  }

  return code;
}

function default_lang_policy() {
  if (start_gif != null) {
    if (start_gif.lang != null) {
      return start_gif.lang;
    }
  }
  if (typeof (window.localStorage.lang) !== 'undefined') {
    let available_langs = ['mathjs','shader_webgl1','shader_webgl2'];
    console.log(window.localStorage.lang, window.localStorage.lang in available_langs);
    if (available_langs.includes(window.localStorage.lang)) {
      return window.localStorage.lang;
    }
  }

  return 'shader_webgl2';
}

function default_frame_count_policy() {
  if (start_gif != null) {
    if (start_gif.frames != null) {
      return parseInt(start_gif.frames);
    }
  }

  if (typeof (window.localStorage.frames) !== 'undefined') {
    return parseInt(window.localStorage.frames);
  }

  return 10;
}

function default_width_policy() {
  if (start_gif != null) {
    if (start_gif.width != null) {
      return parseInt(start_gif.width);
    }
  }

  // No localstorage, since bugs would happen. Example:
  // Create a huge canvas by mistake
  // Browser semi-hangs
  // You reload tab / reboot PC to fix problem
  // LocalStorage says width/height is still huge
  // You are stuck in the bug

  return 540;
}

function default_height_policy() {
  if (start_gif != null) {
    if (start_gif.height != null) {
      return parseInt(start_gif.height);
    }
  }

  return 540;
}

var app = new Vue({
  el: '#shadergif-app',
  data: {
    lang: default_lang_policy(),
    player: null,
    user: null,
    gif: start_gif,
    webgl2_init_error: false,
    status: '',
    texture_support: false,
    sound_support: false,
    sound_mode: false,
    send_status: '',
    error: '',
    f_editor: null,
    code: default_fragment_policy(),
    frames_defined_in_code: false,
    width: default_width_policy(),
    height: default_height_policy(),
    frames: default_frame_count_policy(),
    anim_delay: 100,
    rendering_gif: false,
    has_zip: false,
    zip_url: '',
    watermark: 'shadergif.com',
    textures: [],
    gifjs: {
      quality: 8,
      dithering: 'FloydSteinberg',
    },
    autocompile: true,
    images: [],
    error_msg: '',
  },
  watch: {
    'gifjs.dithering': function (d) {
      // Convert string to null
      if (d == 'false') {
        this.gifjs.dithering = false;
      }
    },
    width(w) {
      this.update_player();
    },
    height(h) {
      this.update_player();
    },
    frames(f) {
      this.update_player();
    },
    lang(t) {
      window.localStorage.lang = this.lang;
      this.set_player();
      this.update_player();
    },
  },
  methods: {
    code_change() {
      const app = this;
      window.localStorage.code = app.code;

      if (app.autocompile) {
        app.$nextTick(() => {
          app.update_player();
        });
      }
    },
    update_player() {
      const app = this;

      app.error_msg = '';

      // Remove previous errors
      for (const err in cm_errorLines) {
        app.f_editor.removeLineClass(cm_errorLines[err], 'background');
      }

      this.player.set_code(this.code);
      this.player.set_width(this.width);
      this.player.set_height(this.height);

      if (!this.player.frames_defined_in_code) {
        app.player.frames = this.frames;
      }
    },
    recompile() {
      this.update_player();
    },
    play_sound() {
      const sp = this.$refs['shader-player'];
      app.player.play_sound();
    },
    stop_sound() {
      const sp = this.$refs['shader-player'];
      clearTimeout(app.player.timeout);
      app.player.lastChunk = 0;
      if (app.player.currentSource != null) {
        app.player.currentSource.stop();
      }
    },
    enable_sound_mode() {
      this.sound_mode = true;
      this.width = 256;
      this.height = 256;
      this.update_player();
    },
    disable_sound_mode() {
      this.sound_mode = false;
      this.stop_sound();
    },
    load_default_sound_shader() {
      this.code = load_script('default-sound-shader');
      app.f_editor.setValue(this.code);
    },
    send_to_server() {
      make_png_server();
    },
    export_gif(to_export) {
      // Make the gif from the frames
      const app = this;
      app.status = 'Encoding Gif';

      app.$nextTick(() => {
        const gif = new GIF({
          workers: 2,
          quality: app.gifjs.quality,
          dither: app.gifjs.dithering,
          workerScript: '/workers/gif.worker.js',
        });

        data = to_export.data;

        const images = [];

        for (let i = 0; i < data.length; i++) {
          const image = new Image();
          image.src = data[i];
          image.onload = imageLoaded;
          images.push(image);
        }

        let number_loaded = 0;
        function imageLoaded() {
          number_loaded++;
          if (number_loaded == data.length) {
            convert();
          }
        }

        function convert() {
          const code = app.f_editor.getValue();

          for (let i = 0; i < images.length; i++) {
            gif.addFrame(images[i], { delay: to_export.delay });
          }

          gif.render();

          gif.on('finished', (blob) => {
            // Create image
            const size = (blob.size / 1000).toFixed(2);

            // Create base64 version
            // PERF: TODO: generate image on submit only
            const reader = new window.FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function () {
              // reader.result = base64 data
              app.images.unshift({
                type: 'gif',
                size,
                blob: reader.result,
                src: URL.createObjectURL(blob),
                code,
                textures: app.textures,
                frames: app.frames,
              });

              app.status = 'Done!';
              setTimeout(() => {
                app.status = '';
              }, 1000);
            };
          });
        }
      });
    },
    render(options) {
      if (typeof (options) === 'undefined') {
        options = {
          zip: false,
          stack: true,
          gif: false,
        };
      }

      // Renders all the frames to a png
      const app = this;

      app.player.rendering_gif = true;
      app.rendering_gif = true;
      app.status = 'Rendering Gif';

      const to_export = {};

      if (options.gif) {
        to_export.delay = app.anim_delay;
        to_export.data = [];
      }

      const tempCanvas = document.createElement('canvas');
      const canvas = tempCanvas;

      canvas.width = app.player.canvas.width;
      canvas.height = app.player.canvas.height;

      if (options.stack) {
        canvas.height = app.player.canvas.height * app.player.frames;
      }

      const ctx = canvas.getContext('2d');

      let i = 0;

      /*
        "Unrolled" async loop:
        for every image:
        render & load image
        onload: add to canvas
        when all are loaded: create image from canvas
      */
      function next() {
        const pl = app.player;
        if (i < pl.frames) {
          const curr = i;

          const w = pl.width;
          const h = pl.height;
          const watermark = app.watermark;
          const offset_x = 10;
          const color = '#888888';
          ctx.textAlign = 'end';
          const temp_img = document.createElement('img');

          temp_img.onload = function () {
            if (options.stack) {
              const offset = curr * pl.canvas.height;
              ctx.drawImage(temp_img, 0, offset);
              ctx.fillStyle = color;
              ctx.fillText(watermark, -offset_x, h - 10 + offset);
              next();
            } else if (options.gif) {
              ctx.drawImage(temp_img, 0, 0);
              ctx.fillStyle = color;
              ctx.fillText(watermark, w - offset_x, h - 10);
              to_export.data.push(canvas.toDataURL());
              next();
            } else if (options.zip) {
              const zip = window.shadergif_zip;
              ctx.drawImage(temp_img, 0, 0);
              ctx.fillStyle = color;
              ctx.fillText(watermark, w - offset_x, h - 10);

              // 4-Zero pad number
              let filename = 'image-';
              const numzeros = 4;
              const numlen = (`${curr}`).length;

              for (let i = 0; i < numzeros - numlen; i++) {
                filename += '0';
              }

              filename += `${curr}.png`;

              canvas.toBlob((blob) => {
                zip.file(
                  filename,
                  blob,
                );
                next();
              });
            }
          };

          // Render
          app.player.render((curr + 1) / pl.frames, (canvas) => {
            const image_data = canvas.toDataURL();
            temp_img.src = image_data;
          });
        } else {
          // Final step
          if (options.gif) {
            app.status = '';
            app.export_gif(to_export);
            app.player.rendering_gif = false;
            app.rendering_gif = false;
          } else if (options.stack) {
            app.status = '';
            image_data = canvas.toDataURL();
            app.player.rendering_gif = false;
            app.rendering_gif = false;

            app.images.unshift({
              type: 'png',
              size: false,
              src: image_data,
            });
          } else if (options.zip) {
            const zip = window.shadergif_zip;
            app.player.rendering_gif = false;
            app.rendering_gif = false;
            app.status = '';
            zip.generateAsync({ type: 'blob' })
              .then((content) => {
                app.has_zip = true;
                app.zip_url = URL.createObjectURL(content);
              });
          }
        }
        i++;
      }

      next();
    },
    delete_downloaded_zip() {
      // This could avoid memory problems in the future
      app.has_zip = false;
      setTimeout(() => {
        URL.revokeObjectURL(app.zip_url);
        app.zip_url = '';
        console.log('revoked last gif object url to save memory.');
      }, 10000);
    },
    make_gif() {
      this.render({
        zip: false,
        stack: false,
        gif: true,
      });
    },
    make_png() {
      this.render({
        zip: false,
        stack: true,
        gif: false,
      });
    },
    make_zip() {
      const app = this;
      // Lazy-load gif.js
      const script = document.createElement('script');
      script.src = '/assets/lib/jszip.min.js';
      script.onload = function () {
        const zip = window.shadergif_zip = new JSZip();

        app.render({
          zip: true,
          stack: false,
          gif: false,
        });
      };
      document.body.appendChild(script);
    },
    new_texture() {
      const app = this;
      const input = document.querySelectorAll('.shadergif-texture-input')[0];
      const pl = this.$refs['shader-player'];

      function watch_reader(reader, name) {
        reader.addEventListener('load', () => {
          app.textures.push({
            name,
            data: reader.result,
          });
          app.player.add_texture(reader.result);
        }, false);
      }

      for (let i = 0; i < input.files.length; i++) {
        try {
          const file = input.files[i];
          const reader = new FileReader();

          watch_reader(reader, file.name);

          if (file) {
            reader.readAsDataURL(file);
          }
        } catch (e) {
          // Well I guess you are using a dumb browser
        }
      }
    },
    delete_texture(index) {
      this.textures.splice(index, 1);

      app.player.delete_texture(index);
    },
    set_player() {
      const lang = this.lang;
      const container = this.$el.querySelectorAll('.player-container')[0];

      if (this.player != null) {
        this.player.dispose();
      }

      container.innerHTML = '';

      let vertex_code = '';

      if (lang == 'mathjs') {
        this.player = new MathjsPlayer();
        this.player.set_container(container);
        this.texture_support = false;
        this.sound_support = false;
      } else if (lang == 'shader_webgl2') {
        this.texture_support = true;
        this.sound_support = true;
        this.player = new ShaderPlayerWebGL2();

        if (!this.player.native_webgl2_supported) {
          this.webgl2_init_error = true;
        }

        this.player.set_container(container);

        vertex_code = vertexShaderWebGL2;
        this.player.set_vertex_shader(vertex_code);
        this.update_player();
      } else {
        // assume shader_webgl1
        // (old shaders have lang == null)
        this.texture_support = true;
        this.sound_support = true;
        this.player = new ShaderPlayerWebGL1();
        this.player.set_container(container);

        vertex_code = vertexShader;
        this.player.set_vertex_shader(vertex_code);
        this.update_player();
      }

      this.player.set_on_error_listener((error) => {
        app.add_error(error);
      });
    },
    add_error(err) {
      this.error_msg = `Error\n${err}`;
      try {
        if (this.lang == 'shader_webgl1') {
          let line = err.match(/^ERROR: [0-9]*:([0-9]*)/)[1];

          // Fix potential bug killing all text sometimes
          // like when inserting backticks (`)
          // and the compiler does not give any line
          // then codemirror becomes crazy
          if (line == '') {
            return;
          }

          line = parseInt(line) - 1;

          // Bug that could happen
          if (isNaN(line)) {
            return;
          }

          const errline = app.f_editor.addLineClass(line, 'background', 'errorline');
          cm_errorLines.push(errline);
        }
      } catch (e) {
        // do nothing
      }
    },
    load_start_textures() {
      const app = this;

      function add_image(texture, index) {
        // 'Hardcoded' xhr
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/textures/${texture.filename}`);
        xhr.onreadystatechange = function () {
          if (xhr.readyState == 4) {
            if (xhr.status == 200) {
              app.textures.splice(i, 1, {
                name: texture.name,
                data: xhr.responseText,
              });
              app.player.add_texture(xhr.responseText);
            }
          }
        };
        xhr.send();
      }


      if (start_gif != null && start_gif.textures != null) {
        // If we are viewing a draft, use it
        for (var i = 0; i < start_gif.textures.length; i++) {
          add_image(start_gif.textures[i], i);
        }
      }
    },
    downloadImage(src, name) {
      window.open(src, name);
    },
    on_submit(e) {
      this.status = 'Be patient while gif is uploading!';
    },
  },
  computed: {
    is_current_users_gif() {
      return this.user != null
        && this.gif != null
        && this.user.id == this.gif.user_id;
    },
  },
  mounted() {
    const app = this;

    // TODO: refactor everything here into methods
    // (Legacy code from before VUE.js)
    function resize() {
      const parent = qsa('.vertical-scroll-parent')[0];
    }
    resize();
    window.addEventListener('resize', resize);

    {
      // Load current user data from script
      app.user = load_script('user').trim();

      if (app.user != '') {
        app.user = JSON.parse(app.user);
      } else {
        app.user = null;
      }
    }

    this.set_player();
    this.load_start_textures();

    const frame = 0;

    let filename = '';

    if (is_example != null) {
      filename = is_example[1] || '';

      if (this.gif == null || this.gif.lang == null) {
        if (filename.match(/_webgl1/)) {
          this.lang = 'shader_webgl1';
        } else {
          this.lang = 'shader_webgl2';
        }
      }
    }

    // Enable codemirror
    const fragment_code = qsa("textarea[name='fragment']")[0];

    app.f_editor = CodeMirror.fromTextArea(fragment_code, {
      lineNumbers: true,
      mode: 'x-shader/x-fragment',
      indentUnit: 4,
      lineWrapping: true,
    });

    // Fetch file and put it in textarea
    if (filename != '') {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `./${filename}`, true);
        xhr.onreadystatechange = function () {
          if (xhr.readyState == 4) {
            const val = xhr.responseText;
            app.f_editor.setValue(val);

            // Change URL to avoid erasing user text
            // when reloading next time.
            window.history.pushState(
              {},
              'ShaderGif',
              window.location.href.replace(/\?.*$/, '', ''),
            );
          }
        };
        xhr.setRequestHeader('Content-type', 'text/plain');
        xhr.send();
      } catch (e) {
        // Do nothing
      }
    }

    let change_timeout = null;

    function change_throttled() {
      // Sleep at least 300 milliseconds
      // to avoid constant compilation when typing,
      // which slows down the thread
      if (change_timeout == null) {
        change_timeout = setTimeout(() => {
          app.code = app.f_editor.getValue();
          app.code_change();
          change_timeout = null;
        }, 300);
      }
    }

    app.f_editor.on('change', () => {
      change_throttled();
    });

    // Init UI

    qsa('.gif-pane')[0].addEventListener('click', (e) => {
      if (e.target.classList.contains('foldable-header')) {
        e.target.parentNode.classList.toggle('foldable-hidden');
      }
    });

    this.$nextTick(function () {
      const app = this;
      this.player.debug_info = true;

      if (this.lang == 'shader_webgl1') {
        this.vertex_shader = vertexShader;
        this.player.set_vertex_shader(this.vertex_shader);

        this.player.set_on_error_listener((error, gl) => {
          app.add_error(error);
        });
      } else {
        this.player.set_on_error_listener((error) => {
          app.add_error(error);
        });
      }

      this.player.set_code(this.code);

      this.update_player();
    });
  },
});

/* Electron specific code */
function init_electron() {
  const { ipcRenderer } = require('electron');
  ipcRenderer.on('code-request', (event, filePath) => {
    ipcRenderer.send('code-return', app.code, filePath);
  });
  ipcRenderer.on('code-set', (event, content) => {
    app.f_editor.setValue(content);
  });

  ipcRenderer.on('shadergif-file-request', (event, filePath) => {
    let file = {
      code: app.code,
      textures: app.textures,
      lang: app.lang,
      width: app.width,
      height: app.height,
      frames: app.frames,
    };
    file = JSON.stringify(file);
    ipcRenderer.send('code-return', file, filePath);
  });

  ipcRenderer.on('shadergif-file-set', (event, file) => {
    file = JSON.parse(file);
    alert('setting!');
    app.code = file.code;
    app.textures.splice(0);
    for (let i = 0; i < file.textures.length; i++) {
      app.textures.push(
        file.textures[i],
      );
      app.player.add_texture(file.textures[i].data);
    }
    app.lang = file.lang;
    app.width = file.width;
    app.height = file.height;
    app.frames = file.frames;

    app.f_editor.setValue(app.code);
  });
}
