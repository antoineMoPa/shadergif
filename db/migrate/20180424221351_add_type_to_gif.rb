class AddTypeToGif < ActiveRecord::Migration[5.1]
  def change
    add_column :gifs, :type, :string
  end
end
