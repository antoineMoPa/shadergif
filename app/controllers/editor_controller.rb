class EditorController < ApplicationController
  def index
    # Used for CSS and frontend stuff
    @is_editor = true
  end
  
  # GET /shader_editor/1/edit
  def edit
    gif = Gif.left_joins(:textures)
            .find(params[:gif_id])
    
    
    if not gif.is_public
      if gif.user_id != current_user.id
        # You are trying to view someone's private gif? shameful.
        raise "No gif here"
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
      raise "You are not logged in"
    end

    draft = Gif.find(params[:gif_id])
    
    if draft.user_id != current_user.id
      raise "This gif is not available"
    end
    
    if draft.is_public
      raise "This gif is public"
    end
    
    @gif = draft
    @is_draft = true
    @is_editor = true
    
    render "index"
  end

  def save_draft
    if not user_signed_in?
      raise "You are not logged in"
    end

    draft = Gif.find(params[:draft_id])
    
    if draft.nil? or draft.user_id != current_user.id
      raise "This gif is not available"
    end
    
    if draft.is_public
      raise "This gif is public"
    end

    draft.title = params[:title]
    draft.code = params[:code]
    draft.lang = params[:lang]

    draft.save()
    
    redirect_to "/editor/drafts/" + draft.id.to_s
  end

  
  def examples
  end
end
