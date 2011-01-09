require 'strscan'

module Report
  class Exercise
    def initialize(arg)
      arg = self.class.parse(arg) unless arg.is_a?(Array)
      @arr = arg
    end

    def match(other)
      return false unless to_a.length <= other.to_a.length
      return to_a.zip(other.to_a).all?{|x,y| x.match(y)}
    end

    def <=>(other)
      return to_a <=> other.to_ex.to_a
    end

    def to_s() return @arr.map(&:to_s).join('') end
    def to_a() return @arr end

    private

    PAREN = {
      '(' => ')',
      '{' => '}',
      '[' => ']',
      '<' => '>',
    }

    class Token
      CHAR_CLASS = {
        :num => 'a-zA-Z0-9',
        :par => PAREN.map{|k,v| "\\#{k}\\#{v}"}.join(''),
      }

      PATTERN = { # must be exhaustive
        /[#{CHAR_CLASS[:num]}]+/                     => :num,
        /[#{CHAR_CLASS[:par]}]/                      => :par,
        /[^#{CHAR_CLASS[:num]}#{CHAR_CLASS[:par]}]+/ => :sep, # otherwise
      }

      def self.tokenize(str)
        scanner = StringScanner.new(str)
        tokens = []

        until scanner.eos?
          PATTERN.each do |p,t|
            tokens << Token.new(t, scanner.matched) if scanner.scan(p)
          end
        end

        return tokens
      end

      def initialize(type, val)
        @type = type
        val = val.to_i if val =~ /^\d+$/
        @val = val
      end

      def to_sym() return @type end
      def to_val() return @val end
      def to_s() return to_val.to_s end

      def match(other)
        return (self <=> other) == 0
      end

      def <=>(other)
        return 1 unless other.is_a?(self.class)

        case [ to_sym, other.to_sym ]
        when [ :num, :sep ]
          return 1
        when [ :sep, :num ]
          return -1
        else
          return to_val <=> other.to_val
        end
      end
    end

    class Sub
      attr_reader :par, :sub

      def initialize(par, sub)
        @par = par
        @sub = sub
      end

      def to_s()
        open = par.to_s
        close = PAREN[open]
        return open + sub.map(&:to_s).join('') + close
      end

      def match(other)
        return false unless other.is_a?(self.class)
        return false unless (par <=> other.par) == 0
        return false unless sub.length <= other.sub.length
        return sub.zip(other.sub).all?{|x,y| x.match(y)}
      end

      def <=>(other)
        return -1 unless other.is_a?(self.class)
        ret = (par <=> other.par)
        return ret unless ret == 0
        return sub <=> other.sub
      end
    end

    def self.match_paren(open, tokens)
      sub = []
      lev = {}
      PAREN.each{|k,v| lev[k]=0}
      inv = PAREN.invert
      close = PAREN[open]

      until tokens.empty?
        tok = tokens.shift()

        if tok.to_sym == :par
          s = tok.to_s
          if s == close && lev[open] <= 0
            break
          elsif PAREN[s]
            lev[s] += 1
          elsif inv[s]
            lev[inv[s]] -= 1
          end
        end

        sub << tok
      end

      return sub
    end

    def self.parse(tokens)
      parsed = []
      tokens = Token.tokenize(tokens) unless tokens.is_a?(Array)

      until tokens.empty?
        tok = tokens.shift()
        if tok.to_sym == :par
          sub = self.match_paren(tok.to_s, tokens)
          parsed << Sub.new(tok, self.parse(sub))
        else
          parsed << tok
        end
      end

      return parsed
    end
  end
end

class Object
  def to_ex()
    return self.is_a?(Report::Exercise) ? self : Report::Exercise.new(self)
  end
end
