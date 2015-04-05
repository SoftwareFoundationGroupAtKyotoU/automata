class TestConfigRu2 < Test::Unit::TestCase
  include Rack::Test::Methods

  def setup
    $original_conf_initialize = Conf.allocate.method(:initialize)
    Conf.class_eval do
      define_method(:initialize) do
        @conf = { 'master' => {} }
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
    get '/'
    assert last_response.ok?
    assert File.read('public/index.html'), last_response.body
  end
end
