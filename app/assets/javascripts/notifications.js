

function init_notifications_page() {
  const notifications_list = JSON.parse(document.querySelectorAll('#notifications-list')[0].innerHTML);

  new Vue({
    el: '#notifications-page-app',
    data: {
      notifications: notifications_list
    }
  });
}
