# ImageMagick gif 101

ImageMagick is a classic image editor with a very popular 
command line interface. ImageMagick is used in many web applications. 
It is easily automated and has binding in many languages.

[https://en.wikipedia.org/wiki/ImageMagick](https://en.wikipedia.org/wiki/ImageMagick)

## Basics

To make a gif from the png images in the .zip archive in Linux:

    convert image-*.png anim.gif

For stacked png, on Linux, you can split the result like this:

    convert image.png -crop 540x540 +repage image-%04d.png

And then make gifs:

    convert image-*.png anim.gif

## Dithering

Dithering allows to reduce the image size by reducing the amount of colors:

    convert image-*.png +dither -colors 5  anim.gif

Ordered dither produces nice patterns

2x2:

    convert -ordered-dither 2x2 image-*.png -colors 5 anim.gif

4x4:

	convert -ordered-dither 4x4 image-*.png -colors 5 anim.gif

## Layers optimize

Sometimes, imagemagick can optimize the gif when some parts do not move a log:

    convert image-*.png -layers optimize anim.gif
	
You can combine this with color reduction or dithering. Ex:

    convert image-*.png -ordered-dither 4x4 -layers optimize -colors 5 anim.gif

## Checking the size

The smaller the better load time, so check your gif's size:

    du -h anim.gif

## Viewing your gif

Gnome (Eye of gnome): 

    eog anim.gif

XFCE:

    ristretto anim.gif

KDE:

    # There is surely something, but I don't know it
