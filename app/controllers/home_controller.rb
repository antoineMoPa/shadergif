class HomeController < ApplicationController
  def index
    @gifs = Gif.order(created_at: :desc).take(10)
  end
end
