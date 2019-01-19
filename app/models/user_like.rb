class UserLike < ApplicationRecord
  primary_key = [:gif_id, :user_id]
end
