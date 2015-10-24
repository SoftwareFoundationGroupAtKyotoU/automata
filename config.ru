require 'bundler/setup'
require 'rack/rewrite'

$LOAD_PATH << '.'
require 'lib/conf'
require 'lib/api/admin_log'
require 'lib/api/admin_runtest'
require 'lib/api/admin_solved'
require 'lib/api/admin_user'
require 'lib/api/admin_interact'
require 'lib/api/browse'
require 'lib/api/comment'
require 'lib/api/master'
require 'lib/api/post'
require 'lib/api/scheme'
require 'lib/api/template'
require 'lib/api/test_result'
require 'lib/api/user'
require 'lib/api/download'
require 'lib/api/diff'
require 'lib/account/reset'
require 'lib/account/register'
require 'lib/sandbox/tester'
require 'lib/sandbox/interactor'
require 'middleware/authenticator'
require 'middleware/router'
require 'middleware/error_page'

use Rack::CommonLogger if ENV['RACK_ENV'] != 'development'

conf = Conf.new

base_uri = conf[:master, :base_path, :uri] || '/'
base_path = File.join(conf[:master, :base_path, :host] || '', base_uri)

use Rack::Rewrite do
  r301 %r{^#{base_uri}$}, base_uri + '/', if: (proc { |_| base_uri != '/' })
end

map base_path do
  if ENV['RACK_ENV'] == 'development'
    use Rack::Lint
    use Rack::ShowExceptions
    # reload changed files per request, EXCEPT this config.ru
    use Rack::Reloader, 0
  end

  use ErrorPage if ENV['RACK_ENV'] == 'production'

  use Rack::Rewrite do
    r301 %r{^/(account|admin|post|record)$}, './$1/'
  end

  use Authenticator

  use Rack::Rewrite do
    rewrite %r{(.*)/$}, '$1/index.html'
  end

  use Rack::Rewrite do
    send_file %r{^(/(index.html|record|post|jar|image|css|admin|account|fonts)[^?]*)(\?.*)?$},
              'public$1',
              if: (proc do |env|
      path = Rack::Request.new(env).path_info
      path !~ /\.cgi$/ &&  File.exist?(File.join('public', path))
    end)
  end

  use Rack::Rewrite do
    # path is included as a query parameter
    rewrite %r{^(.*)/browse/([^/]+)/([^/]+)/([^?]+).*$},
            '$1/api/browse.cgi?user=$2&report=$3&path=$4',
            if: proc { |env| env['QUERY_STRING'] =~ /(?:^|&)path=/ }
    # path is included in uri but not as a query parameter
    rewrite %r{^(.*)/browse/([^/]+)/([^/]+)/(.+)$},
            '$1/api/browse.cgi?user=$2&report=$3&path=$4',
            if: proc { |env| env['QUERY_STRING'] !~ /(?:^|&)path=/ }
  end

  use Rack::Rewrite do
    rewrite %r{/download/([^/]+)/([^/.]+)\.zip$},
            '/api/download.cgi?user=$1&report=$2'
  end

  use Rack::Session::Pool,
      key: 'rack.session',
      expire_after: 600 # 10 minutes

  routes = [
    { pattern: '/account/register.cgi', controller: Account::Register.new },
    { pattern: '/account/reset.cgi', controller: Account::Reset.new },
    { pattern: '/api/admin_log.cgi', controller: API::AdminLog.new },
    { pattern: '/api/admin_runtest.cgi', controller: API::AdminRuntest.new },
    { pattern: '/api/admin_solved.cgi', controller: API::AdminSolved.new },
    { pattern: '/api/admin_user.cgi', controller: API::AdminUser.new },
    { pattern: '/api/admin_interact.cgi', controller: API::AdminInteract.new },
    { pattern: '/api/browse.cgi', controller: API::Browse.new },
    { pattern: '/api/comment.cgi', controller: API::Comment.new },
    { pattern: '/api/master.cgi', controller: API::Master.new },
    { pattern: '/api/post.cgi', controller: API::Post.new },
    { pattern: '/api/scheme.cgi', controller: API::Scheme.new },
    { pattern: '/api/template.cgi', controller: API::Template.new },
    { pattern: '/api/test_result.cgi', controller: API::TestResult.new },
    { pattern: '/api/user.cgi', controller: API::User.new },
    { pattern: '/api/download.cgi', controller: API::Download.new },
    { pattern: '/api/diff.cgi', controller: API::Diff.new },
  ]

  if ENV['WITH_SANDBOX']
    routes.concat([
      { pattern: '/sandbox/tester.cgi', controller: Sandbox::Tester.new },
      { pattern: '/sandbox/interactor.cgi', controller: Sandbox::Interactor.new }
    ])
  end

  run Router.new(routes)
end
