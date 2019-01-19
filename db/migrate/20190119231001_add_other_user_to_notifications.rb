class AddOtherUserToNotifications < ActiveRecord::Migration[5.1]
  def change
    add_column :notifications, :other_user_id, :integer
  end
end
