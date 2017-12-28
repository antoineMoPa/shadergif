# GLSL tips and snippets

Here are some of my favorite copy-pasta recipes:

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

To get the circular coordinates of a point:

	#define ANGLE(p) atan(p.y, p.x)
	#define CIRCULAR(p) vec2(ANGLE(p), length(p));
	#define INV_CIRCULAR(c) vec2(c.y * cos(c.x), c.y * sin(c.x));

Usage example:

	vec2 c = CIRCULAR(p);

	c.y += 0.1 * cos(c.x * 20.0);
	
	p = INV_CIRCULAR(c);

