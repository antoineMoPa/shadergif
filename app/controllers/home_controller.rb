class HomeController < ApplicationController
  def index
    ActiveSupport.escape_html_entities_in_json = true
    
    @gifs = Gif
           .order(created_at: :desc)
           .joins(:user)
           .select("gifs.*, users.username")
           .take(8)
           .to_json
    
  end
end
