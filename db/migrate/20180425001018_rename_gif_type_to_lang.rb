class RenameGifTypeToLang < ActiveRecord::Migration[5.1]
  def change
    change_table :gifs do |t|
      t.rename :type, :lang
    end
  end
end
