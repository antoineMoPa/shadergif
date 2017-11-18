
class GifController < ApplicationController
  def new
    if not user_signed_in?
      raise "You are not logged in"
    end
      @gif = Gif.new
      @gif.user_id = current_user.id

      # Generate random id
      rand_id = (1..16).map do |i|
        [*'A'..'Z', *'a'..'z', *0..9][ rand(62) ]
      end
      
      rand_id = rand_id.join
      filename = rand_id + Time.now.strftime("%Y-%m-%d-%Hh%Mm") + ".gif"
      
      @gif.title = params[:title]
      @gif.description = params[:description]
      @gif.code = params[:code]
      
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
      
      Thread.new do
        @gif.gen_video_and_thumb
      end
      
      redirect_to "/shader-editor/"
  end

  def list
    @gifs = Gif
           .order(created_at: :desc)
           .joins(:user)
           .select("gifs.*, users.username")
           .take(10)
    
    render :json => @gifs
  end
end
