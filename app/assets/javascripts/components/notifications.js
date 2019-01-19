Vue.component(
  'notifications',
  {
    template: `
      <div class="notifications">
        <div v-for="notification in notifications"
           v-bind:class="((!notification.is_read)?'is-unread':'') + ' notification'">
          <span class="notification-text" v-html="notif_html(notification)">
          </span>
          <a v-bind:href="notification.link" class="notification-link notification-date">
            {{ new Date(notification.created_at).toLocaleString() }}
          </a>
        </div>
      </div>
      `,
    props: ['notifications'],
    data() {
      return {

      };
    },
    methods: {
      notif_html(notification) {
        const text = notification.text;
        return text.replace(/link\{(.*)\}/, (string, title) => `<a href='${notification.link}'>${title}</a>`);
      }
    }
  }
);
