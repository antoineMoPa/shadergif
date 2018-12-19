class RoomsController < ApplicationController
  def index
    
  end

  def show
    @is_editor = true
    @room_id = params[:room_id]

    # we use editor/index.html.erb
    # because coding this again for rooms would be useless
    render "editor/index"
  end
end
