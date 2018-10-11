//= require lib/umarkdown.js

Vue.component(
  'image-box',
  {
    template: '#image-box-template',
    props: ['gif'],
    data() {
      return {
        show_video: false,
        code_is_visible: false,
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
      },
    },
    watch: {
      show_video() {
        if (this.show_video) {
          this.play();
        }
      },
    },
    mounted() {
      const comp = this;
      const video = this.$el.querySelectorAll('video')[0];

      video.onShadergifPause = function () {
        comp.show_video = false;
      };

      this.$nextTick(function () {
        /* run umarkdown on gif description */
        umarkdown(
          this.$el.querySelectorAll('.gif-description')[0],
        );
      });
    },
  },
);

Vue.component(
  'image-box-list',
  {
    template: '#image-box-list-template',
    props: ['gifs'],
    data() {
      return {

      };
    },
  },
);
