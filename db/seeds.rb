# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#

if Rails.env.development?
  
  user = User.new(
    :email => 'test@example.com',
    :username =>'test1',
    :password => 'password',
    :password_confirmation => 'password'
  )
  
  user.save!

  user = User.new(
    :email => 'example@example.com',
    :username =>'test2',
    :password => 'password',
    :password_confirmation => 'password'
  )
  user.save!

  user = User.new(
    :email => 'test@test.com',
    :username =>'test3',
    :password => 'password',
    :password_confirmation => 'password'
  )
  user.save!
  
  for i in 1..1000 do
    gif = Gif.new
    gif.user_id = user.id
    gif.is_public = true
    gif.title = "Dev env gif"
    gif.description = "Just a dev env gif"
    gif.code = "{}"
    gif.frames = 10
    gif.lang = "shader_webgl1"
    gif.image_filename = "dev_env_gif.gif"
    gif.save!()
  end

  ActiveRecord::Base.connection.execute(
    "insert into user_likes (user_id, gif_id) values (1,768)"
  )
  
end
