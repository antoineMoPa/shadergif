require 'test_helper'

class HomeControllerTest < ActionDispatch::IntegrationTest

  test "should get index" do
    get '/'
    assert_response :success
  end

end
