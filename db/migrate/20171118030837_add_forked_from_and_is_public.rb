class AddForkedFromAndIsPublic < ActiveRecord::Migration[5.1]
  def change
    add_column :gifs, :forked_from, :bigint
    add_column :gifs, :is_public, :boolean
    add_foreign_key :gifs, :gifs, column: :forked_from
  end
end
