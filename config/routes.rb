Rails.application.routes.draw do
  devise_for :users, :controllers => { registrations: 'registrations' }
  
  get 'home/index'

  root 'home#index'

  get 'about' => 'home#about'
  
  get 'user/gifs-and-drafts', to: 'user#gifs_and_drafts', as: 'user_gifs_and_drafts'
  get 'user/:username', to: 'user#show', as: 'user_show'
  get 'notifications', to: 'user#notifications', as: 'user_notifications'
  post 'user/update_profile_pic' => 'user#update_profile_pic'
  
  get 'search' => 'home#search'
  get 'profile' => 'user#profile'
  
  # Legacy paths that should be deleted one day
  # (shader-editor)
  get 'shader-editor' => 'editor#index'
  get 'shader-editor/drafts/:gif_id' => 'editor#edit_draft'
  get 'shader-editor/examples' => 'editor#examples'

  get 'editor/selector' => 'editor#selector'
  get 'editor' => 'editor#index'
  get 'editor/drafts/:gif_id' => 'editor#edit_draft'
  get 'editor/:gif_id/edit' => 'editor#edit'
  get 'editor/examples' => 'editor#examples'

  post 'gifs/save' => 'gifs#save'
  post 'gifs/save_draft' => 'gifs#new_draft'
  post 'comments/new' => 'comments#new'
  
  get 'gifs/list' => 'gifs#list'
  get 'gifs/:id' => 'gifs#show'
  get 'gifs/:id/play' => 'gifs#play'
  get 'gifs/:id/fork' => 'gifs#fork'
  get 'gifs/:id/edit' => 'gifs#edit'
  post 'gifs/new' => 'gifs#new'
  post 'gifs/new_draft' => 'gifs#new_draft'
  post 'gifs/:gif_id/delete', to: 'gifs#delete', as: 'delete_gif_url'
  
  resources :gifs
end
