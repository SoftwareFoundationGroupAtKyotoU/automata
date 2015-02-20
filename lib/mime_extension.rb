require 'shellwords'

#
# MIME type container
#
class MIME
  class Type
    attr_reader :encoding

    # @param [String] type content-type
    # @param [String] encoding file encoding
    #
    # @example
    #   MIME::Type.new("text/plain", "")
    def initialize(type, encoding='')
      @major, @minor = type.split('/')
      @encoding = encoding
    end

    # @return [String] MIME's content-type
    def to_s
      [ [ type, subtype ].join('/'), encoding ].join('; ')
    end

    # @return [String] MIME's type
    def type
      @major
    end

    # @return [String] MIME's subtype
    def subtype
      @minor
    end

    alias_method :content_type, :to_s
  end
end

class Pathname
  # Return MIME's content-type.
  #
  # @return [MIME::Type] MIME content-type
  def mime()
    type = `file --mime -b #{Shellwords.escape(self.to_s)}`
    type = type.chomp.split(/;\s+/)
    type = [ '', '' ] unless type.size <= 2 # What is this? "file" command would always return two values.
    return MIME::Type.new(*type)
  end
end
