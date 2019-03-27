class EditorController < ApplicationController
  def index
    # Used for CSS and frontend stuff
    @is_editor = true
  end
  
  # GET /shader_editor/1/edit
  def edit
    gif = Gif.left_joins(:textures)
            .find(params[:gif_id])
    
    if current_user.nil? or gif.user_id != current_user.id
      gif.increment!(:views)
    end

    if not gif.is_public
      if gif.user_id != current_user.id
        # You are trying to view someone's private gif? shameful.
        @error = "No gif here."
        @error_long = "Sorry!"
        render 'error'
        return
      end
    end

    @gif = gif
    @is_editor = true
    render "index"
  end
  
  def edif_gif
    
  end
  
  def edit_draft
    if not user_signed_in?
      @error = "You are not logged in."
      @error_long = "Login and try again!"
      render 'error'
      return
    end

    draft = Gif.find(params[:gif_id])
    
    if draft.user_id != current_user.id
      @error = "This gif is not available."
      @error_long = "Sorry!"
      render 'error'
      return
    end
    
    if draft.is_public
      @error = "This gif is public, it is not a draft anymore."
      @error_long = "Sorry!"
      render 'error'
      return
    end
    
    @gif = draft
    @is_draft = true
    @is_editor = true
    
    render "index"
  end
  
  def examples
  end
end
