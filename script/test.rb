#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

Dir.chdir(File.dirname(File.expand_path($0)))

require 'fileutils'
require 'yaml'
require 'time'

require_relative 'helper'
require_relative '../lib/conf'
require_relative '../lib/log'
require_relative '../lib/report/counter'
require 'zip'

report_id = $*.shift
user      = $*.shift
post_tz   = $*.shift

helper = Helper.new(report_id, user, post_tz)

err = {
  fatal: '自動テストを実行できませんでした; TAに問い合わせて下さい',
  fail:  '自動テストがうまく実行されませんでした; 実装を確認して下さい'
}
ZIP = 'test.zip'

dir = {}
dir[:test] = helper.dir[:user] + 'test'

conf = helper.merged_conf(:master, :check, :default, :test)

info = nil

begin
  unless File.exist?(dir[:test].to_s)
    raise RuntimeError, "'#{dir[:test]}' not found"
  end

  exit if conf.empty?

  run = conf['run']
  fs = conf['files']
  output = conf['output']
  output = output.is_a?(Symbol) ? ':'+output.to_s : output

  cmd =
    [ 'curl',
      "-F 'file=@#{ZIP}'",
      "-F 'cmd=#{run}'",
      output && "-F 'output=#{output}'",
      conf['sandbox'],
    ].compact.join(' ')

  result = Dir.chdir(dir[:test].to_s) do
    check =
      [ proc{ File.exist?(ZIP) && FileUtils.rm(ZIP); true },
        proc{ fs.all?{|x| !(Dir.glob(x).empty?) }},
        proc{ Zip::File.open(ZIP, Zip::File::CREATE) do |zf|
            fs.map{|x| Dir.glob(x).map{|x| zf.add(x,x) }}
          end; true }
      ].all?(&proc{|x| x.call})

    result = nil
    result = `#{cmd}` if check
    result = nil unless $? == 0

    result
  end

  raise RuntimeError, cmd unless result

  def result_ok?(r)
    /^\s*ok\s*$/i =~ (r['result']||'')
  end

  status = 'check:NG'
  begin
    result = YAML.load(result) || []
    passed = result.count{|r| result_ok?(r) }
    log = { 'test' => { 'passed' => passed, 'number' => result.size } }


    # status turns out be 'report' if there are no required exercises

    ng_exs = {}
    result.each do |r|
      ng_exs[r['ex']] = true unless result_ok?(r)
    end

    counter = Report::Counter.new((Conf.new)[:scheme, :report, report_id] || {})
    result.map {|r| r['ex']}.uniq.each do |ex|
      counter.vote(ex.to_ex) unless ng_exs.has_key?(ex)
    end

    status = 'report' if counter.insufficient.empty?

  rescue => e
    log = { 'error' => err[:fail], 'reason' => e.to_s }
  end

  info = {
    'status'    => status,
    'timestamp' => Time.now.iso8601,
    'log'       => log,
    'test'      => result
  }

rescue => e
  info = {
    'status'    => 'check:NG',
    'timestamp' => Time.now.iso8601,
    'log'       => {
      'message' => err[:fatal],
      'reason'  => e.to_s,
    },
  }
end

Log.new(helper.file[:log]).write(:data, post_tz, info)
