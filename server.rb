
require_relative 'lib/conf.rb'
require 'webrick'
include WEBrick

# CGIHandler with authentication
class AuthCGIHandler < HTTPServlet::CGIHandler
  def initialize(server, name, auth)
    @auth = auth
    super(server, name)
  end

  def do_GET(req, res)
    super(req, res) if @auth.authenticate(req, res)
  end

  alias_method :do_POST, :do_GET
end

DOCUMENT_ROOT = File.expand_path(File.dirname(__FILE__)) + '/public'

srv = HTTPServer.new(DocumentRoot: DOCUMENT_ROOT, Port: 3000)

def srv.mount_cgi(path, auth)
  mount(path, AuthCGIHandler, File.join(DOCUMENT_ROOT, path), auth)
end

def srv.mount_cgis(paths, auth)
  paths.each { |path| mount_cgi(path, auth) }
end

conf = Conf.new

htdigest = HTTPAuth::Htdigest.new conf[:master, :authn, :htdigest]
config = {
  Realm: conf[:master, :authn, :realm],
  UserDB: htdigest
}
digest_auth = HTTPAuth::DigestAuth.new config

srv.mount_cgis([
  '/api/admin_log.cgi',
  '/api/admin_runtest.cgi',
  '/api/admin_solved.cgi',
  '/api/admin_user.cgi',
  '/api/browse.cgi',
  '/api/comment.cgi',
  '/api/master.cgi',
  '/api/post.cgi',
  '/api/scheme.cgi',
  '/api/template.cgi',
  '/api/test_result.cgi',
  '/api/user.cgi'
], digest_auth)

trap('INT') { srv.shutdown }

srv.start
