class AddNotifications < ActiveRecord::Migration[5.1]
  def change
    create_table :notifications do |t|
      t.string :text
      t.string :link
      t.boolean :is_read
      t.timestamps
    end

    add_reference :notifications, :user, foreign_key: true
    add_reference :notifications, :gif, foreign_key: true
  end
end
