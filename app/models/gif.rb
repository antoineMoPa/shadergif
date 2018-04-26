class Gif < ApplicationRecord
  belongs_to :user
  has_many :comments
  has_many :textures

  def gen_video_and_thumb
    filename = image_filename
    # Generate thumbnail
    `timeout 10 convert public/gifs/#{filename} +dither -colors 8 -resize 45x45 public/gifs/generated/#{filename}-small.gif`
    # Extract all frames
    # -scene 1: start at 1 (better for avconv)
    `timeout 10 convert public/gifs/#{filename} -scene 1 public/gifs/generated/#{filename}-temp-%04d.png`
    # Create gif video
    `avconv -y -r 10 -i public/gifs/generated/#{filename}-temp-%04d.png -qscale:v 4 -r 10 public/gifs/generated/#{filename}-vid.mp4`
    `avconv -y -r 10 -i public/gifs/generated/#{filename}-temp-%04d.png -qscale:v 4 -r 10 public/gifs/generated/#{filename}-vid.ogv`
    `avconv -y -r 10 -i public/gifs/generated/#{filename}-temp-%04d.png -c:v libvpx -qmin 10 -qmax 50 -b:v 750K -r 10 public/gifs/generated/#{filename}-vid.webm`
    
    # Save first frame as preview
    `mv public/gifs/generated/#{filename}-temp-0001.png public/gifs/generated/#{filename}-preview.png`
    # Create jpeg preview (smaller, uglier)
    `convert public/gifs/generated/#{filename}-preview.png -quality 50 public/gifs/generated/#{filename}-preview.jpg`
    
    # remove generated pngs
    `rm public/gifs/generated/#{filename}-temp-*.png`
  end
  
end
