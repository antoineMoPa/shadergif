class HomeController < ApplicationController
  def index
    ActiveSupport.escape_html_entities_in_json = true

    # Small preview gifs
    @mosaic_gifs =
      Gif
        .order(created_at: :desc)
        .select("gifs.title, gifs.image_filename, gifs.id")
        .where("is_public = true")
        .take(30)
        .to_json

    # Big homepage gifs
    @gifs = Gif
           .order(created_at: :desc)
           .joins(:user)
           .select("gifs.*, users.username")
           .where("is_public = true")
           .take(5)
           .to_json
    
  end

  def search
    ActiveSupport.escape_html_entities_in_json = true
    search = params[:search]
    
    # Big homepage gifs
    @gifs = Gif
           .order(created_at: :desc)
           .joins(:user)
           .select("gifs.*, users.username")
           .where("is_public = true ")
           .where('users.username LIKE :search OR ' +
                  'title LIKE :search ' +
                  'OR description LIKE :search', search: "%#{search}%")
           .take(5)
           .to_json
    
  end
  
end
