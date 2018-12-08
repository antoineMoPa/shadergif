 [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0) 
 [![CircleCI](https://img.shields.io/circleci/project/github/antoineMoPa/shadergif.svg)](https://circleci.com/gh/antoineMoPa/shadergif/tree/master) 

# ShaderGif

[ShaderGif](https://shadergif.com) is a platform for art made with code.

You can make gifs with shaders (glsl) and Javascript (either with raw canvas or with  the coder-friendly p5.js library).

![screenshot](public/screenshot.png?v=1)

# Mission

* Create the shortest path from code to art
* Stay Free (as in freedom) and Open Source (FOSS)
* Make nice gifs

# Features

 * Upload textures
 * Download frames as a png zip
 * Write and receive comments
 * Gif previews - (Easy on visitor GPU, when compared to ShaderToy)

# Supported browsers

Currently, Firefox and Chrome (including chromium) are supported.

# Licence

Shadergif is licenced under the terms of the GNU General Public License v3.0 or later. See LICENCE.txt for the full licence.

## Docker setup

Run:

	docker run -p 3000:3000 -it antoinemopa/shadergif-dev
	
Then, inside the container:

	rails start

## Running ESLint

Running eslint is recommended before pull requests.

In the root shadergif folder:

    npm install
    npm run lint-fix

## Testing

In the root folder:

    rake test

# Documentation

Visit: [doc.shadergif.com](https://doc.shadergif.com)
