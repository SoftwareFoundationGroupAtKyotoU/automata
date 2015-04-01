
require 'rack'

# Routing
class Router
  def initialize(routes)
    @routes = routes
  end

  def not_found
    [404, { 'Content-Type' => 'text/plain' }, ['Page not found.']]
  end

  def call(env)
    request_path = Rack::Request.new(env).path_info
    @routes.each do |route|
      match = request_path.match(route[:pattern])
      return route[:controller].call(env) if match
    end
    not_found
  end
end
