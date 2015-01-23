require 'shellwords'

class MIME
  class Type
    attr_reader :encoding

    def initialize(type, encoding='')
      @major, @minor = type.split('/')
      @encoding = encoding
    end

    def content_type()
      return [ [ type, subtype ].join('/'), encoding ].join(';')
    end

    def to_s() return content_type end
    def type() return @major end
    def subtype() return @minor end
  end
end

class Pathname
  def mime()
    type = `file --mime -b #{Shellwords.escape(self.to_s)}`
    type = type.split(/\s+/)
    type = [ '', '' ] unless type.size <= 2
    return MIME::Type.new(*type)
  end
end
