Vue.component(
  'image-box-light',
  {
    template: `
<div class="image-box image-box-light content has-text-centered" v-bind:key="gif.id">
    <div>
        <div class="title-box">
            <strong class="subtitle gif-subtitle">
                <a v-bind:href="'/gifs/' + gif.id">
                    {{ gif.title }}
                </a>
            </strong>
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
            <video loop v-bind:poster="'/gifs/generated/' + gif.image_filename + '-preview.jpg'" v-on:click="play" preload="none" height="300px">
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
        <p>By <a v-bind:href="'/user/' + gif.username">{{ gif.username }}</a></p>
        <div>
            <a v-bind:href="'/gifs/' + gif.id">
                {{ (new Date(gif.created_at)).toDateString() }}
            </a>
        </div>
    </div>
    <a v-bind:href="'/editor/' + gif.id + '/edit'">
        <button class="button">
            <img class="feather-icon" src="/icons/feather/play.svg">
            Launch in editor
        </button>
    </a>
    <div class="clearfix"></div>
    <br>
    <img class="feather-icon" src="/icons/feather/eye.svg"> {{ gif.views }} views
    <span class="like-button" v-on:click="toggle_like(gif.id)" v-if="gif.current_user_likes">
        <img class=" feather-icon" src="/icons/feather/heart-full.svg" > {{ gif.likes }} likes
    </span>
    <span class="like-button" v-on:click="toggle_like(gif.id)" v-else>
        <img class=" feather-icon" src="/icons/feather/heart.svg"> {{ gif.likes }} likes
    </span>
</div>`,
    props: ['gif'],
    data() {
      return {
        show_video: false
      };
    },
    methods: {
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
      },
      toggle_like(gif_id) {
      let app = this;
        fetch("/gifs/toggle_like/" + gif_id).then((resp) => {
        resp.json().then((data) => {
        if(data.error){
          return;
        }
        let like = data.like == "true";
        app.gif.current_user_likes = like;
        if(like) {
          app.gif.likes++;
        } else {
          app.gif.likes--;
        }
      });
    });
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
    }
  }
);
