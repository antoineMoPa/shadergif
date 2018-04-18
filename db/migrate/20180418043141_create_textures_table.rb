class CreateTexturesTable < ActiveRecord::Migration[5.1]
  def change
    create_table :textures do |t|
      t.string :filename
      t.string :name
    end
    
    # Each texture will be assigned to a gif
    # We could have associated textures to users.
    # But what if a user deletes a texture without deleting
    # the gif? You would end up with live gifs that are
    # missing textures in the shader player/editor, we'd loose
    # reproducibility of gifs.
    # When we delete a gif, then we can delete any textures
    # associated to it.
    add_reference :textures, :gif, index: true
  end
end
