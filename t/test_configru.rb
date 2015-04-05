class TestConfigRu < Test::Unit::TestCase
  include Rack::Test::Methods

  def setup
    $original_conf_initialize = Conf.allocate.method(:initialize)
    Conf.class_eval do
      define_method(:initialize) do
        @conf = {
          'master' => {
            'base_path' => { 'uri' => '/path' }
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

  def test_root
    get '/path'
    assert last_response.redirect?
    assert_equal '/path/', last_response.header['Location']

    get '/path/'
    assert last_response.ok?
    assert_equal File.read('public/index.html'), last_response.body

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

    get '/path/account/'
    assert last_response.ok?
    assert_equal File.read('public/account/index.html'), last_response.body

    get '/path/admin/'
    assert last_response.unauthorized?

    get '/path/post/'
    assert last_response.unauthorized?

    get '/path/record/'
    assert last_response.unauthorized?
  end
end
