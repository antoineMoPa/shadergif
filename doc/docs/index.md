# Introduction

## Introduction to shaders

A shader is a piece of code that runs in the GPU. **Fragment** shaders are used to render surfaces in video games and to do post-processing (applying filters, lens-distortion, etc.).  **Vertex** shaders manipulate 3D and 2D objects in order to place them in the screen, before handling the result to fragment shaders.

Shadergif is mostly about **Fragment** shaders, because it has a vertex shader running in the backend with generates a square which fills the screen. This allows shader programmers to use various 2D and 3D techniques. [See some 2D techniques here](techniques/two-triangles) 

There are many shader languages (GLSL, HLSL, etc.). Shadergif supports GLSL. GLSL is a c-like language with bonus type like `vec2`, `mat2` and others.

To get started with the language, you can start here :

[The Book Of Shaders](https://thebookofshaders.com/00/)

## Introduction to Shadergif

When running the shadergif editor, you will have a canvas on the left which constantly renders the code you type at the right. Don't hesitate to click `examples` in the top bar. For example, you could start with a circle:

    // Just always put that line and don't ask questions
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
        float x = UV.x * ratio;
        float y = UV.y;
        
        vec2 pos = vec2(x, y);
        
        vec4 col = vec4(0.0);
    
        vec2 center = vec2(0.5,0.5);
        float distance_from_center = distance(pos, center);
    
        if(distance_from_center < 0.3){
            col.rgba = vec4(0.4, 0.5, 0.6, 1.0);
        }
    
        col.a = 1.0;
        
        gl_FragColor = col;
    }
