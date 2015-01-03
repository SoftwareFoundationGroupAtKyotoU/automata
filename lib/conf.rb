# coding: utf-8
require 'pathname'
require 'yaml'

require 'bundler/setup'
require 'kwalify'

class Conf
  # same as for app.rb ...
  def self.find_base(dir)
    e = Pathname.new(__FILE__).expand_path.parent.to_enum(:ascend)
    e.map { |x| x + dir.to_s }.find(&:directory?)
  end

  CONFIG = find_base(:config)
  SCHEMA = CONFIG + 'schema'
  FILES = {
    master:        CONFIG + 'master.yml',
    local:         CONFIG + 'local.yml',
    template:      CONFIG + 'template.yml',
    scheme:        CONFIG + 'scheme.yml',
    master_schema: SCHEMA + 'master.yml'
  }

  # Access to configs.
  # @param [Array<Symbol>] symbols describe the path to a config
  # @example
  #   # logger.path in master.yml
  #   conf[:master, :logger, :path]
  def [](*keys)
    @hash ||= Hash.new{|h, k|
      case k
      when 'master'
        yml = load_yaml(FILES[:master])
        verify_conf(yml, :master_schema)
        h[k] = yml.merge(begin load_yaml(FILES[:local]) rescue {} end)
      when 'scheme'
        h[k] = load_yaml(FILES[:scheme])
      when 'template'
        yml = load_yaml(FILES[:template])
        h[k] = yml.merge(begin load_yaml(FILES[:local]) rescue {} end)
      else
        raise "unknown config file: #{k}"
      end
    }
    return keys.inject(@hash){|acc, key| (acc || {})[key.to_s]}
  end

  private
  def load_yaml(pathname)
    return File.open(pathname, 'r:utf-8'){|f| YAML.load(f,pathname)}
  end

  # Verify a config file.
  # @param [Hash] a YAML object of a config file
  # @param [Symbol] a config name
  # @raise [RuntimeError] if schema or config files are malformed
  def verify_conf(yml, name)
    def check(e, msg)
      raise e.inject(msg){|acc, e|
        acc += "[#{e.path}] #{e.message}\n"
      } if e && !e.empty?
    end
    schema = load_yaml(FILES[name])
    check(Kwalify::MetaValidator.instance.validate(schema),
          "Internal error: schema '#{name}'\n")
    check(Kwalify::Validator.new(schema).validate(yml),
          "Config file error: '#{name}'\n")
  end
end
