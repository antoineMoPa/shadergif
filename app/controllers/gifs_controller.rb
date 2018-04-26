class GifsController < ApplicationController
  before_action :set_gif, only: [:show, :edit]

  def gen_rand_id
    (1..16).map do |i|
      [*'A'..'Z', *'a'..'z', *0..9][ rand(62) ]
    end
  end
  
  def new
    if not user_signed_in?
      raise "You are not logged in"
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
    @gif.lang = params[:lang]
    
    image = params[:image]
    
    image_normal_begin = "data:image/gif;base64,"
    
    if not image.starts_with? image_normal_begin
      raise "Image url encoding error"
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

        # Just a quick check before I code something better
        if tex_param[:data].length > 1048576
          raise "Error: a texture has a size greater that 1.0mb"
        end
        
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
      raise "You are not logged in"
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

    @gif.save()
    
    redirect_to "/shader-editor/drafts/" + @gif.id.to_s
  end
  
  def show
    @gif = Gif.joins(:user)
             .select("gifs.*, users.username")
             .where("is_public = true")
             .find(params[:id])
    
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

  def play
    @gif = Gif.joins(:user)
             .left_joins(:textures)
             .select("gifs.*, users.username")
             .where("is_public = true")
             .find(params[:id])
  end

  def list
    @gifs = Gif
           .order(created_at: :desc)
           .joins(:user)
           .select("gifs.*, users.username")
           .where("is_public = true")
           .limit(params[:take]).offset(params[:skip])
    
    render :json => @gifs
  end
  
  def delete
    # Eventual todo (if ever needed):
    # delete actual files from filesystem
    # or write a file garbage collector 
    
    gif = Gif.find(params[:gif_id])
    
    if gif.user_id != current_user.id
      raise "Attempting to delete another users's gif..."
    end

    Texture.where(gif_id: gif.id).destroy_all
    
    gif.destroy
    
    redirect_to "/user/gifs-and-drafts"
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_gif
      @gif = Gif.joins(:user)
             .select("gifs.*, users.username")
             .find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def gif_params
      params.fetch(:gif, {})
    end
end
