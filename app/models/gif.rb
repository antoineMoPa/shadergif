class Gif < ApplicationRecord
  belongs_to :user
  has_many :comments
  has_many :textures
  has_many :user_likes

  def self.with_likes(current_user)
    if current_user.nil?
      select(
        "(select count(user_likes.user_id) as likes from user_likes where user_likes.gif_id = gifs.id) as likes")
    else
      id = current_user.id.to_i
      select(
        "(select count(user_likes.user_id) as likes from user_likes where user_likes.gif_id = gifs.id) as likes,
         (select count(user_likes.user_id) as likes from user_likes where user_likes.gif_id = gifs.id and user_id = " + id.to_s + ") as current_user_likes")
    end
  end

  def gen_video_and_thumb
    filename = image_filename
    # Generate thumbnail
    `timeout 10 convert public/gifs/#{filename} +dither -colors 8 -resize 45x45 public/gifs/generated/#{filename}-small.gif`
    # Extract all frames
    # -scene 1: start at 1 (better for ffmpeg)
    `timeout 10 convert public/gifs/#{filename} -scene 1 public/gifs/generated/#{filename}-temp-%04d.png`
    # Create gif video
    `ffmpeg -y -framerate 10 -i public/gifs/generated/#{filename}-temp-%04d.png -qscale:v 4 -framerate 10 public/gifs/generated/#{filename}-vid.mp4`
    `ffmpeg -y -framerate 10 -i public/gifs/generated/#{filename}-temp-%04d.png -qscale:v 4 -framerate 10 public/gifs/generated/#{filename}-vid.ogv`
    `ffmpeg -y -framerate 10 -i public/gifs/generated/#{filename}-temp-%04d.png -c:v libvpx -qmin 10 -qmax 50 -b:v 750K -framerate 10 public/gifs/generated/#{filename}-vid.webm`

    # Save first frame as preview
    `mv public/gifs/generated/#{filename}-temp-0001.png public/gifs/generated/#{filename}-preview.png`
    # Create jpeg preview (smaller, uglier)
    `convert public/gifs/generated/#{filename}-preview.png -quality 50 public/gifs/generated/#{filename}-preview.jpg`

    # remove generated pngs
    `rm public/gifs/generated/#{filename}-temp-*.png`
  end
end
