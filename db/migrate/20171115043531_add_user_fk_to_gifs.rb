class AddUserFkToGifs < ActiveRecord::Migration[5.1]
  def change
    add_reference :gifs, :user, foreign_key: true
  end
end
