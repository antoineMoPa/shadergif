class AddUsername < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :username, :string, :length => 20
  end
end
