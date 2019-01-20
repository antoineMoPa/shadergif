Vue.component(
  'image-info',
  {
    template: `
<div class='image-info'>
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
      };
    },
    methods: {
      toggle_like(gif_id) {
        let app = this;
        let token = document.querySelectorAll("meta[name=csrf-token]")[0].content;
        let data = {
          method: "POST", 
          headers: {
            'X-CSRF-Token': token
          }
        };
        
        fetch("/gifs/toggle_like/" + gif_id, data).then((resp) => {
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
  }
);
