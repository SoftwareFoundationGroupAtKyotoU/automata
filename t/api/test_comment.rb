# -*- coding: utf-8 -*-

require 'test/unit'
require 'rr'
require 'rack/test'

require 'user'
require 'api/comment'

class CommentTest < Test::Unit::TestCase
  include Rack::Test::Methods

  def app
    API::Comment.new
  end

  def test_user_names_from_logins
    stub(User).all_users do
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
    user1 = User.all_users[0]
    user2 = User.all_users[1]

    assert_equal({user1.login => user1.name}, app.user_names_from_logins([user1.login]))
    assert_equal({user1.login => user1.name, user2.login => user2.name},
                 app.user_names_from_logins([user1.login, user2.login]))
    assert_equal({user1.login => user1.name},
                 app.user_names_from_logins([user1.login, 'no-existing-user-id']))
  end
end
