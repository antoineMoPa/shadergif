Shadergif is a rails app. The instructions here are for Debian-like operating systems.

If you don't have Debian or a Debian-like operating system, you could set up a virtual machine
with Debian.

* Download virtualbox, to run the VM: [virtualbox.org](https://www.virtualbox.org/)
* Download Debian (You will probably want a AMD64 version, which is the architecture of most modern CPUs, including intel): [Debian mirrors list](https://www.debian.org/CD/http-ftp/#stable)

# Installing and running the dev server

Dependencies:

	# First, build ruby
	sudo apt-get install git binutils zlib1g-dev libssl-dev mariadb-client mariadb-server-10.1 libmariadb-dev libav-tools imagemagick
	wget ruby-download-url ~/bin
	cd ~/bin
	untar your-ruby-archive
	cd your-ruby-version
	./configure; make; sudo make install
	sudo gem install bundle
    # Create database and user
	echo "CREATE USER 'shadergif_development'@'localhost' IDENTIFIED BY 'shadergif_dev_password';" | sudo mariadb
    echo "GRANT ALL PRIVILEGES ON shadergif_development.* TO 'shadergif_development'@'localhost';" | sudo mariadb
    echo "GRANT ALL PRIVILEGES ON shadergif_test.* TO 'shadergif_development'@'localhost';" | sudo mariadb
    # Then clone the app wherever you like
	git clone https://github.com/antoineMoPa/shadergif.git
   	cd shadergif
	bundle install
    rails db:create
	rails db:migrate
	rails server

Then you can go to 127.0.0.1:3000