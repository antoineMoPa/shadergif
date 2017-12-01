# Building a bridge with code

## The bridge's function

First let's start with an empty bridge function:

	precision highp float;

	varying vec2 UV;
	uniform float ratio;
	
	vec4 bridge(vec2 p){
		vec4 col = vec4(0.0);

		// We will code the bridge here

		return col;
	}
	
	
	void main(void){
	    float x = UV.x * ratio;
	    float y = UV.y;
	    
	    vec2 pos = vec2(x, y);
	    
	    vec4 col = vec4(0.0);
	
	    col += bridge(pos);
	
	    col.a = 1.0;
	    
	    gl_FragColor = col;
	}

You should now see that:

![We see nothing yet](building-a-bridge/nothing-at-all-yet.gif)

Marvelous! But let's add actually... things!

In the bridge function, you can begin by plotting a line. Even easier: draw the area below a line:

	float f = 0.5;
    
    if(p.y < f){
    	col.rgb += vec3(0.2, 0.4, 0.0);
    }
	
We now have this:

![Green rectangle](building-a-bridge/area-plot.gif)

But let's say we only want to draw the line of the function.

Here we go, let's replace the function's content with:

	float f = 0.5;
    
    if(distance(p.y, f) < 0.01){
    	col.rgb += vec3(0.2, 0.4, 0.0);
    }

We could also use `abs(p.y - f) < 0.01`, you get the idea. If the point is too far away from the function, we don't draw it.

Result:

![Green line](building-a-bridge/green-line.gif)

Let's say we want that line to be a curve:

	float f = 0.5 + 0.2 * cos(2.0 * p.x);

Result:

![Green curve](building-a-bridge/green-curve.gif)

Now is the time I realize I have not centered my position at `(0,0)`. Screen UV coordinates go from 0 to 1. I prefer working with -0.5 to 0.5 and have 0,0 at the middle of the screen.

In the main, `pos` becomes:

	vec2 pos = vec2(x, y) - vec2(0.5);
	
In the bridge function, `f` becomes:

	float f = 0.0 + 0.2 * cos(2.0 * p.x);

Result:

![cos curve](building-a-bridge/cos-curve.gif)

We got it! We now have a nice bridge. But let's add some detail...

## Bridge supports

In the bridge's function, we could draw many bars in the screen like that:

	if(cos(p.x * 40.0) > 0.9){
    	col.rgb += vec3(0.4, 0.4, 0.2);
    }

The `cos` function with gives cyclic values from -1 to 1 and we can use this fact to draw lines by selecting only places where the result is bigger than 0.9.

![lines](building-a-bridge/lines.gif)

Now I want my supports to be over 0, which will be the horizon, and below `f`, the bridge. So we'll replace our previous bars solution with this:

	if(p.y < f && p.y > 0.0 && cos(p.x * 40.0) > 0.9){
		col.rgb += vec3(0.4, 0.4, 0.2);
    }
	
Which gives us:

![supports](building-a-bridge/supports.gif)

Actually, I want my supports to be taller, because I'd like to code a suspension bridge.

	if(p.y < f + 0.14 && p.y > 0.0 && cos(p.x * 40.0) > 0.9){
    	col.rgb += vec3(0.4, 0.4, 0.2);
    }


![taller supports](building-a-bridge/taller-supports.gif)

I decided to make my supports tinner and draw them only if I did not already draw the bridge's deck:

	vec4 bridge(vec2 p){
		vec4 col = vec4(0.0);
	    
	    float f = 0.0 + 0.2 * cos(2.0 * p.x);
	    
	    if(distance(p.y,f) < 0.01){
	    	col.rgb += vec3(0.2, 0.4, 0.0);
	        
	    } else if (  p.y < f + 0.14           && 
	                 p.y > 0.0                && 
	                 cos(p.x * 40.0) > 0.97       ){
	    	col.rgb += vec3(0.4, 0.4, 0.2);
	    }
	    
		return col;
	}

Result:

![thinner supports](building-a-bridge/thinner-supports.gif)

Now we could go for some cables.

## The cables

For now, I pretty much copy pasted the bridge's deck function and I replaced `f` with `cable_f`. I also put an offset of `0.14` to be at the top of the towers.

In the `bridge` function:

	float cable_f = 0.14 + 0.2 * cos(2.0 * p.x);
    
    if(distance(p.y, cable_f) < 0.01){
    	col.rgb += vec3(0.8, 0.4, 0.0);
    }

Result:

![cable curve](building-a-bridge/cable-curve.gif)


Now we want a function that is synchronised with the supports, so why not add this to `cable_f`:

	cable_f += 0.06 * cos(40.0 * p.x) - 0.06;

Honestly, to find this out, I just put a cos and tried many numbers to multiply `x` until I realised it worked perfectly when it is the same number as in the `cos` for the supports. Sometimes it is faster to randomly type on the keyboard instead of doing math. I also set both 0.06 factors by trial/error, please don't judge me.

Result:

![bridge with cables](building-a-bridge/bridge-with-cables.gif)

Wow, this somewhat looks like a bridge!

If you got there, this is the point where you put a paypal link on your page to get paid for your content (no).

Here is the whole code for now:

	precision highp float;
	
	varying vec2 UV;
	uniform float ratio;
	
	vec4 bridge(vec2 p){
		vec4 col = vec4(0.0);
	    
	    float f = 0.0 + 0.2 * cos(2.0 * p.x);
	    
	    if(distance(p.y,f) < 0.01){
	    	col.rgb += vec3(0.2, 0.4, 0.0);
	        
	    } else if (  p.y < f + 0.14           && 
	                 p.y > 0.0                && 
	                 cos(p.x * 40.0) > 0.97       ){
	    	col.rgb += vec3(0.4, 0.4, 0.2);
	    }
	    
	    float cable_f = 0.14 + 0.2 * cos(2.0 * p.x);
	    
	    cable_f += 0.06 * cos(40.0 * p.x) - 0.06;
	    
	    if(distance(p.y, cable_f) < 0.01){
	    	col.rgb += vec3(0.8, 0.4, 0.0);
	    }
	    
	    
		return col;
	}
	
	
	void main(void){
	    float x = UV.x * ratio;
	    float y = UV.y;
	    
	    vec2 pos = vec2(x, y) - vec2(0.5);
	    
	    vec4 col = vec4(0.0);
	
	    col += bridge(pos);
	
	    col.a = 1.0;
	    
	    gl_FragColor = col;
	}


## Suspender cables

At this point I did some google image search for `suspension bridge parts`. I know the deck is called a deck, the cables are cables, the supports are actually called towers and the smaller cables are suspender cables. Praise the lord for the existence of the internet. 


