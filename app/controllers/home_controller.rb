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
           .select("gifs.*, users.username, users.profile_picture")
           .where("is_public = true")
           .take(15)
           .to_json
    
  end

  def search
    ActiveSupport.escape_html_entities_in_json = true
    search = params[:search]
    
    if params.has_key?(:take)
      take = params[:take]
    else
      take = 5
    end

    if params.has_key?(:skip)
      skip = params[:skip]
    else
      skip = 0
    end
    
    
    # Big homepage gifs
    @gifs = Gif
           .order(created_at: :desc)
           .joins(:user)
           .select("gifs.*, users.username, users.profile_picture")
           .where("is_public = true ")
           .where('users.username LIKE :search OR ' +
                  'title LIKE :search ' +
                  'OR description LIKE :search', search: "%#{search}%")
           .limit(take).offset(skip)
           .to_json

    if request.path_parameters[:format] == 'json'
      render :json => @gifs
    end
  end
  
end
