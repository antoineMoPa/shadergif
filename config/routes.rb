Rails.application.routes.draw do
  devise_for :users, :controllers => { registrations: 'registrations' }
  
  get 'home/index'

  root 'home#index'

  get 'user/gifs-and-drafts', to: 'user#gifs_and_drafts', as: 'user_gifs_and_drafts'
  get 'user/:username', to: 'user#show', as: 'user_show'
  get 'shader-editor' => 'shader_editor#index'
  get 'shader-editor/drafts/:gif_id' => 'shader_editor#edit_draft'
  get 'shader-editor/examples' => 'shader_editor#examples'
  post 'gifs/save_draft' => 'shader_editor#save_draft'
  post 'comments/new' => 'comments#new'
  
  get 'gifs/list' => 'gifs#list'
  get 'gifs/:id' => 'gifs#show'
  get 'gifs/:id/play' => 'gifs#play'
  get 'gifs/:id/fork' => 'gifs#fork'
  get 'gifs/:id/edit' => 'gifs#edit'
  post 'gifs/new' => 'gifs#new'
  post 'gifs/new_draft' => 'gifs#new_draft'
  post 'gifs/:gif_id/delete' => 'gifs#delete'
  
  resources :gifs
end
