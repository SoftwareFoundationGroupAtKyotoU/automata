require 'cgi'

require 'rubygems'
require 'bundler/setup'
require 'kramdown'
require 'sanitize'

class Comment
  class Renderer
    class Markdown
      MD_OPTIONS = {
        :auto_id => false,
      }

      def render(text)
        html = Kramdown::Document.new(text, MD_OPTIONS).to_html
        return Sanitize.clean(html, Sanitize::Config::RELAXED)
      end

      def type()
        return 'text/html'
      end
    end

    class Plain
      def render(text)
        return CGI.escapeHTML(text)
      end

      def type()
        return 'text/plain'
      end
    end

    def self.create()
      return Markdown.new
    end
  end
end
