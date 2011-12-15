require 'clone'
require 'report/exercise'

module Report
  class Counter
    attr_reader :overflow

    def initialize(report)
      @report = report.deep_copy
      @report = @report.map{|k,v| [ k, { :spec => v, :ex => k.to_ex } ]}
      @report = Hash[*@report.flatten]
      @sorted = @report.sort{|a,b| a[1][:ex] <=> b[1][:ex]}
      @overflow = {}
    end

    def vote(ex)
      ex = ex.to_ex unless ex.is_a?(Exercise)

      # parent node
      return if @report.find{|k,v| ex.to_s != k && ex.match(v[:ex])}

      r = (@report[ex.to_s]||{})[:spec]
      unless r # vode on parent node
        r = @report.sort{|a,b| a[1][:ex]<=>b[1][:ex]}.find do |k,v|
          v[:ex].match(ex)
        end.last
        r = (r||{})[:spec]
      end

      if r
        if (r['required']||0) > 0
          r['required'] = r['required'] - 1
        else
          add_overflow(r, ex)
        end
      else
        add_overflow({}, ex)
      end
    end

    def insufficient()
      insuf = []
      @report.each do |ex, val|
        val[:spec] = {} unless val[:spec]
        if (val[:spec]['required']||0) > 0
          insuf << [val[:ex], val[:spec]['required']]
        end
      end
      return insuf
    end

    private

    def add_overflow(scheme, ex)
      level = (scheme['level']||'').to_s
      @overflow[level] = [] unless @overflow[level]
      @overflow[level] << ex
    end
  end
end
