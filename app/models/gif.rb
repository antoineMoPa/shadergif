class Gif < ApplicationRecord
  belongs_to :user

  def gen_video_and_thumb
    filename = image_filename
    # Generate thumbnail
    `timeout 10 convert public/gifs/#{filename} +dither -colors 8 -resize 45x45 public/gifs/generated/#{filename}-small.gif`
    # Extract all frames
    `timeout 10 convert public/gifs/#{filename} public/gifs/generated/#{filename}-temp-%04d.png`
    # Create gif video
    `avconv -y -r 10 -i public/gifs/generated/#{filename}-temp-%04d.png -qscale:v 10 public/gifs/generated/#{filename}-vid.mp4`
    `avconv -y -r 10 -i public/gifs/generated/#{filename}-temp-%04d.png -qscale:v 7 public/gifs/generated/#{filename}-vid.ogv`
    
    # Save first frame as preview
    `mv public/gifs/generated/#{filename}-temp-0000.png public/gifs/generated/#{filename}-preview.png`
    # Create jpeg preview (smaller, uglier)
    `convert public/gifs/generated/#{filename}-preview.png -quality 50 public/gifs/generated/#{filename}-preview.jpg`
    
    # remove generated pngs
    `rm public/gifs/generated/#{filename}-temp-*.png`
  end
  
end
