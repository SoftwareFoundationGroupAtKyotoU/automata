require 'clone'
require 'report/exercise'

module Report
  class Counter
    attr_reader :overflow

    def initialize(report)
      @report = report.deep_copy
      @report = @report.map{|k,v| [ k, { :spec => v, :ex => k.to_ex } ]}
      @report = Hash[*@report.flatten]

      sorted = @report.sort{|a,b| a[1][:ex] <=> b[1][:ex]}
      sorted.each do |k,v|
        parent = sorted.find{|l,w| k!=l && w[:ex].match(v[:ex])}
        if parent
          parent[1][:child] = [] unless parent[1][:child]
          parent[1][:child] << v[:ex]
          v[:parent] = parent[1]
        end
      end

      @overflow = {}
    end

    def vote(ex)
      ex = ex.to_ex unless ex.is_a?(Exercise)

      # parent node
      return if @report[ex.to_s][:child]

      r = (@report[ex.to_s]||{})[:spec]
      r = (@report[ex.to_s][:parent]||{})[:spec] unless r # vode on parent node

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
