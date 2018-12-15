Vue.component(
  'image-box-list',
  {
    template: `
<div class="image-box-list">
    <image-box
        v-if="!light"
        v-for="gif in gifs"
        key="gif"
        v-bind:gif="gif"
        ></image-box>
    <image-box-light
        v-if="light"
        v-for="gif in gifs"
        key="gif"
        v-bind:gif="gif"
        ></image-box-light>
</div>
    `,
    props: ['gifs', 'light'],
    data() {
      return {

      };
    }
  }
);
