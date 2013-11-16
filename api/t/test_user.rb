require 'test/unit'
require 'rr'

require 'user'

class UserTest < Test::Unit::TestCase
  def setup()
    @users = []
    (0..5).each do |idx|
      login = 'user' + idx.to_s
      @users.push(create_user(idx, login, login + ' name', login + ' ruby'))
    end
  end

  # auxiliary method for creating an instance of User.
  def create_user(number, login, name, ruby)
    User.new({'number' => number,
              'login' => login,
              'name' => name,
              'ruby' => ruby })
  end

  def test_number()
    @users.each_with_index do |user, i|
      assert_equal(i, user.number())
    end
  end

  def test_real_login()
    @users.each_with_index do |user, i|
      assert_equal('user' + i.to_s, user.real_login())
    end
  end

  def test_token()
    tokens = []
    @users.each do |user|
      token = user.token()
      # Always return same token for each user.
      assert_equal(token, user.token())

      assert(user.token().is_a?(String))
      tokens.push(token)
    end

    # All the token are different.
    assert_equal(tokens, tokens.uniq())
  end

  def test_intialize()
    assert(@users[0].report.empty?)
  end

  def test_login()
    @users.each do |user|
      assert_equal(user.real_login(), user.login())
    end
  end

  def test_name()
    @users.each do |user|
      assert_equal(user.login() + ' name', user.name())
    end
  end

  def test_ruby()
    @users.each do |user|
      assert_equal(user.login() + ' ruby', user.ruby())
    end
  end

  def test_assign()
    key = 'key'
    report = 'report'
    @users[0][key] = report

    assert_equal(report, @users[0].report[key])
  end

  def test_to_hash()
    # Case: report is empty
    user = @users[0]
    hash = user.to_hash()
    assert_nil(hash['report'])

    # Case: report isn't empty
    user = @users[1]
    report1 = {}
    report2 = {}
    content_of_r1 = { 'key1' => 'value1' }
    content_of_r2 = { 'key2' => 'value2' }
    mock(report1).to_hash { { 'key1' => 'value1' } }
    mock(report2).to_hash { { 'key2' => 'value2' } }

    user['report1'] = report1
    user['report2'] = report2

    hash = user.to_hash()
    assert_equal(content_of_r1, hash['report']['report1'])
    assert_equal(content_of_r2, hash['report']['report2'])
  end
end

