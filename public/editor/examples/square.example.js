/*

  The render function is called at every frame.

  Parameters:

  can: An html <canvas> element.

	   You can search the internet to find information about canvas methods.

	   Search for: js canvas
				   js canvas fillText
				   js canvas fillRect
				   js canvas drawing paths
				   js canvas arc

  time: The current time in the animation, looping repeatedly from 0.0 to 1.0 
   
 */

// Let's define some constants that we might reuse often
const pi = Math.PI;
const pi2 = pi * 2;

function render(can, time){
	// Get the 2D drawing context
	ctx = can.getContext("2d");

	// Clear screen
	// The 1.0 is for alhpa. Try to put 0.8 to get some motion blur!
	ctx.fillStyle = "rgba(255,255,255,1.0)";
	ctx.fillRect(0,0,can.width,can.height);

	// Choose a color
	ctx.fillStyle = "rgba(140,100,200,1.0)";

	// Position
	
	/*
	   The position at top left is (0,0) 
	   At bottom right, it is (540,540) - unless you change canvas size
	 */
	var x = can.width/2;
	var y = can.height/2;

	// Width, height
	var w = 200;
	var h = 200;

	// Center rectangle
	// Taking into account it's own width
	x -= w/2;
	y -= h/2;

	// Make the rectangle move:
	x += 30 * Math.cos(time * pi2);

	// Draw it!
	ctx.fillRect(x, y, w, h);
}
