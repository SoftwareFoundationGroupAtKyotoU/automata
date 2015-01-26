require 'test/unit'
require 'rr'

require 'app'

class AppText < Test::Unit::TestCase
  def setup
    @app = App.new
  end

  def test_user_names_from_token
    stub(@app).users do
      [User.new(
        { 'login'  => 'login-id1',
          'name'   => 'user name1',
          'ruby'   => 'user ruby1',
          'email'  => '1a@b.c'
        }),
       User.new(
         { 'login'  => 'login-id2',
           'name'   => 'user name2',
           'ruby'   => 'user ruby2',
           'email'  => '2a@b.c'
         })]
    end
    user1 = @app.users[0]
    user2 = @app.users[1]

    user_token1 = User.make_token(user1.real_login)
    user_token2 = User.make_token(user2.real_login)

    assert_equal({user_token1 => user1.name}, @app.user_names_from_tokens([user_token1]))
    assert_equal({user_token1 => user1.name, user_token2 => user2.name},
                 @app.user_names_from_tokens([user_token1, user_token2]))
  end
end
