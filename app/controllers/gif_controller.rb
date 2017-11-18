
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
      
      # Generate thumbnail
      `timeout 10 convert public/gifs/#{filename} +dither -colors 8 -resize 45x45 public/gifs/generated/#{filename}-small.gif`
      # Extract all frames
      `timeout 10 convert public/gifs/#{filename} public/gifs/generated/#{filename}-temp-%04d.png`
      # Create gif video
      `timeout 10 avconv -y -i public/gifs/generated/#{filename}-temp-%04d.png public/gifs/generated/#{filename}-vid.mp4`
      
      # Save first frame as preview
      `mv public/gifs/generated/#{filename}-temp-0001.png public/gifs/generated/#{filename}-preview.png`
      # remove generated pngs
      `rm public/gifs/generated/#{filename}-temp-*.png`
      
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
