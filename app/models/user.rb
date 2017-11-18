class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  validates :username,
            {
              presence: true,
              format: {
                with: /[a-zA-Z0-9\_]{3,20}/,
                message: "(3 to 20 characters max, only letters, numbers and underscores (_))" }
            }
end
