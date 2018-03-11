class ShaderEditorController < ApplicationController
  def index
    @is_editor = true
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
    
    @draft = draft
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

    draft.save()
    
    redirect_to "/shader-editor/drafts/" + draft.id.to_s
  end

  
  def examples
  end
end
