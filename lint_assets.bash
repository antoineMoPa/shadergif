#!/bin/bash

find app/assets | grep "\.js$" | grep -v /lib/ | xargs -I{} sed -i "s/    /\\t/g" {}
find app/assets | grep "\.css$" | grep -v /lib/ | grep -v /bulma/ | xargs -I{} sed -i "s/    /\\t/g" {}
