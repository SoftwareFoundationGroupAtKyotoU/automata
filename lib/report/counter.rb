require 'clone'
require 'report/exercise'

module Report
  class Counter
    attr_reader :overflow

    def initialize(report)
      @report = report.deep_copy
      @overflow = {}
    end

    def vote(ex)
      # parent node
      return if @report.find{|k,v| ex != k && ex.to_ex.match(k.to_ex)}

      ex = ex.to_ex

      r = @report[ex.to_s]
      unless r # vode on parent node
        r = @report.sort do |a,b|
          a[0].to_ex <=> b[0].to_ex
        end.find do |k,v|
          k.to_ex.match(ex)
        end.last
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
        val = {} unless val
        if (val['required']||0) > 0
          insuf << [ex, val['required']]
        end
      end
      return insuf
    end

    private

    def add_overflow(scheme, ex)
      level = (scheme['level']||'').to_s
      @overflow[level] = [] unless @overflow[level]
      @overflow[level] << ex.to_s
    end
  end
end
