class UserController < ApplicationController

  def gen_rand_id
    (1..16).map do |i|
      [*'A'..'Z', *'a'..'z', *0..9][ rand(45) ]
    end
  end
  
  def update_profile_pic
    if !user_signed_in?
      return redirect_to "/"
    end
    
    @user = User.find(current_user.id)

    new_filename = gen_rand_id.join + ".png"

    @user.profile_picture = new_filename

    url_encoded_image = params[:profile_picture]
    image = Base64.decode64(url_encoded_image['data:image/png;base64,'.length .. -1])
    
    if image.size > (1024 * 128)
      @error = "Image too big!"
      @error_long = "Error: The picture has a size greater than 131kb. "
      @error_long += "Try uploading a smaller image."
      
      render 'error'
      return
    end

    File.open("public/profile_pictures/" + new_filename, 'wb') do|f|
      f.write(image)
    end
    
    @user.save()
    
    flash[:notice] = "Profile picture changed!"

    return redirect_to "/users/edit"
  end
  
  def show
    @user = User.where(username: params[:username]).first()

    if @user.nil?
      return redirect_to "/"
    end
    
    @gifs = @user.gifs
            .order(created_at: :desc)
            .joins(:user)
            .select("gifs.*, users.username, users.profile_picture")
            .where("is_public = true")
            .take(10)
            .to_json
  end

  def notifications
    if !user_signed_in?
      return redirect_to "/"
    end
    
    @user = User.find(current_user.id)

    @notifications = Notification
                     .where(user_id: current_user.id)
                     .order(created_at: :desc)
                     .take(1000)
                     .to_json

    Notification.where(user_id: current_user.id).update(is_read: true)
                     
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
                        .select("gifs.*, users.username, users.profile_picture")
                        .where("is_public = false")
                        .take(300)

    @data["gifs"] = @user.gifs
                        .order(created_at: :desc)
                        .joins(:user)
                        .select("gifs.*, users.username, users.profile_picture")
                        .where("is_public = true")
                        .take(300)
    
    @data = @data.to_json
  end
    
end
