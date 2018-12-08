# With Docker

Run:

	docker pull antoinemopa/shadergif-dev
	docker run -p 3000:3000 -it antoinemopa/shadergif-dev
	
Then, inside the container:

	rails start
	

If you want to bind-mount and have access to the code from outside the docker:

    git clone https://github.com/antoineMoPa/shadergif.git
	docker run -p 3000:3000 -v $(pwd):/editable-shadergif -it antoinemopa/shadergif-dev

Note: Docker has many problems with files, symlinks, shared folders and usability in general on Windows.
I'd recommend to install Ubuntu or Debian in a VirtualBox VM to avoid most problems.

# Without Docker: Installing and running the dev server

Shadergif is a rails app. The instructions here are for Debian-like operating systems.

If you don't have Debian or a Debian-like operating system, you could set up a virtual machine
with Debian.

* Download virtualbox, to run the VM: [virtualbox.org](https://www.virtualbox.org/)
* Download Debian (You will probably want a AMD64 version, which is the architecture of most modern CPUs, including intel): [Debian mirrors list](https://www.debian.org/CD/http-ftp/#stable)

Note: **copy** paste **line by line**.

Some commands need the root password (sudo) and some commands may fail (downloading/building ruby).

	# First, install and build ruby
	sudo apt-get install git binutils zlib1g-dev libssl-dev mariadb-client mariadb-server-10.1 libmariadb-dev libav-tools imagemagick
	mkdir ~/bin
	cd ~/bin
	wget https://cache.ruby-lang.org/pub/ruby/ruby-2.4-stable.tar.gz
	tar -zxvf ruby-*.tar.gz
	cd $(ls | grep "ruby" | grep -v "\.tar\.gz")
	./configure; make; sudo make install
	sudo gem install bundle
	# Create database and user
	# Note, you might need to change 'mariadb' to 'mysql'
	# in the following commands (e.g.: if not using Debian 9+)
	echo "CREATE USER 'shadergif_development'@'localhost' IDENTIFIED BY 'shadergif_dev_password';" | sudo mariadb
	echo "GRANT ALL PRIVILEGES ON shadergif_development.* TO 'shadergif_development'@'localhost';" | sudo mariadb
	echo "GRANT ALL PRIVILEGES ON shadergif_test.* TO 'shadergif_development'@'localhost';" | sudo mariadb
	
	# Then clone the app wherever you like
	cd ~
	git clone https://github.com/antoineMoPa/shadergif.git
   	cd shadergif
	bundle install
	rails db:create
	rails db:migrate
	rails server

Then you can go to 127.0.0.1:3000

# Regenerating thumbnails & previews

There is a task for that:

	rake gifs:recreate_thumbs_and_vids
