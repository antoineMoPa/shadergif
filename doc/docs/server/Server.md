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

# Image/conversion dependencies

	apt-get install libav-tools imagemagick