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
      ex = ex.to_ex
      r = @report[ex.to_s]
      r = (@report.find{|k,v| k.to_ex.match(ex)}||[]).last unless r
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
        insuf << [ex, val['required']] if (val['required']||0) > 0
      end
      return insuf.sort{|a,b| a[0].to_ex <=> b[0].to_ex}
    end

    private

    def add_overflow(scheme, ex)
      level = (scheme['level']||'').to_s
      @overflow[level] = [] unless @overflow[level]
      @overflow[level] << ex.to_s
    end
  end
end
