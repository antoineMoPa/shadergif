# antoinemopa/shadergif-dev
#
# VERSION               0.1

FROM ruby

RUN apt-get update

RUN apt-get install -y git mariadb-client mariadb-server-10.5 libmariadb-dev ffmpeg imagemagick
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

ENTRYPOINT sh -c 'service mariadb start; cd shadergif; bundle install; rails db:migrate; /bin/bash'

# To use this container:
#     docker run -p 3000:3000 -v -it antoinemopa/shadergif-dev
#
# Bonus: to use this with the repo from outside (bind mount with current folder)
#     docker run -p 3000:3000 -v $(pwd):/shadergif -it antoinemopa/shadergif-dev
#
# After starting, run 'rails s'