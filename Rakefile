# -*- coding: utf-8 -*-

require 'rake/testtask'
require_relative 'lib/app'
require_relative 'lib/conf'

Rake::TestTask.new do |t|
  t.pattern = 't/**/test*.rb'
end

class App
  def add_user_with_passwd(name,ruby,login,email)
    add_user({
      'name'  => name,
      'ruby'  => ruby,
      'login' => login,
      'email' => email
    })
    set_passwd(login, login)
  end
end

task 'dummy' do
  puts 'Add dummy users.'

  app = App.new

  app.add_user_with_passwd('松村 史郎', 'まつむら しろう', 'matsumura', 'shirou@example.com')
  app.add_user_with_passwd('柏原 高明', 'かしわら たかあき', 'takaaki', 'kashiwara@example.com')
  app.add_user_with_passwd('戸谷 鬼怒子', 'とたに きぬこ', 'kinuko', 'totani@example.com')
  app.add_user_with_passwd('山口 雪絵', 'やまぐち ゆきえ', 'yukie',
    'yama.yama-guti@example.com')
  app.add_user_with_passwd('篠原 慎太郎', 'しのはら しんたろう', 'sin', 'sin@example.com')
  app.add_user_with_passwd('佐久間 ひろよ', 'さくま ひろよ', '1029224532', 'hiro@example.com')
  app.add_user_with_passwd('伴 守', 'ばん まもる', '7427466391', 'ban@example.com')
  app.add_user_with_passwd('Li Mei Kung', '', 'kung', 'LiMeiKung@example.com')
  app.add_user_with_passwd('William M. Mickle', '', 'fuleat', 'WilliamMMickle@example.com')
  app.add_user_with_passwd('Kate J. Roberts', '', 'Somrat', 'KateJRoberts@example.com')
end

task 'htaccess' do
  conf = Conf.new
  ['api'].each do |dir|
    puts("add public/#{dir}/.htaccess")
    open("public/#{dir}/.htaccess", 'a').write <<EOF
AuthType Digest
AuthUserFile "#{conf[:master, :authn, :htdigest]}"
AuthName "#{conf[:master, :authn, :realm]}"
Require valid-user
EOF
  end
end
