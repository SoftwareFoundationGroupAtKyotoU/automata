require 'test/unit'

require 'comment/renderer'

module RendererTest
  class MarkdownTest < Test::Unit::TestCase
    def setup
      @renderer = Comment::Renderer.create
    end

    def test_type
      assert_equal(@renderer.type, 'text/html')
    end

    def test_render
      assert_equal(@renderer.render('# Title'),
                   "<h1 id=\"title\">Title</h1>\n")
      markdown = %(
# Title
[good link](http://example.com)
[bad link](irc://example.com)
)
      sanitized_html = %(
<h1 id="title">Title</h1>
<p><a href="http://example.com">good link</a>
<a>bad link</a></p>
)
      assert_equal(@renderer.render(markdown), sanitized_html)
    end
  end

  class PlainTest < Test::Unit::TestCase
    def setup
      @renderer = Comment::Renderer::Plain.new
    end

    def test_type
      assert_equal(@renderer.type, 'text/plain')
    end

    def test_render
      assert_equal(@renderer.render('abc'), 'abc')
      assert_equal(@renderer.render('&'), '&amp;')
    end
  end
end
