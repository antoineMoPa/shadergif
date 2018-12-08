<style>
a button{
	background:#3f51b5;
	color:#fff!important;
	padding:10px;
	border-radius:2px!important;
	box-shadow:0 0 8px rgba(0,0,0,0.4);
	transition:all 0.3s;
	cursor:pointer;
}
a button:active, a button:hover{
	box-shadow:0 0 4px rgba(0,0,0,0.3);
}
</style>

# Introduction

ShaderGif is a platform created to help you make art with code.

Currently, there are 2 main languages supported: Javascript and GLSL (Shaders).

# Supported platforms

## Javascript

Javascript allows many types of creative 2D works: particles, fractals, games, etc. It is probably the most popular language worldwide, since it powers almost all of the web pages you browse everyday.

If you are familiar with Javascript, you can go to the editor and use the &lt;canvas&gt; API to render creative animations by selecting **Javascript** in the editor selector: <a href="https://shadergif.com/editor/selector" target="_blank">shadergif.com/editor/selector</a>

If you are not already familiar with Javascript*, you might prefer starting with p5.js, which is a library integrated as a ShaderGif platform. In this case, go to the next section. 

*Note: Even if you are a Javascript expert, p5.js will give you even more power! 

The Javascript rendering in ShaderGif works by calling your `render(canvas, time)` function at every frame. You can then write `ctx = canvas.getContext("2d");` and perform any operation with `ctx`. The `time` argument loops constantly from 0 to 1. When time is 1, it would be the end of your gif recording.

To learn how you can use the canvas context, I suggest you start with the MDN guide&nbsp;: <a href="https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D" target="_blank">CanvasRenderingContext2D</a>

<a href="https://shadergif.com/editor/selector" target="_blank"><button>Get Started!</button></a>

## Javascript with p5.js

p5.js is a library with useful functions to draw objects. To launch ShaderGif in p5.js mode, head to <a href="https://shadergif.com/editor/selector" target="_blank">shadergif.com/editor/selector</a> and select **p5.js**. Take time to read the provided code at the right.

You will see the `setup()` and `draw()` functions which are present in all p5.js sketches.

Take time to read the header and comments. From there, I suggest you look at the 5.js <a href="https://p5js.org/reference/" target="_blank">Reference</a> for a list of available functions with documentation. Also, have a look at their <a href="https://p5js.org/examples/" target="_blank">Examples</a> to help you get started.

## Using the GPU with GLSL

GLSL is a Shading language that runs in your GPU. It can be used to create epic visual effects.

If you have never coded with shaders, I suggest you read [coding with shaders](coding-with-shaders.md).

<a href="https://shadergif.com/editor/selector" target="_blank"><button>Get Started!</button></a>
