#!/bin/bash

# Compile rails assets and copy them
cd ..

# Start server 10 seconds to render the editor
(	
	export RAILS_ENV=electron;
	export BUILDING_ELECTRON=1;
	rails assets:precompile
	timeout 10 rails server -p 3001 &
	sleep 5
	
	# Get HTML file
	curl http://127.0.0.1:3001/editor > electron/index.html
)


# Get public assets

for element in "public/assets" "public/icons" "public/images" "public/workers" "public/changelog.txt" "app/assets/javascripts/lib"; do
	echo "Getting "$element;
	# Get only last subfolder of path
	# Rev hack to get last field
	electron_path=$(echo $element | rev | cut -f1 -d"/" | rev)
	electron_path="electron/"$electron_path
	if [ -d $electron_path ]; then
		rm -r $electron_path;
	fi
	cp -r $element $electron_path;
done

# Cleanup
rm -r public/assets

cd electron

# editor.js expects this to be there
mv lib/jszip.min.js assets/lib/

# Hack some URLs to fix them
sed -i "s/\/\?assets/\.\/assets/g" index.html
sed -i "s/\/\?assets/\.\/assets/g" assets/editor-*.js
sed -i "s/\/\?icons/\.\/icons/g" index.html
sed -i "s/\/workers/\.\/workers/g" assets/editor-*.js


