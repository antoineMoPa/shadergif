# Angles

Find angle of point relative to (0,0):

    float angle = atan(pos.y, pos.x);

# Rotation matrix

To rotate the scene around (0,0):

	float a = 0.2; // your angle
	pos *= mat2(cos(a), -sin(a), sin(a), cos(a));

# Useful defines

**Put these at the top of your file.**

Define `PI` for future use:

	#define PI 3.14159265359

And why not `PI2`:

	#define PI2 6.28318530718

