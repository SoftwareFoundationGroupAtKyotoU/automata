#! /usr/bin/env ruby
$KCODE = 'UTF8'

require 'tempfile'
require 'tmpdir'
require 'fileutils'
require 'cgi'

class String
  def randomize(len=128)
    return Array.new(len).map{ self[rand(self.length)].chr }.join
  end

  def self.random(len=128, src=nil)
    src ||=
      [
       'a'..'z',
       'A'..'Z',
       0..9,
      ].map{|v| v.to_a}.join
    return src.randomize(len)
  end
end

def random_fname()
  return String.random(8) + Time.now.usec.to_s
end

cgi = CGI.new

# working directory
dir = File.join(Dir.tmpdir, 'tester-'+random_fname)
FileUtils.mkdir_p(dir)

begin
  # save posted file
  file = cgi.params['file'][0]
  unless file.path then
    tmp = Tempfile.open('file.zip')
    tmp.write(file.read)
    file = tmp
  end
  path = file.path
  file.close

  # extract archive file
  res = system("env 7z x -o#{dir} #{path} > /dev/null 2>&1")
  raise RuntimeError, :unzip unless res

  # command line argument
  args = []

  # output file (if any)
  output = cgi.params['output'][0]
  if output
    output = output.read
    if output == ':argument'
      # supply random file name to the command line argument
      output = random_fname
      args << output
    end
  end

  # run
  cmd = cgi.params['cmd'][0].read
  result = Dir.chdir(dir) do
    FileUtils.chmod(0755, cmd)
    run = ([ File.join(dir, cmd) ] + args).join(' ')
    if output
      system("#{run} > /dev/null 2>&1")
      File.exist?(output) ? IO.read(output) : ''
    else
      `#{run}`
    end
  end

  # clean up
  FileUtils.rm_r(dir) if File.exist?(dir)

  # result
  print("Content-Type: text/plain; charset=utf-8\r\n\r\n")
  print(result)

rescue => e
  FileUtils.rm_r(dir) if File.exist?(dir)
  raise e
end
