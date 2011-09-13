#! /usr/bin/env ruby

# Usage: user [user=<login>] [type={info|status}]
#             [status={solved|record}] [log] [report=<report-id>]
#   ユーザごとの情報を表示
# Options:
#   user           ログイン名が<login>のユーザの情報のみ取得
#   type   info    ユーザ情報のみ取得(デフォルト)
#          status  提出状況も取得
#   status なし    レポートの提出状況のみ取得
#          solved  解いた問題のリストを取得
#          record  レコード表示用に分類された解答済/未解答の問題のリストを取得
#   log            提出ステータスの詳細ログを取得
#   report         <report-id>のレポートに関する情報のみ取得
# Security:
#   master.su に入っていないユーザに関しては user オプションによらず
#   ログイン名が remote_user の情報のみ取得可能

$KCODE='UTF8'

$:.unshift('./lib')

require 'app'
app = App.new

users = app.users
unless app.params['user'].empty?
  users.reject! do |u|
    !(app.params['user'].include?(u.real_login) ||
      app.params['user'].include?(u.login))
  end
end

if app.params['type'][0] == 'status'
  schemes = app.file(:scheme)['scheme'].reject do |s|
    !app.optional('report').include?(s['id'])
  end

  schemes.each do |s|
    users.each do |u|
      option = {
        :status => app.params['status'][0],
        :log    => !app.params['log'].empty?,
      }
      u[s['id']] = app.report(option, s['id'], u.real_login)
    end
  end
end

print(app.header)
puts(app.json(users.map(&:to_hash)))
