class AddWidthAndHeight < ActiveRecord::Migration[5.1]
  def change
    add_column :gifs, :width, :int
    add_column :gifs, :height, :int
  end
end
