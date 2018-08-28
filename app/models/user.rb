class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  has_many :gifs
  
  validates :username,
            {
              presence: true,
              uniqueness: true,
              format: {
                with: /[a-zA-Z0-9\_]{3,20}/,
                message: "(3 to 20 characters max, only letters, numbers and underscores (_))" }
            }

  def notification_count
    Notification.where(user_id: id).where.not("is_read").count()
  end
  
end
