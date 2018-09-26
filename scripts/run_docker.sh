#!/bin/bash

service mysql start

rails db:create
rails db:migrate

echo ""
echo "WARNING: DEV VERSION - All saved data (including gifs) is lost at each run"
echo ""

rails server

