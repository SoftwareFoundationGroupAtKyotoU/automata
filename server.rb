
require_relative 'lib/conf.rb'

require_relative 'lib/api/admin_log.rb'
require_relative 'lib/api/admin_runtest.rb'
require_relative 'lib/api/admin_solved.rb'
require_relative 'lib/api/admin_user.rb'
require_relative 'lib/api/browse.rb'
require_relative 'lib/api/comment.rb'
require_relative 'lib/api/master.rb'
require_relative 'lib/api/post.rb'
require_relative 'lib/api/scheme.rb'
require_relative 'lib/api/template.rb'
require_relative 'lib/api/test_result.rb'
require_relative 'lib/api/user.rb'
require_relative 'lib/account/reset.rb'
require_relative 'lib/account/register.rb'

require 'webrick'
include WEBrick

# Rack handler with digest authentication
class AuthAPIHandler < Rack::Handler::WEBrick
  def initialize(server, api, auth)
    @auth = auth
    super(server, api)
  end

  def service(req, res)
    super(req, res) if @auth.authenticate(req, res)
  end
end

DOCUMENT_ROOT = File.expand_path(File.dirname(__FILE__)) + '/public'

srv = HTTPServer.new(DocumentRoot: DOCUMENT_ROOT, Port: 3000)

conf = Conf.new
digest_auth = HTTPAuth::DigestAuth.new(
  Realm: conf[:master, :authn, :realm],
  UserDB: HTTPAuth::Htdigest.new(conf[:master, :authn, :htdigest]),
  AutoReloadUserDB: true
)

def srv.mount_apis(apis, auth)
  apis.each do |api|
    mount(api[0], AuthAPIHandler, api[1].new, auth)
  end
end

srv.mount_apis([
  ['/api/admin_log.cgi', API::AdminLog],
  ['/api/admin_runtest.cgi', API::AdminRuntest],
  ['/api/admin_solved.cgi', API::AdminSolved],
  ['/api/admin_user.cgi', API::AdminUser],
  ['/api/browse.cgi', API::Browse],
  ['/api/comment.cgi', API::Comment],
  ['/api/master.cgi', API::Master],
  ['/api/post.cgi', API::Post],
  ['/api/scheme.cgi', API::Scheme],
  ['/api/template.cgi', API::Template],
  ['/api/test_result.cgi', API::TestResult],
  ['/api/user.cgi', API::User]
], digest_auth)

srv.mount('/account/reset.cgi', Rack::Handler::WEBrick, Account::Reset.new)
srv.mount('/account/register.cgi', Rack::Handler::WEBrick, Account::Register.new)

trap('INT') { srv.shutdown }

srv.start
