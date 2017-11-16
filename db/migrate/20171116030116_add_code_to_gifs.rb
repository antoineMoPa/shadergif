class AddCodeToGifs < ActiveRecord::Migration[5.1]
  def change
    add_column :gifs, :code, :text
  end
end
