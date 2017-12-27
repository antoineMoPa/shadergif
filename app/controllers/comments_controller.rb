class CommentsController < ApplicationController
  
  def new

    id = params[:gif_id].to_i
    
    if not Gif.exists? id
      raise "Error, gif does not exist"
    end
    
    if user_signed_in?
      @gif = Gif.find(id)
      
      @comment = Comment.new
      @comment.user_id = current_user.id
      @comment.gif_id = @gif.id
      @comment.content = params[:comment]
      
      @comment.save()

      redirect_to "/gifs/" + @gif.id.to_s
    end
  end

end
