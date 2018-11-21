function update_night_mode(is_night_mode) {
  const button = document.querySelectorAll('.night-mode-toggle')[0];

  if (is_night_mode) {
    document.body.classList.add('night-mode');
    button.innerHTML = '<img class="feather-icon" src="/icons/feather/sun.svg">day mode';
    window.localStorage.night_mode = 'true';
  } else {
    document.body.classList.remove('night-mode');
    button.innerHTML = '<img class="feather-icon" src="/icons/feather/moon.svg">night mode';
    window.localStorage.night_mode = 'false';
  }

  if (window.app != undefined) {
    if (app.f_editor !== undefined) {
      if (is_night_mode) {
        app.f_editor.setOption('theme', 'twilight');
      } else {
        app.f_editor.setOption('theme', 'default');
      }
    }
  }
}

function toggle_night_mode() {
  update_night_mode(!JSON.parse(window.localStorage.night_mode || 'false'));
}

window.addEventListener('DOMContentLoaded', () => {
  update_night_mode(JSON.parse(window.localStorage.night_mode || 'false') || false);
});
