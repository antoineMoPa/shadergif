# Shadergif
#
# VERSION               0.1

FROM ruby

RUN apt-get update
RUN apt-get install -y git mariadb-client mariadb-server-10.1 libmariadb-dev libav-tools imagemagick

RUN mkdir editable

RUN service mysql start &&\
	echo "CREATE USER 'shadergif_development'@'localhost' IDENTIFIED BY 'shadergif_dev_password';" |  mariadb  &&\
	echo "GRANT ALL PRIVILEGES ON shadergif_development.* TO 'shadergif_development'@'localhost';" |  mariadb  &&\
	echo "GRANT ALL PRIVILEGES ON shadergif_test.* TO 'shadergif_development'@'localhost';" |  mariadb


# Run bundle install in temp folder
RUN mkdir tmp_bundle
ADD Gemfile tmp_bundle/
ADD Gemfile.lock tmp_bundle/
RUN sh -c 'cd tmp_bundle; bundle install'

ENTRYPOINT sh -c 'cd editable/shadergif; bash scripts/run_docker.sh; bash'