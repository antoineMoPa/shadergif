//= require vertex_shaders.js
//= require lib/base.js

Vue.component(
  'shader-player',
  {
    template: `
<div v-bind:class="'shader-player ' + (fullscreen? 'shader-player-fullscreen' :'')">
    <div class="player-wrapper"
         v-if="shader_player != null"
         v-bind:style="player_size_style">
        
        <div class="fullscreen-button"
             v-on:click="fullscreen = !fullscreen">
            <span v-if="!fullscreen">[ full screen ]</span>
            <span v-else>[ close ]</span>
            
        </div>
        <div class="player-container">
        </div>
    </div>
    <p class="text-center" v-if="debug_info && shader_player">
        time: {{ shader_player.time.toFixed(4) }}, mouse: {{ shader_player.mouse[0].toFixed(4) }}, {{ shader_player.mouse[1].toFixed(4) }}
    </p>
</div>`,
    props: ['gif'],
    data() {
      return {
        vertex_shader: '',
        shader_player: null,
        fullscreen: false,
        debug_info: false,
        size_before_fullscreen: null,
        frames: 10
      };
    },
    watch: {
      fullscreen(fullscreen) {
        // Prevent fullscreen if webgl2 shader is not supported
        if (this.gif.lang == 'shader_webgl2') {
          if (!this.shader_player.native_webgl2_supported) {
            this.fullscreen = false;
            return;
          }
        }

        if (fullscreen == true) {
          // Switch to fullscreen
          this.size_before_fullscreen = [
            this.shader_player.width,
            this.shader_player.height
          ];

          this.shader_player.width = window.innerWidth;
          this.shader_player.height = window.innerHeight;

          // Hardcode fullscreen helper
          var style = document.createElement('style');
          style.innerHTML = '.container{position:static;}';
          style.innerHTML += 'html{overflow:hidden;}';
          document.body.appendChild(style);
          window.shader_player_hardcoded_style = style;

          this.shader_player.animate();
        } else {
          this.shader_player.width =            this.size_before_fullscreen[0];
          this.shader_player.height =            this.size_before_fullscreen[1];

          this.shader_player.animate();

          // Remove hardcoded style
          var style = window.shader_player_hardcoded_style;
          style.parentNode.removeChild(style);
        }
      }
    },
    computed: {
      player_size_style() {
        return `width:${this.shader_player.width}px;`
          + `height:${this.shader_player.height}px`;
      }
    },
    mounted() {
      const app = this;

      let vertex_code = '';

      if (app.gif.lang == '' || app.gif.lang == null || app.gif.lang == 'shader_webgl1') {
        this.shader_player = new ShaderPlayerWebGL1();
        vertex_code = vertexShader;
      } else if (app.gif.lang == 'shader_webgl2') {
        this.shader_player = new ShaderPlayerWebGL2();
        vertex_code = vertexShaderWebGL2;
      } else {
        window.location.href = `/editor/${app.gif.id}/edit`;
        return;
      }

      this.$nextTick(function () {
        const container = this.$el.querySelectorAll('.player-container')[0];
        this.vertex_shader = vertex_code;

        this.shader_player.set_container(container);

        if (this.gif.lang == 'shader_webgl2') {
          if (!this.shader_player.native_webgl2_supported) {
            alert(
              'Sorry, your browser and/or computer does not support WebGL2.\n'
              + 'You can still try viewing WebGL1 shaders.'
            );
          }
        }

        function add_image(texture, index) {
          // 'Hardcoded' xhr
          const xhr = new XMLHttpRequest();
          xhr.open('GET', `/textures/${texture.filename}`);
          xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
              if (xhr.status == 200) {
                app.shader_player.add_texture(xhr.responseText);
              }
            }
          };
          xhr.send();
        }

        if (typeof (app.gif.textures) !== 'undefined') {
          for (let i = 0; i < app.gif.textures.length; i++) {
            add_image(app.gif.textures[i], i);
          }
        }

        this.shader_player.frames = app.gif.frames;
        this.shader_player.set_vertex_shader(app.vertex_shader);
        this.shader_player.set_code(app.gif.code);

        window.addEventListener('resize', () => {
          if (app.fullscreen) {
            app.shader_player.set_width(window.innerWidth);
            app.shader_player.set_height(window.innerHeight);
          }
        });
      });
    }
  }
);
