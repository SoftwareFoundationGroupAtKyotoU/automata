
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

# Authenticated Rack handler
class AuthedAPIHandler < Rack::Handler::WEBrick
  def initialize(server, api, auth)
    @auth = auth
    super(server, api)
  end

  def service(req, res)
    super(req, res) if @auth.authenticate(req, res)
  end
end

# Authenticated FileHandler
class AuthedFileHandler < HTTPServlet::FileHandler
  def initialize(server, root, auth, options = {},
                 default = WEBrick::Config::FileHandler)
    @auth = auth
    super(server, root, options, default)
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

def srv.mount_apis(apis, auth = nil)
  apis.each do |api|
    if auth
      mount(api[0], AuthedAPIHandler, api[1].new, auth)
    else
      mount(api[0], Rack::Handler::WEBrick, api[1].new)
    end
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

if conf[:master, :authn_account]
  unless File.exist?(conf[:master, :authn_account, :htdigest])
    puts <<-EOS
Error: authn_account is configured but htdigest file doesn't exist.
Please execute 'bundle exec rake htaccess'.
    EOS
    fail RuntimeError
  end
  auth = HTTPAuth::DigestAuth.new(
    Realm: conf[:master, :authn_account, :realm],
    UserDB: HTTPAuth::Htdigest.new(conf[:master, :authn_account, :htdigest]),
    AutoReloadUserDB: true
  )
  srv.umount('/account')
  srv.mount('/account', AuthedFileHandler, 'public/account', auth)
end

srv.mount('/account/reset.cgi', Rack::Handler::WEBrick, Account::Reset.new)
srv.mount(
  '/account/register.cgi',
  Rack::Handler::WEBrick,
  Rack::Session::Pool.new(Account::Register.new, secret: 'account-secret-key')
)

trap('INT') { srv.shutdown }

srv.start
