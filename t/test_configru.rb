class TestConfigRu < Test::Unit::TestCase
  include Rack::Test::Methods

  def setup
    $original_conf_initialize = Conf.allocate.method(:initialize)
    Conf.class_eval do
      define_method(:initialize) do
        @conf = {
          'master' => {
            'base_path' => { 'uri' => '/path' },
            'authn_account' => {
              'user' => 'account_user',
              'passwd' => 'account_passwd'
            }
          }
        }
      end
    end
  end

  def teardown
    Conf.class_eval do
      define_method(:initialize, $original_conf_initialize)
    end
  end

  def app
    Rack::Builder.parse_file('config.ru').first
  end

  def test_redirect
    get '/path'
    assert last_response.redirect?
    assert_equal '/path/', last_response.header['Location']

    get '/path/account'
    assert last_response.redirect?
    assert_equal './account/', last_response.header['Location']

    get '/path/admin'
    assert last_response.redirect?
    assert_equal './admin/', last_response.header['Location']

    get '/path/post'
    assert last_response.redirect?
    assert_equal './post/', last_response.header['Location']

    get '/path/record'
    assert last_response.redirect?
    assert_equal './record/', last_response.header['Location']
  end

  def test_static_without_auth
    get '/path/'
    assert last_response.ok?
    assert_equal File.read('public/index.html'), last_response.body

    get '/path/account/'
    assert last_response.unauthorized?

    get '/path/admin/'
    assert last_response.unauthorized?

    get '/path/post/'
    assert last_response.unauthorized?

    get '/path/record/'
    assert last_response.unauthorized?

    get '/path/image/ZeroClipboard.swf'
    assert last_response.ok?
    assert_equal File.read('public/image/ZeroClipboard.swf'), last_response.body

    get '/path/image/ZeroClipboard.swf?noCache=123'
    assert last_response.ok?
    assert_equal File.read('public/image/ZeroClipboard.swf'), last_response.body

    get '/path/image/loading.gif'
    assert last_response.ok?
    assert_equal File.read('public/image/loading.gif'), last_response.body

    get '/path/css/comment.css'
    assert last_response.ok?
    assert_equal File.read('public/css/comment.css'), last_response.body

    get '/path/css/default.css'
    assert last_response.ok?
    assert_equal File.read('public/css/default.css'), last_response.body

    get '/path/css/navigator.css'
    assert last_response.ok?
    assert_equal File.read('public/css/navigator.css'), last_response.body
  end

  def test_account_with_auth
    digest_authorize 'account_user', 'account_passwd'

    get '/path/account/'
    assert last_response.ok?
    assert_equal File.read('public/account/index.html'), last_response.body

    get '/path/account/register.cgi'
    assert last_response.ok?
    rack_env = { 'rack.session' => {}, 'rack.input' => {} }
    assert_equal Account::Register.new.call(rack_env).body[0], last_response.body

    get '/path/account/reset.html'
    assert last_response.ok?
    assert_equal File.read('public/account/reset.html'), last_response.body
  end
end
