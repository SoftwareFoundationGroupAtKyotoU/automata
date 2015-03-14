
require 'bundler/setup'
require 'kramdown'
require 'sanitize'
require 'rack'

class Comment
  class Renderer
    class Markdown
      MD_OPTIONS = {
        auto_id: false
      }

      def render(text)
        html = Kramdown::Document.new(text, MD_OPTIONS).to_html
        Sanitize.clean(html, Sanitize::Config::RELAXED)
      end

      def type
        'text/html'
      end
    end

    class Plain
      def render(text)
        Rack::Utils.escape_html(text)
      end

      def type
        'text/plain'
      end
    end

    def self.create
      Markdown.new
    end
  end
end
