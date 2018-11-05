Vue.component(
  'image-box-list',
  {
    template: `
<div class="image-box-list">
    <image-box
        v-for="gif in gifs"
        key="gif"
        v-bind:gif="gif"
        ></image-box>
</div>
    `,
    props: ['gifs'],
    data() {
      return {

      };
    },
  },
);
