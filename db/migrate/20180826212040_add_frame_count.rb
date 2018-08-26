class AddFrameCount < ActiveRecord::Migration[5.1]
  def change
    add_column :gifs, :frames, :int
  end
end
