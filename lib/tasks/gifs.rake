desc "Recreate vids and thumbnails in case of problem"
namespace :gifs do
  task :recreate_thumbs_and_vids => :environment do
    Gif.all().each() do |g|
      g.gen_video_and_thumb()
    end
  end
end
