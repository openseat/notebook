unless Vagrant.has_plugin?("vagrant-docker-compose")
  system("vagrant plugin install vagrant-docker-compose")
  puts "Dependencies installed, please try the command again."
  exit
end

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.provider "virtualbox" do |vm|
    vm.memory = 2048
    vm.cpus = 4
  end

  config.vm.network "forwarded_port", guest: 8888, host: 8888,
    auto_correct: true

  config.vm.provision :docker
  config.vm.provision :docker_compose,
    yml: "/vagrant/development.yml",
    rebuild: true,
    run: "always"
end
