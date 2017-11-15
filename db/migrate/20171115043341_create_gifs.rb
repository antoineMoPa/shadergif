class CreateGifs < ActiveRecord::Migration[5.1]
  def change
    create_table :gifs do |t|
      t.string :title
      t.string :image_filename
      t.text :description

      t.timestamps
    end
  end
end
