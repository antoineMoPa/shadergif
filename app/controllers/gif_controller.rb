class GifController < ApplicationController
  def new
    if user_signed_in?
      @gif = Gif.new
      @gif.user_id = current_user.id
      @gif.save()
      
      
    else
      
    end
    
    respond_to do |format|
      format.html { render :text => 'success' }
    end
  end
end
