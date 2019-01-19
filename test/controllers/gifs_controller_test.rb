require 'test_helper'
require_relative 'test_gif_data'

class GifsControllerTest < ActionDispatch::IntegrationTest
  include Warden::Test::Helpers

  setup do
    # A small gif I made
    # echo "data:image/gif;base64,"`base64 smallgif.gif --wrap=0`
    @gif_str = TestGif::GIF

    post gifs_url, params: { image: @gif_str }
    @gif = Gif.last
  end
  
  test "should create gif" do
    login_as(users(:one), :scope => :user)
    
    assert_difference('Gif.count') do
      post gifs_url, params: {image: @gif_str}
    end

    assert_redirected_to gif_url(Gif.last)
  end

  test "should show gif" do
    login_as(users(:one), :scope => :user)
    
    post gifs_url, params: { image: @gif_str }
    get '/gifs/'+Gif.last.id.to_s
    assert_response :success
  end

  test "should get edit" do
    login_as(users(:one), :scope => :user)
    
    post gifs_url, params: { image: @gif_str }
    get '/gifs/'+Gif.last.id.to_s+'/edit'
    assert_response :success
  end

  test "should destroy gif" do
    login_as(users(:one), :scope => :user)
    post gifs_url, params: { image: @gif_str }
    
    assert_difference('Gif.count', -1) do
      post "/gifs/" + Gif.last.id.to_s + "/delete"
    end
  end
  
  test "should count likes" do
    def count_likes
      UserLike.select('count(user_id) as count').where(gif_id: Gif.last.id.to_s).first.count
    end
    login_as(users(:one), :scope => :user)
    post "/gifs/toggle_like/" + Gif.last.id.to_s
    assert_equal 1, count_likes
    login_as(users(:two), :scope => :user)
    post "/gifs/toggle_like/" + Gif.last.id.to_s
    assert_equal 2, count_likes
    post "/gifs/toggle_like/" + Gif.last.id.to_s
    assert_equal 1, count_likes
  end
end
