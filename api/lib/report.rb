require 'report/counter'

module Report
  class Source
    class Manual
      attr_reader :data

      def initialize(data)
        @data = data
      end

      def status?() return !@data.empty? end

      def solved() return @data end

      def to_hash()
        return { 'status' => status? }
      end
    end

    class Post
      attr_reader :data

      def initialize(data)
        @data = data
      end

      def status?() @data['status'] end

      def solved() @data['report'] end

      def to_hash()
        return {
          'status'    => status?,
          'timestamp' => @data['timestamp'],
        }
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

      counter = Counter.new(@scheme)
      @src.solved.each{|ex| counter.vote(ex)}

      hash['unsolved'] = counter.insufficient
      counter.overflow.each do |level, solved|
        hash['optional'+level] = solved
      end

      return hash
    end
  end
end
