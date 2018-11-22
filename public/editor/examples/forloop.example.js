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
	let ctx = can.getContext("2d");

	// Clear screen
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0,0,can.width,can.height);


	// Choose color
	ctx.fillStyle = "rgba(140,100,200,1.0)";

	/*
	  Be careful about infinite loops
	  I suggest you begin by commenting the code:

	  // for(var i = 0; i < 10; i++)

	  When you are finished typing and you are 85% sure it
	  is not an infinite-loop, uncomment it.

	  There is some protection for infinite "for" loops,
	  but it is not perfect.

	  You can contribute to the code if you want
	  to improve infinite loop detection!
	*/
	for(var i = 0; i < 10; i++){
		// Choose size
		var spreadRadius = 100;

		// Spread each 10 points on all angle from 0 to pi * 2
		var angle = i/10 * pi2;
		// Make it move at the difference in angle between 2 points
		// (it will look infinite)
		angle += time / 10 * pi2;

		// Choose position
		// The Math.cos/sin finds the position of the point
		// according to angle:
		//
		//
		//  y ^   .
		//	|    /
		//	| r /
		//	|  /_     y = r * sin(a)
		//	| /   a
		//	|/______|____> x
		//
		//    x = r * cos(a)
		//
		// the width and height / 2 moves  centers the scene
		var x = can.width/2 + spreadRadius * Math.cos(angle);
		var y = can.height/2 + spreadRadius * Math.sin(angle);

		// Radius of the small circles
		var radius = 20;
		radius += 10 * Math.cos(time * pi2 + angle);

		// Draw it
		ctx.beginPath();
		// The last parameters are fromAngle and toAngle
		// (The function also allows making a part of a circle)
		ctx.arc(x, y, radius, 0, pi2);
		// Draw our path
		ctx.fill();
	}
}
