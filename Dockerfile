# antoinemopa/shadergif-podman
#
# VERSION               0.1

FROM ruby

RUN apt-get update

RUN apt-get install -y mariadb-client mariadb-server-10.5 libmariadb-dev ffmpeg imagemagick
RUN sh -c "service mariadb start;\
	echo \"CREATE USER 'shadergif_development'@'localhost' IDENTIFIED BY 'shadergif_dev_password';\" |  mariadb;\
	echo \"GRANT ALL PRIVILEGES ON shadergif_development.* TO 'shadergif_development'@'localhost';\" |  mariadb;\
	echo \"GRANT ALL PRIVILEGES ON shadergif_test.* TO 'shadergif_development'@'localhost';\" |  mariadb"

# Install node
RUN apt-get install -y nodejs

COPY . /shadergif
RUN sh -c 'cd shadergif; bundle update; bundle install;'

RUN sh -c 'cd shadergif; \
	service mariadb start;\
	rails db:create;\
	rails db:migrate;\
	rails db:seed;'

ENTRYPOINT sh -c 'cd shadergif; bash entrypoint.sh'

# To initialize podman:
#     podman machine init -v $HOME:$HOME
#     podman machine start # stop to save battery with podman machine stop
#
# To build this container:
#     podman build . -t shadergif-podman
#
# To run:
#     podman run -v $(pwd):/shadergif -p 3000:3000/tcp -it shadergif-podman
#
