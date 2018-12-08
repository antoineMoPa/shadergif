# antoinemopa/shadergif-dev
#
# VERSION               0.1

FROM ruby

RUN apt-get update
RUN apt-get install -y git mariadb-client mariadb-server-10.1 libmariadb-dev libav-tools imagemagick
RUN sh -c "service mysql start;\
	echo \"CREATE USER 'shadergif_development'@'localhost' IDENTIFIED BY 'shadergif_dev_password';\" |  mariadb;\
	echo \"GRANT ALL PRIVILEGES ON shadergif_development.* TO 'shadergif_development'@'localhost';\" |  mariadb;\
	echo \"GRANT ALL PRIVILEGES ON shadergif_test.* TO 'shadergif_development'@'localhost';\" |  mariadb"

COPY . shadergif

RUN sh -c 'cd shadergif; bundle install;'

RUN sh -c 'cd shadergif; \
	service mysql start;\
	rails db:create;\
	rails db:migrate;\
	rails db:seed;'

ENTRYPOINT sh -c 'service mysql start; cd shadergif; /bin/bash'