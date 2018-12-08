## Introduction to shaders

A shader is a piece of code that runs in the GPU. **Fragment** shaders are used to render surfaces in video games and to do post-processing (applying filters, lens-distortion, etc.).  **Vertex** shaders manipulate 3D and 2D objects in order to place them in the screen, before handling the result to fragment shaders.

Shadergif is mostly about **Fragment** shaders, because it has a vertex shader running in the backend with generates a square which fills the screen. This allows shader programmers to use various 2D and 3D techniques. See some techniques [here](techniques/two-triangles).

There are many shader languages (GLSL, HLSL, etc.). Shadergif works with GLSL. GLSL is a c-like language with bonus types like `vec2`, `mat2` and others. It also comes with many functions that do not come directly with C, such as math functions like `sin`, `cos`, `atan`, `length` (to measure the length of a vector), `distance` (measure a distance between 2 vector coordinates).

To get started with the GLSL language :

* [The Book Of Shaders](https://thebookofshaders.com/00/)


You will enjoy writing shaders if you have had a linear algebra class or if you have at least some vector math background.

* Here is an example of a really quick introduction: (http://blog.wolfire.com/2009/07/linear-algebra-for-game-developers-part-1/)
* Here is a longer one: [http://immersivemath.com/ila/index.html)


## Getting started with Shadergif

When running the Shadergif editor, you will have a canvas on the left which constantly renders the code you type at the right. Don't hesitate to click `examples` in the top bar.

Here is a commented version of the circle example:

    // Just always put that line to avoid warnings and errors
    precision highp float;
    
	// This will give you information on the current pixel you are rendering
    varying vec2 UV;
	// Screen ration (1 if you are using the default 540x540 size)
    uniform float ratio;
    
	// Main code which renders a circle.
	// This function is called for every pixel in the screen
	// by the GPU.
	// You will get different values of UV.x and UV.y.
	// The final color will be set in gl_FragColor,
	// which the GPU will put on the screen.
	// 
	// To draw a circle, you will have to find the distance
	// of the current point (pixel) to the center of the screen.
	// If it is smaller than your radius (0.3 here), you can set 
	// a certain color.
    void main(void){
		// At first, we set the color to black
        vec4 col = vec4(0.0);									// vec4(0.0) is equivalent to vec4(0.0, 0.0, 0.0, 0.0)
    
		// Create a variable containing the position of the center of the circle
		// (in this case, the middle of the screen)
        vec2 center = vec2(0.5,0.5);
		
		// distance is a GLSL function that returns... The distance!
        float distance_from_center = distance(pos, center);
    
		// If we are closer to the center than our radius
        if(distance_from_center < 0.3){
			// Fill the pixel with this color
            col.rgba = vec4(0.4, 0.5, 0.6, 1.0);
        }
		
		// Set the opacity to 1 so we'll actually see something
        col.a = 1.0;
        
		// Pass the pixel color back to OpenGL
        gl_FragColor = col;
    }
