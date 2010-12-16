#! /usr/bin/env ruby
$KCODE = 'UTF8'

require 'fileutils'
require 'time'
require 'cgi'
require 'yaml'
require 'tempfile'
require 'tmpdir'
require 'time'

begin
  begin
    cgi = CGI.new

    files = {
      :local  => './local.yml',
      :scheme => './record/scheme.yml',
    }

    err = {
      :require  => 'parameter "%s" is required',
      :invalid  => 'invalid parameter "%s"',
      :capacity => 'over capacity',
      :unzip    => 'unable to unzip the uploaded file',
    }

    yml = {}
    files.each do |name, file|
      yml[name] = YAML.load_file(file) rescue yml[name] = {}
    end

    user_name = cgi.remote_user || yml[:local]['user']

    id = 'report_id'
    rep_id = cgi.params[id][0].read
    raise ArgumentError, (err[:require] % id) unless defined?(rep_id)

    rep_schemes = yml[:scheme]['scheme']
    rep_defined = rep_schemes.any?{|r| r['id'] == rep_id}
    raise ArgumentError, (err[:invalid] % rep_id) unless rep_defined

    src_dir = File.join(File.dirname(__FILE__),
                        'kadai',
                        rep_id,
                        user_name,
                        Time.now.iso8601,
                        'src')
    raise RuntimeError, err[:capacity] if File.exist?(src_dir)

    FileUtils.mkdir_p(src_dir)
    file = cgi.params['report_file'][0]

    unless file.path then
      tmp = Tempfile.open('report.zip')
      tmp.write(file.read)
      file = tmp
    end
    path = file.path
    file.close

    res = system("env unzip #{path} -d #{src_dir} > /dev/null 2>&1")
    raise RuntimeError, err[:unzip] unless res

    entries = Dir.glob("#{src_dir}/*")

    if entries.length == 1 && File.directory?(entries[0]) then
      entries_dir = entries[0]
      Dir.mktmpdir do |tmpdir|
        src_files = Dir.glob("#{entries_dir}/*", File::FNM_DOTMATCH)
        src_file.reject!{|f| f =~ /^\.+/}
        FileUtils.mv(src_files, tmpdir)
        FileUtils.rmdir(entries_dir)
        FileUtils.mv(Dir.glob("#{tmpdir}/*"), src_dir)
      end
    end

    # TODO: make log file (for checked exercises)

    # TODO: run checker
  rescue => e
    # TODO: log the error
  end
ensure
  print cgi.header('status' => '302 Found', 'Location' => './record/')
end
