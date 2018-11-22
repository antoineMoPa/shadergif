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
    ctx = can.getContext("2d");
 
    // Clear screen
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,can.width,can.height);
    
	// Choose color
    ctx.fillStyle = "rgba(140,100,200,1.0)";

	// Choose position
	var x = can.width/2;
	var y = can.height/2;
	// Choose size
	var radius = 100;

	// Animate the size!
	radius += 10 * Math.cos(time * pi2);
	
	// Draw it
    ctx.beginPath();
	// The last parameters are fromAngle and toAngle
	// (The function also allows making a part of a circle)
    ctx.arc(x, y, radius, 0, pi2);
	// Draw our path
    ctx.fill();
}
