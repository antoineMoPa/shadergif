# Why you should try making small gifs

It is very easy to create a very complex gif that will weight 2Mb. However, it is a **challenge** to make a gif < 100kB.

You should do it for the challenge, but also because smaller gif files means **less bandwidth** and **faster loading**.

Moreover, making small gifs is an exercise in conveying messages in **as few bytes as possible.**

# One liners

Convert final color to black and white:

    col.rgb = vec3(1.0 * length(col.rgb));
	
Reducing color detail:

    col.rgb = 0.1 * floor(col.rgb * vec3(10.0));

Reducing color detail event more:

    col.rgb = 0.5 * floor(col.rgb * vec3(2.0));

# Shape

It will be generally easier for gif tools to make smaller gifs when your shapes are simple. **Try simplifying your objects** and do not put too many wild sinusoidal curves with high periods. 

# Multi-pass

Edge detection could help make smaller gifs.
If you draw only edges and no filling, there is less pixel information to be stored.

# Image size & frame count

Of course, a smaller gif width and/or height and/or length will generally mean a smaller size in bytes. Try with less frames to see if you still like the gif.

# Clip image

Sometimes, you can keep only a part of an image and keep all its meaning. For example, you could set every pixel outside of a certain circle to a black color.
