require 'report/counter'

module Report
  class Source
    class Manual
      attr_reader :data

      def initialize(data, optional, timestamp)
        @data = data || []
        @optional = optional
        @timestamp = timestamp
      end

      def status?() return !@data.empty? end

      def solved() return @data end

      def optional(key) return nil end

      def to_hash()
        hash = { 'status' => status?, 'timestamp' => @timestamp }
        @optional.each{|k| hash[k.to_s] = optional(k)}
        return hash
      end
    end

    class Post
      attr_reader :data

      def initialize(data, optional)
        @data = data
        @optional = optional
      end

      def status?() @data['status'] end

      def solved() @data['report'] || [] end

      def optional(key) return @data[key.to_s] end

      def to_hash()
        hash = {
          'status'    => status?,
          'timestamp' => @data['timestamp'],
        }
        @optional.each{|k| hash[k.to_s] = optional(k)}
        return hash
      end
    end
  end

  class Solved
    def initialize(src)
      @src = src
    end

    def to_hash()
      hash = @src.to_hash
      hash['solved'] = @src.solved
      return hash
    end
  end

  class Record
    def initialize(src, scheme)
      @src = src
      @scheme = scheme
    end

    def to_hash()
      hash = @src.to_hash
      return hash unless @src.status?

      counter = Counter.new(@scheme)
      @src.solved.each{|ex| counter.vote(ex)}

      hash['unsolved'] = counter.insufficient
      counter.overflow.each do |level, solved|
        hash['optional'+level] = solved.sort{|a,b| a.to_ex <=> b.to_ex}
      end

      return hash
    end
  end

  class Log
    def initialize(src)
      @src = src
    end

    def to_hash() return @src.log end
  end
end
