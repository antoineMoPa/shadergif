require 'test_helper'

class GifsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @gif = gifs(:one)
  end

  test "should get index" do
    get gifs_url
    assert_response :success
  end

  test "should get new" do
    get new_gif_url
    assert_response :success
  end

  test "should create gif" do
    assert_difference('Gif.count') do
      post gifs_url, params: { gif: {  } }
    end

    assert_redirected_to gif_url(Gif.last)
  end

  test "should show gif" do
    get gif_url(@gif)
    assert_response :success
  end

  test "should get edit" do
    get edit_gif_url(@gif)
    assert_response :success
  end

  test "should update gif" do
    patch gif_url(@gif), params: { gif: {  } }
    assert_redirected_to gif_url(@gif)
  end

  test "should destroy gif" do
    assert_difference('Gif.count', -1) do
      delete gif_url(@gif)
    end

    assert_redirected_to gifs_url
  end
end
