# -*- coding: utf-8 -*-

require 'rake/testtask'
require_relative 'lib/app'

Rake::TestTask.new do |t|
  t.pattern = 't/**/test*.rb'
end

task 'dummy' do
  puts 'Add dummy users.'

  app = App.new

  app.add_user('松村 史郎', 'まつむら しろう', 'matsumura', 'shirou@example.com')
  app.set_passwd('matsumura', 'matsumura')
  app.add_user('柏原 高明', 'かしわら たかあき', 'takaaki', 'kashiwara@example.com')
  app.set_passwd('takaaki', 'takaaki')
  app.add_user('戸谷 鬼怒子', 'とたに きぬこ', 'kinuko', 'totani@example.com')
  app.set_passwd('kinuko', 'kinuko')
  app.add_user('山口 雪絵', 'やまぐち ゆきえ', 'yukie', 'yama.yama-guti@example.com')
  app.set_passwd('yukie', 'yukie')
  app.add_user('篠原 慎太郎', 'しのはら しんたろう', 'sin', 'sin@example.com')
  app.set_passwd('sin', 'sin')
  app.add_user('佐久間 ひろよ', 'さくま ひろよ', '1029224532', 'hiro@example.com')
  app.set_passwd('1029224532', '1029224532')
  app.add_user('伴 守', 'ばん まもる', '7427466391', 'ban@example.com')
  app.set_passwd('7427466391', '7427466391')
  app.add_user('Li Mei Kung', '', 'kung', 'LiMeiKung@example.com')
  app.set_passwd('kung', 'kung')
  app.add_user('William M. Mickle', '', 'fuleat', 'WilliamMMickle@example.com')
  app.set_passwd('fuleat', 'fuleat')
  app.add_user('Kate J. Roberts', '', 'Somrat', 'KateJRoberts@example.com')
  app.set_passwd('Somrat', 'Somrat')
end
