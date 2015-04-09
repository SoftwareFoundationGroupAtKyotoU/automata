# -*- coding: utf-8 -*-

require 'rake/testtask'
require_relative 'lib/app'
require_relative 'lib/conf'

Rake::TestTask.new do |t|
  t.pattern = 't/**/test*.rb'
end

class App
  def add_user_with_passwd(name, ruby, login, email)
    u = add_user(
      'name'  => name,
      'ruby'  => ruby,
      'login' => login,
      'email' => email
    )
    if u
      puts "Add user #{login}."
      set_passwd(login, login)
      return true
    end
    false
  end
end

task 'dummy' do
  app = App.new

  def app.su?
    true
  end

  dummy_users = [
    ['松村 史郎', 'まつむら しろう', 'matsumura', 'shirou@example.com'],
    ['柏原 高明', 'かしわら たかあき', 'takaaki', 'kashiwara@example.com'],
    ['戸谷 鬼怒子', 'とたに きぬこ', 'kinuko', 'totani@example.com'],
    ['山口 雪絵', 'やまぐち ゆきえ', 'yukie', 'yama.yama-guti@example.com'],
    ['篠原 慎太郎', 'しのはら しんたろう', 'sin', 'sin@example.com'],
    ['佐久間 ひろよ', 'さくま ひろよ', '1029224532', 'hiro@example.com'],
    ['伴 守', 'ばん まもる', '7427466391', 'ban@example.com'],
    ['Li Mei Kung', '', 'kung', 'LiMeiKung@example.com'],
    ['William M. Mickle', '', 'fuleat', 'WilliamMMickle@example.com'],
    ['Kate J. Roberts', '', 'Somrat', 'KateJRoberts@example.com']
  ]

  cnt = 0
  dummy_users.map do |u|
    cnt += 1 if app.add_user_with_passwd(u[0], u[1], u[2], u[3])
  end
  puts "Added #{cnt} users."
end

task 'htaccess' do
  conf = Conf.new
  ['api'].each do |dir|
    path = "public/#{dir}/.htaccess"
    if File.exist?(path)
      print "#{path} already exists. Rewrite it (y or N)? "
      next if STDIN.gets !~ /^y/i
    end
    puts "Create #{path}"
    open(path, 'w').write <<EOF
AuthType Digest
AuthUserFile "#{conf[:master, :authn, :htdigest]}"
AuthName "#{conf[:master, :authn, :realm]}"
Require valid-user
EOF
  end

  if conf[:master, :authn_account]
    htdigest = conf[:master, :authn_account, :htdigest]
    puts "Create #{htdigest}"
    htd = WEBrick::HTTPAuth::Htdigest.new(htdigest)
    htd.set_passwd(
      conf[:master, :authn_account, :realm],
      conf[:master, :authn_account, :user],
      conf[:master, :authn_account, :passwd]
    )
    htd.flush

    htaccess =
      Pathname.new(File.dirname(File.expand_path(__FILE__))) +
      'public/account/.htaccess'
    puts "Create #{htaccess}"
    open(htaccess, 'w') do |io|
      io.write <<-EOF
AuthType Digest
AuthUserFile "#{htdigest}"
AuthName "#{conf[:master, :authn_account, :realm]}"
Require valid-user
      EOF
    end
  else
    # remove auth files
  end
end

task 'verify' do
  Conf.new.verify_config
end
