Shadergif is a rails app. The instructions here are for Debian-like operating systems.

If you don't have Debian or a Debian-like operating system, you could set up a virtual machine
with Debian.

* Download virtualbox, to run the VM: [virtualbox.org](https://www.virtualbox.org/)
* Download Debian (You will probably want a AMD64 version, which is the architecture of most modern CPUs, including intel): [Debian mirrors list](https://www.debian.org/CD/http-ftp/#stable)

# Installing the server

    apt-get install binutils
	sudo apt-get install git zlib1g-dev libssl-dev
	# wget [ruby download url] ~/bin
	cd ~/bin
	# untar ruby
	# cd your-ruby-version
	./configure; make; sudo make install
	sudo gem install bundle
	
Then clone the app wherever you like

	cd shadergif
	bundle install	

# Installing Image/conversion dependencies

	apt-get install libav-tools imagemagick
	
# Running the server

	rails server
