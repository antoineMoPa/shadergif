class UserController < ApplicationController
  def show
    @user = User.where(username: params[:username]).first()

    @gifs = @user.gifs
            .order(created_at: :desc)
            .joins(:user)
            .select("gifs.*, users.username")
            .take(10)
            .to_json
  end
end
