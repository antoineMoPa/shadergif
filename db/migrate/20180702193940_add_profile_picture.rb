class AddProfilePicture < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :profile_picture, :string, :length => 50
  end
end
