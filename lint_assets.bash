#!/bin/bash

npm run lint-fix
find app/assets | grep "\.css$" | grep -v /lib/ | grep -v /bulma/ | xargs -I{} sed -i "s/    /\\t/g" {}
