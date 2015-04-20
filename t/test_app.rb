require 'test/unit'
require 'rr'

require 'app'

class AppTest < Test::Unit::TestCase
  def setup

    @user = User.new(
              'login'     => 'user_id',
              'name'      => 'user_name',
              'ruby'      => 'user_ruby',
              'email'     => 'user@example.com',
              'assigned'  => 'assigned_TA'
            )
    stub(User).from_login(@user.login) { @user }

    @su = User.new(
            'login'     => 'suser_id',
            'name'      => 'suser_name',
            'ruby'      => 'suser_ruby',
            'email'     => 'suser@example.com',
            'assigned'  => 'sassigned_TA'
          )
    stub(User).from_login(@su.login) { @su }

    stub(User).all_users {
      [ @user, @su ]
    }

    $original_conf_initialize = Conf.allocate.method(:initialize)
    Conf.class_eval do
      define_method(:initialize) do
        @conf = {
          'master' => { 'su' => %w(suser_id) }
        }
      end
    end
  end

  def teardown
    Conf.class_eval do
      define_method(:initialize, $original_conf_initialize)
    end
  end

  def test_no_user
    assert(App.new.user.nil?, 'App.new.user == nil')
  end

  def test_user
    assert_equal(@user, App.new(@user.login).user)
    assert_equal(@su,   App.new(@su.login).user)
  end

  def test_su?
    assert(!App.new.su?,              'App.new.su? == false')
    assert(!App.new(@user.login).su?, 'app.su? == false')
    assert(App.new(@su.login).su?,    'app.su? == true')
  end

  def test_visible_users
    assert(App.new.visible_users.nil?,
           'App.new.visible_users == nil')
    assert_equal([@user], App.new(@user.login).visible_users,
                 'visible users for normal users')
    assert_equal([@user, @su], App.new(@su.login).visible_users,
                 'visible users for super users')
  end
end
