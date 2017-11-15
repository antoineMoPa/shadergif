Rails.application.routes.draw do
  devise_for :users
  
  get 'home/index'

  root 'home#index'

  get 'shader-editor' => 'shader_editor#index'
  get 'shader-editor/examples' => 'shader_editor#examples'

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
end
