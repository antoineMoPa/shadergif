class UserController < ApplicationController
  def show
    @user = User.where(username: params[:username]).first()

    if @user.nil?
      return redirect_to "/"
    end
    
    @gifs = @user.gifs
            .order(created_at: :desc)
            .joins(:user)
            .select("gifs.*, users.username")
            .where("is_public = true")
            .take(10)
            .to_json
  end
  
  def gifs_and_drafts
    if !user_signed_in?
      return redirect_to "/"
    end
    
    @user = User.find(current_user.id)

    @data = {}
    
    @data["drafts"] = @user.gifs
                        .order(created_at: :desc)
                        .joins(:user)
                        .select("gifs.*, users.username")
                        .where("is_public = false")
                        .take(300)

    @data["gifs"] = @user.gifs
                        .order(created_at: :desc)
                        .joins(:user)
                        .select("gifs.*, users.username")
                        .where("is_public = true")
                        .take(300)
    
    @data = @data.to_json
  end
    
end
