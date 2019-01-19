class ViewsAndLikes < ActiveRecord::Migration[5.1]
  def change
    create_join_table :gifs, :users, table_name: :user_likes
    add_column :user_likes, :id, :primary_key
    add_column :gifs, :views, :integer, :default => 0
  end
end
