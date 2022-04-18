#!/bin/bash

service mariadb start;
bundle install;
rails db:migrate;
rails s -b 0.0.0.0
