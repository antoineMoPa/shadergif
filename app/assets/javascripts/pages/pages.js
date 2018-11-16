/*
  This is a bit of a hack, the profile/search/landing pages use almost
  the same JS and vue app.

  Trust me it would be separate components if I wrote it now.
  Separate it if you want.
 */

window.last_auto_scroll_fetch = null;
window.addEventListener('scroll', () => {
  if (typeof (window.scroll_load_more_element) != 'undefined') {
    const el = window.scroll_load_more_element;

    /*
       Thank you stackoverflow for what's next
       https://stackoverflow.com/questions/487073/
       Check if element is visible after scrolling
    */
    const rect = el.getBoundingClientRect();
    const elemTop = rect.top;
    const elemBottom = rect.bottom;
    const isVisible = elemTop < window.innerHeight && elemBottom >= 0;
    const threshold = 2000;

    if (isVisible) {
      if (new Date().getTime() - window.last_auto_scroll_fetch > threshold) {
        // I don't know why, but I prefer some delays here
        setTimeout(main_app.load_more, 1000);
        setTimeout(() => {
          el.innerHTML = 'loading more gifs...';
        }, 300);
        window.last_auto_scroll_fetch = new Date().getTime();
      }
    }
  }
});

window.onload = function () {
  const has_app = false;
  let is_search = false;
  let is_profile = false;

  let el = document.getElementById('main-app');

  if (el == null) {
    el = document.getElementById('search-app');
    if (el != null) {
      is_search = true;
    }
  }

  if (el == null) {
    el = document.getElementById('profile-app');
    is_profile = true;
  }

  if (el != null) {
    const chunk_size = 8;

    const main_app = new Vue({
      el,
      data: {
        gifs: [],
        mosaic_gifs: [],
        initial_qty: -1,
        current_offset: -1,
        has_more: true,
        column_1: '',
        column_2: ''
      },
      updated() {
        var load_more_button = this.$el.querySelectorAll('.load-more-button')[0];
        window.scroll_load_more_element = load_more_button;

        this.column_1 = document.getElementById('home-column-1').innerHTML;
        this.column_2 = document.getElementById('home-column-2').innerHTML;
      },
      methods: {
        receive_more(req) {
          const load_more_button = document.querySelectorAll('.load-more-button')[0];

          // Exctract data
          const resp = JSON.parse(req.responseText);

          // Reached the end?
          if (resp.length == 0) {
            this.has_more = false;
          }

          // Increase quantity
          this.current_offset += resp.length;

          if (window.innerWidth > 768) {
            // Desktop-tablet: just add gifs
            // Add gifs
            this.gifs = this.gifs.concat(resp);
          } else {
            // Mobile: remove gifs, scroll to top, add new gifs
            this.gifs.splice(0);
            window.scrollTo(0, 0);
            // Let time for user to see that new gifs are loaded
            // But dont put a useless GPU consuming transition
            setTimeout(() => {
              this.gifs = this.gifs.concat(resp);
            }, 300);
          }

          // Go back to initial text
          load_more_button.innerHTML = 'view more';
        },
        load_more() {
          const app = this;
          const req = new XMLHttpRequest();

          if (app.initial_qty == -1) {
            app.initial_qty = app.gifs.length;
            app.current_offset = app.initial_qty;
          }

          const to_skip = app.current_offset + chunk_size;
          req.addEventListener('load', () => {
            app.receive_more(req);
          });

          if (is_search) {
            const url = new URL(window.location.href);
            const keyword = url.searchParams.get('search');
            req.open('GET', `/search.json?search=${keyword}&take=${chunk_size}&skip=${app.current_offset}`);
          } else if (is_profile) {
            const url_splitted = window.location.href.split('/');
            const username = url_splitted[url_splitted.length - 1];
            req.open('GET', `/profile.json?username=${username}&take=${chunk_size}&skip=${app.current_offset}`);
          } else {
            req.open('GET', `/gifs/list?take=${chunk_size}&skip=${app.current_offset}`);
          }

          req.send();
        }
      }
    });

    window.main_app = main_app;

    var gifs = JSON.parse(
      document.getElementById('main-gifs-json').innerHTML
    );

    main_app.gifs = gifs;

    const mosaic_el = document.getElementById('mosaic-gifs-json');

    if (typeof (mosaic_el) !== 'undefined' && mosaic_el != null) {
      const mosaic_gifs = JSON.parse(
        mosaic_el.innerHTML
      );

      main_app.mosaic_gifs = mosaic_gifs;
    }
  }

  if (document.getElementById('single-gif-app') != null) {
    const single_gif_app = new Vue({
      el: '#single-gif-app',
      data: {
        gifs: []
      }
    });

    var gifs = JSON.parse(
      document.getElementById('single-gif-json').innerHTML
    );

    single_gif_app.gifs = gifs;


    single_gif_app.$nextTick(() => {
      single_gif_app.$children[0].$children[0].show_code();
    });
  }

  if (document.getElementById('gifs-and-drafts-app') != null) {
    const gifs_and_drafts_app = new Vue({
      el: '#gifs-and-drafts-app',
      data: {
        data: []
      }
    });

    const data = JSON.parse(
      document.getElementById('gifs-and-drafts-json').innerHTML
    );

    gifs_and_drafts_app.data = data;
  }
};
