//= require lib/umarkdown.js

Vue.component(
  'image-box',
  {
    template: `
<div class="image-box content has-text-centered">
    <div>
        <div class="title-box">
            <strong class="subtitle gif-subtitle">
                <a v-bind:href="'/gifs/' + gif.id">
                    {{ gif.title }}
                </a>
            </strong>
            <span class="profile-box">
                <a v-bind:href="'/user/' + gif.username" class="profile-username">
                    {{ gif.username }}
                    <img v-if="gif.profile_picture"
                        class="profile-picture"
                        v-bind:src="'/profile_pictures/' + gif.profile_picture">
                </a>
            </span>
        </div>
        <div v-on:click="show_video = true"
             class="image-container">
            <transition name="view-gif">
                <div
                    v-if="!show_video"
                    class="view-gif-button">
                    <div class="view-gif-button-inside">
                        GIF
                    </div>
                </div>
            </transition>
            <video loop v-bind:poster="'/gifs/generated/' + gif.image_filename + '-preview.jpg'" v-on:click="play" preload="none">
                <source
                    v-bind:src="'/gifs/generated/' + gif.image_filename + '-vid.webm'"
                    type="video/webm">
                    <source
                        v-bind:src="'/gifs/generated/' + gif.image_filename + '-vid.mp4'"
                        type="video/mp4">
                        <source
                            v-bind:src="'/gifs/generated/' + gif.image_filename + '-vid.ogv'"
                            type="video/ogg">
            </video>
        </div>
        <br>
        <div class="clearfix"></div>
        <pre class="has-text-left gif-description">{{ gif.description }}</pre>
        <div>
            Uploaded on
            <a v-bind:href="'/gifs/' + gif.id">
                {{ (new Date(gif.created_at)).toDateString() }}
            </a>
        </div>
    </div>
    
    <div>
        <p>
            <a v-bind:href="'/gifs/' + gif.image_filename">Raw gif (gif)</a> - 
            <a v-bind:href="'/gifs/generated/' + gif.image_filename + '-vid.mp4'">Video (mp4)</a> -
            <a v-bind:href="'/gifs/generated/' + gif.image_filename + '-vid.ogv'">Video (ogv)</a> - 
            <a v-bind:href="'/gifs/generated/' + gif.image_filename + '-preview.png'">Preview (png)</a>
            <br>
            language: {{ gif.lang }}
            <br><br>
        </p>
    </div>
    <button
        v-if="!code_is_visible"
        v-on:click="show_code"
        class="button"
        >
        <img class="feather-icon" src="/icons/feather/align-left.svg">
        View code
    </button>
    <a v-bind:href="'/editor/' + gif.id + '/edit'">
        <button class="button">
            <img class="feather-icon" src="/icons/feather/code.svg">
            Use in editor
        </button>
    </a>
    <a v-bind:href="'/gifs/' + gif.id + '/play'"
       v-if="gif.lang != 'mathjs'"
       class="button">
        <img class="feather-icon" src="/icons/feather/play.svg">
        Run Shader
    </a>
    <!--
        Note the ugly tag closing design to avoid whitespace
        before and after the code in the <pre>
      -->
    <pre
        v-if="code_is_visible"
        class="image-code has-text-left"
        ><button class="button close-image-code"
                 v-on:click="code_is_visible = !code_is_visible"
                 >
            <img class="feather-icon" src="/icons/feather/x.svg">
            Close
        </button
            ><code class="language-glsl" data-manual
                   >{{ gif.code }}</code></pre>
    
    <br>
    <div class="gif-comments" v-if="gif.comments != undefined">
        <div class="has-text-left" v-if="gif.comments.length > 0">
            <strong>Comments</strong>
        </div>
        <div class="comment" v-for="comment in gif.comments">
            <div class="comment-username has-text-left">
                <a v-bind:href="'/user/'+comment.user.username">{{ comment.user.username }}</a>&nbsp;:
                <span class="comment-date">
                    ({{ new Date(comment.created_at).toLocaleString() }})
                </span>
            </div>
            <div class="comment-content has-text-left">
                {{ comment.content }}
            </div>
        </div>
        <br>
        <div class="comment-form"></div>
    </div>
    <br>
</div>`,
    props: ['gif'],
    data() {
      return {
        show_video: false,
        code_is_visible: false
      };
    },
    methods: {
      show_code() {
        const component = this;
        this.code_is_visible = true;
        Vue.nextTick(() => {
          const el = component.$el
            .querySelectorAll('.image-code code')[0];

          Prism.highlightElement(el, false, () => {
            /* bulma messes up .number */
            const numbers = el.querySelectorAll('.number');

            // Replace .number with something else random
            numbers.forEach((num) => {
              num.classList.remove('number');
              num.classList.add('property');
            });
          });
        });
      },
      play() {
        // stop other videos
        const videos = document.querySelectorAll('video');
        // Start this one
        const video = this.$el.querySelectorAll('video')[0];

        video.isCurrent = true;

        videos.forEach((vid) => {
          if (vid.isCurrent) {
            // Don't pause ourselves
            return;
          }
          vid.pause();

          if (typeof (vid.onShadergifPause) !== 'undefined') {
            vid.onShadergifPause();
          }
        });

        video.isCurrent = false;

        video.play();
      }
    },
    watch: {
      show_video() {
        if (this.show_video) {
          this.play();
        }
      }
    },
    mounted() {
      const comp = this;
      const video = this.$el.querySelectorAll('video')[0];

      video.onShadergifPause = function () {
        comp.show_video = false;
      };

      const formTemplate = document.querySelectorAll('.comment-form-template')[0];

      if (formTemplate != undefined) {
        const form = this.$el.querySelectorAll('.comment-form')[0];
        form.innerHTML = formTemplate.innerHTML;
        const input = form.querySelectorAll('input[name=gif_id]')[0];
        if (input != undefined) {
          input.value = this.gif.id;
        }
      }

      this.$nextTick(function () {
        /* run umarkdown on gif description */
        umarkdown(
          this.$el.querySelectorAll('.gif-description')[0]
        );
      });
    }
  }
);
