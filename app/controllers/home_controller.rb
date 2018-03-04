class HomeController < ApplicationController
  def index
    ActiveSupport.escape_html_entities_in_json = true

    # Small preview gifs
    @mosaic_gifs =
      Gif
        .order(created_at: :desc)
        .select("gifs.title, gifs.image_filename, gifs.id")
        .take(30)
        .to_json

    # Big homepage gifs
    @gifs = Gif
           .order(created_at: :desc)
           .joins(:user)
           .select("gifs.*, users.username")
           .take(5)
           .to_json
    
  end
end
