Rails.application.routes.draw do
  devise_for :users, :controllers => { registrations: 'registrations' }
  
  get 'home/index'

  root 'home#index'

  get 'user/:username', to: 'user#show', as: 'user_show'
  get 'shader-editor' => 'shader_editor#index'
  get 'shader-editor/examples' => 'shader_editor#examples'
  post 'gifs/new' => 'gifs#new'
  post 'comments/new' => 'comments#new'
  
  get 'gifs/list' => 'gifs#list'
  get 'gifs/:id' => 'gifs#show'
  get 'gifs/:id/play' => 'gifs#play'
  get 'gifs/:id/fork' => 'gifs#fork'
  get 'gifs/:id/edit' => 'gifs#edit'

  resources :gifs
end
