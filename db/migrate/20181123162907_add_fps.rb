class AddFps < ActiveRecord::Migration[5.1]
  def change
    add_column :gifs, :fps, :int
  end
end
