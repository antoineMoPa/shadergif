# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20190119231001) do

  create_table "comments", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8" do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "gif_id"
    t.bigint "user_id"
    t.index ["gif_id"], name: "index_comments_on_gif_id"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "gifs", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8" do |t|
    t.string "title"
    t.string "image_filename"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.text "code"
    t.bigint "forked_from"
    t.boolean "is_public"
    t.string "lang"
    t.integer "frames"
    t.integer "width"
    t.integer "height"
    t.integer "fps"
    t.integer "views", default: 0
    t.index ["forked_from"], name: "fk_rails_99e24f4b85"
    t.index ["user_id"], name: "index_gifs_on_user_id"
  end

  create_table "notifications", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8" do |t|
    t.string "text"
    t.string "link"
    t.boolean "is_read"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.bigint "gif_id"
    t.integer "other_user_id"
    t.index ["gif_id"], name: "index_notifications_on_gif_id"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "textures", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8" do |t|
    t.string "filename"
    t.string "name"
    t.bigint "gif_id"
    t.index ["gif_id"], name: "index_textures_on_gif_id"
  end

  create_table "user_likes", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4" do |t|
    t.bigint "gif_id", null: false
    t.bigint "user_id", null: false
  end

  create_table "users", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8" do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "username"
    t.string "profile_picture"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "comments", "gifs"
  add_foreign_key "comments", "users"
  add_foreign_key "gifs", "gifs", column: "forked_from"
  add_foreign_key "gifs", "users"
  add_foreign_key "notifications", "gifs"
  add_foreign_key "notifications", "users"
end
