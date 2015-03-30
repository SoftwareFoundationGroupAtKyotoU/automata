
require 'bundler/setup'
require 'rack/rewrite'

$LOAD_PATH << '.'
require 'lib/conf.rb'
require 'lib/api/admin_log.rb'
require 'lib/api/admin_runtest.rb'
require 'lib/api/admin_solved.rb'
require 'lib/api/admin_user.rb'
require 'lib/api/browse.rb'
require 'lib/api/comment.rb'
require 'lib/api/master.rb'
require 'lib/api/post.rb'
require 'lib/api/scheme.rb'
require 'lib/api/template.rb'
require 'lib/api/test_result.rb'
require 'lib/api/user.rb'
require 'lib/account/reset.rb'
require 'lib/account/register.rb'
require 'authenticator'
require 'router'

use Rack::CommonLogger
use Rack::ShowExceptions
use Rack::Lint
use Rack::Reloader, 10

use Authenticator

use Rack::Rewrite do
  r301 %r{^/([a-zA-Z]+)$}, '/$1/'
end

use Rack::Rewrite do
  rewrite %r{(.*)/$}, '$1/index.html'
end

use Rack::Rewrite do
  send_file %r{((.*)\.(html|css|js|gif|png))}, 'public$1', if: (proc do |env|
    File.exist?('public' + Rack::Request.new(env).path)
  end)
end

use Rack::Rewrite do
  # path is included as a query parameter
  rewrite %r{/browse/([^/]+)/([^/]+)/(.+)},
          '/api/browse.cgi?user=$1&report=$2$3',
          if: proc { |env| env['QUERY_STRING'] =~ /(?:^|&)path=/ }
  # path is included not as a query parameter
  rewrite %r{/browse/([^/]+)/([^/]+)/(.+)},
          '/api/browse.cgi?user=$1&report=$2&path=$3',
          if: proc { |env| env['QUERY_STRING'] !~ /(?:^|&)path=/ }
end

use Rack::Session::Pool, key: 'rack.session', secret: 'account-secret-key'

run Router.new([
  { pattern: '/account/register.cgi', controller: Account::Register.new },
  { pattern: '/account/reset.cgi', controller: Account::Reset.new },
  { pattern: '/api/admin_log.cgi', controller: API::AdminLog.new },
  { pattern: '/api/admin_runtest.cgi', controller: API::AdminRuntest.new },
  { pattern: '/api/admin_solved.cgi', controller: API::AdminSolved.new },
  { pattern: '/api/admin_user.cgi', controller: API::AdminUser.new },
  { pattern: '/api/browse.cgi', controller: API::Browse.new },
  { pattern: '/api/comment.cgi', controller: API::Comment.new },
  { pattern: '/api/master.cgi', controller: API::Master.new },
  { pattern: '/api/post.cgi', controller: API::Post.new },
  { pattern: '/api/scheme.cgi', controller: API::Scheme.new },
  { pattern: '/api/template.cgi', controller: API::Template.new },
  { pattern: '/api/test_result.cgi', controller: API::TestResult.new },
  { pattern: '/api/user.cgi', controller: API::User.new },
])
