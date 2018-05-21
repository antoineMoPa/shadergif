#!/bin/bash

export RAILS_ENV=electron;
echo $(sleep 3; yarn electron http://127.0.0.1:3001/editor) &
rails server -p 3001

	
