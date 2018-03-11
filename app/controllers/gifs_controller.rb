class GifsController < ApplicationController
  before_action :set_gif, only: [:show, :edit, :update, :destroy]

  def new
    if not user_signed_in?
      raise "You are not logged in"
    end
    
    @gif = Gif.new
    @gif.user_id = current_user.id

    @gif.is_public = true
    
    # Generate random id
    rand_id = (1..16).map do |i|
      [*'A'..'Z', *'a'..'z', *0..9][ rand(62) ]
    end
    
    rand_id = rand_id.join
    filename = rand_id + Time.now.strftime("%Y-%m-%d-%Hh%Mm") + ".gif"
    
    @gif.title = params[:title]
    @gif.description = params[:description]
    @gif.code = params[:code]
    
    image = params[:image]
    
    image_normal_begin = "data:image/gif;base64,"
    
    if not image.starts_with? image_normal_begin
      raise "Image url encoding error"
    end
    
    # delete first part
    image = image[image_normal_begin.length..image.length]
    
    File.open("public/gifs/" + filename, 'wb') do|f|
      f.write(Base64.decode64(image))
    end
    
    @gif.image_filename = filename
    @gif.save()
    
    @gif.gen_video_and_thumb
    
    redirect_to "/gifs/" + @gif.id.to_s
  end

  def new_draft
    if not user_signed_in?
      raise "You are not logged in"
    end
    
    @gif = Gif.new
    @gif.user_id = current_user.id

    @gif.is_public = false
    
    # Generate random id
    rand_id = (1..16).map do |i|
      [*'A'..'Z', *'a'..'z', *0..9][ rand(62) ]
    end
    
    @gif.title = params[:title]
    @gif.code = params[:code]

    @gif.save()
    
    redirect_to "/shader-editor/drafts/" + @gif.id.to_s
  end
  
  def show
    @gif = Gif.joins(:user)
             .select("gifs.*, users.username")
             .where("is_public = true")
             .find(params[:id])
    
    @gif_json = @gif.to_json(
      :include =>
	  {
        :comments => {
          :include => {
            :user => {
              only: :username
            }
          }
        }
      }
    )
    
  end
  
  def play
    @gif = Gif.joins(:user)
             .select("gifs.*, users.username")
             .where("is_public = true")
             .find(params[:id])
  end

  
  def list
    
    @gifs = Gif
           .order(created_at: :desc)
           .joins(:user)
           .select("gifs.*, users.username")
           .where("is_public = true")
           .limit(params[:take]).offset(params[:skip])
    
    render :json => @gifs
  end

  # GET /gifs/1/edit
  def edit
  end

  # PATCH/PUT /gifs/1
  # PATCH/PUT /gifs/1.json
  def update
    respond_to do |format|
      if @gif.update(gif_params)
        format.html { redirect_to @gif, notice: 'Gif was successfully updated.' }
        format.json { render :show, status: :ok, location: @gif }
      else
        format.html { render :edit }
        format.json { render json: @gif.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /gifs/1
  # DELETE /gifs/1.json
  def destroy
    @gif.destroy
    respond_to do |format|
      format.html { redirect_to gifs_url, notice: 'Gif was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_gif
      @gif = Gif.joins(:user)
             .select("gifs.*, users.username")
             .find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def gif_params
      params.fetch(:gif, {})
    end
end
