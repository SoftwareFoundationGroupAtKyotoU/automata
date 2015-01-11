require 'cgi'

require 'rubygems'
require 'bundler/setup'
require 'kramdown'
require 'sanitize'

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
        CGI.escapeHTML(text)
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
