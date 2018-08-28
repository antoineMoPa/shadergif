# ShaderGif

[ShaderGif](https://shadergif.com) is a GLSL editor loaded with a gif generator.

![screenshot](public/screenshot.png)

# Goals

* Avoid compiling shaders on visitor's GPU
* Be free and open source
* Make nice gifs

# Features

 * Upload textures
 * Download frames as a png zip
 * Create gifs
 * Write and receive comments
 * Gif previews - (Easy on visitor GPU, when compared to ShaderToy)

# Experimental Features

I do not test these often when releasing, so they might be broken sometimes.

 * GPU sound (experimental, be careful with your ears/speakers)
 * MathJS prototyping mode (experimental)

Write an issue or send me an email if you want to try it and it is broken.

# Licence

Shadergif is licenced under the terms of the GNU General Public License v3.0 or later. See LICENCE.txt for the full licence.

# You want to code ShaderGif ?

A good first step would be to setup a local dev server:

https://doc.shadergif.com/Development/Server/

ShaderGif is coded with ruby on rails with some Vue.js in the frontend and lots of custom Javascript. Indentation should be with tabs.

# Documentation

Visit: [doc.shadergif.com](https://doc.shadergif.com)

To contribute to the documentation, install mkdocs. The text is in the `doc` folder.
