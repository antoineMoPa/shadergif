class GifsController < ApplicationController
  before_action :set_gif, only: [:show, :edit]

  def gen_rand_id
    (1..16).map do |i|
      [*'A'..'Z', *'a'..'z', *0..9][ rand(62) ]
    end
  end

  def create
    new
  end
  
  def toggle_like()
    if current_user.nil?
      render :json => {error:"logged out"}
    else
      user_like = UserLike.where(user_id: current_user.id, gif_id: params[:gif_id]).first
      if not user_like.nil?
        user_like.destroy
        
        render :json => {like:"false"}
      else
        user_like = UserLike.new
        user_like.gif_id = params[:gif_id]
        user_like.user_id = current_user.id
        user_like.save
        render :json => {like:"true"}
        notify_like(params[:gif_id])
      end
      
    end
  end

  def notify_like(gif_id)
    gif = Gif.find(gif_id)
    if gif.user_id.nil?
      return
    end
    gif_poster = User.find(gif.user_id)
    liker = current_user.username
    
    @notification = Notification.new
    @notification.user_id = gif_poster.id
    @notification.gif_id = gif.id
    @notification.text = "%s liked your link{gif}." % liker
    @notification.link = "/gifs/" + gif.id.to_s
    @notification.is_read = false
    @notification.save()
  end
  
  def new
    if not user_signed_in?
      @error = "You are not logged in!"
      @error_long = "Please create an account or sign in! "
      render 'error'
      return
    end

    # first verify textures size
    if not params[:textures].nil?
      params[:textures].each do |tex_param|
        # Just a quick check before I code something better
        if tex_param[:data].length > 1048576
          @error = "Texture too big!"
          @error_long = "Error: A texture has a size greater than 1.0mb. "
          @error_long += "Try uploading smaller textures."
          render 'error'
          return
        end
      end
    end
    
    @gif = Gif.new
    @gif.user_id = current_user.id

    @gif.is_public = true
    
    # Generate random id
    rand_id = gen_rand_id
    
    rand_id = rand_id.join
    filename = rand_id + Time.now.strftime("%Y-%m-%d-%Hh%Mm") + ".gif"
    
    @gif.title = params[:title]
    @gif.description = params[:description]
    @gif.code = params[:code]
    @gif.frames = params[:frames]
    @gif.fps = params[:fps]
    @gif.lang = params[:lang]
    
    image = params[:image]
    
    image_normal_begin = "data:image/gif;base64,"
    
    if not image.starts_with? image_normal_begin
      @error = "Image url encoding error"
      @error_long = "There was a weird problem while encoding your gif. You could try again with a smaller gif or a different browser."
      render 'error'
      return
    end
    
    # delete first part
    image = image[image_normal_begin.length..image.length]
    
    File.open("public/gifs/" + filename, 'wb') do|f|
      f.write(Base64.decode64(image))
    end
    
    @gif.image_filename = filename
    
    @gif.save()
    
    # Delete draft if it was a draft
    if not params[:draft_id].nil?
      draft = Gif.find(params[:draft_id])
      if !draft.nil? and draft.user_id == current_user.id and !draft.is_public
        draft.destroy()
      end
    end

    # Upload texture
    if not params[:textures].nil?
      params[:textures].each do |tex_param|
        rand_id = gen_rand_id.join
        filename = rand_id + Time.now.strftime("%Y-%m-%d-%Hh%Mm") + ".texture"
        
        texture = Texture.new
        texture.name = tex_param[:name]
        texture.gif_id = @gif.id
        texture.filename = filename
        texture.save
        
        File.open("public/textures/" + filename, 'wb') do|f|
          f.write(tex_param[:data])
        end
      end
    end

    @gif.gen_video_and_thumb
    
    redirect_to "/gifs/" + @gif.id.to_s
  end

  def new_draft
    if not user_signed_in?
      @error = "You are not logged in!"
      @error_long = "Please create an account or sign in! "
      @error_long += "Maybe your session expired while you were coding."
      render 'error'
      return
    end
    
    @gif = Gif.new
    @gif.user_id = current_user.id

    @gif.is_public = false
    
    # Generate random id
    rand_id = (1..16).map do |i|
      [*'A'..'Z', *'a'..'z', *0..9][ rand(62) ]
    end
    
    @gif.title = params[:title]
    @gif.code = params[:code]
    @gif.lang = params[:lang]
    @gif.width = params[:width]
    @gif.height = params[:height]
    @gif.frames = params[:frames]
    @gif.fps = params[:fps]
    
    @gif.save()
    
    redirect_to "/editor/drafts/" + @gif.id.to_s
  end
  
  def show
    @gif = Gif.joins(:user)
             .select("gifs.*, users.username, users.profile_picture")
             .with_likes(current_user)
             .where("is_public = true")
             .find(params[:id])
    
    @gif.increment!(:views)

    @gif_json = @gif.to_json(
      :include =>
	  {
        :comments => {
          :include => {
            :user => {
              only: :username
            }
          }
        }
      }
    )
    
  end

  # When saving stuff in editor
  def save
    if not user_signed_in?
      @error = "You are not logged in!"
      @error_long = "Please create an account or sign in! "
      @error_long += "Maybe your session expired while you were coding."
      render 'error'
      return
    end
    
    gif = Gif.find(params[:id])
    
    if gif.nil? or gif.user_id != current_user.id
      @error = "This gif is not available!"
      @error_long = "Sorry!"
      render 'error'
      return
    end
    
    gif.title = params[:title]
    gif.description = params[:description]
    gif.code = params[:code]
    gif.frames = params[:frames]
    gif.fps = params[:fps]
    gif.width = params[:width]
    gif.height = params[:height]
    gif.lang = params[:lang]
    
    gif.save()
    
    redirect_to "/editor/" + gif.id.to_s + "/edit"
  end
    
  
  def play
    @gif = Gif.joins(:user)
             .left_joins(:textures)
             .select("gifs.*, users.username, users.profile_picture")
             .where("is_public = true")
             .find(params[:id])
    @gif.increment!(:views)
  end

  def list
    take = params[:take].to_i

    # Just a quick limit to maybe prevent ddos
    if(take > 30)
      take = 30
    end
    
    @gifs = Gif
           .order(created_at: :desc)
           .joins(:user)
           .select("gifs.*, users.username, users.profile_picture")
           .where("is_public = true")
           .limit(take).offset(params[:skip])
    
    render :json => @gifs
  end
  
  def delete
    # Eventual todo (if ever needed):
    # delete actual files from filesystem
    # or write a file garbage collector 
    
    gif = Gif.find(params[:gif_id])
    
    if gif.user_id != current_user.id
      @error = "Yo that's not your gif, you can't delete it"
      @error_long = "Sorry!"
      render 'error'
      return
    end

    Texture.where(gif_id: gif.id).destroy_all
    
    gif.destroy
    
    redirect_to "/user/gifs-and-drafts"
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_gif
      @gif = Gif.joins(:user)
             .select("gifs.*, users.username, users.profile_picture")
             .find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def gif_params
      params.fetch(:gif, {})
    end
end
