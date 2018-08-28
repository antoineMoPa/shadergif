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

      notify_poster()
      
      redirect_to "/gifs/" + @gif.id.to_s
    end
  end

  def notify_poster
    gif_poster = User.find(@gif.user_id)

    @notification = Notification.new
    @notification.user_id = gif_poster.id
    @notification.gif_id = @gif.id
    @notification.text = "Someone commented on your post."
    @notification.link = "/gifs/" + @gif.id.to_s
    @notification.is_read = false
    @notification.save()
  end
  
end
