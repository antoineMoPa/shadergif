precision highp float;

varying vec2 UV;
uniform vec2 mouse;
uniform float ratio, time;

void main(void){
	float x = UV.x * ratio;
	float y = UV.y;

	// Position of current point
	vec2 p = vec2(x, y) - vec2(0.5 * ratio, 0.5);

	vec4 col = vec4(0.0);

	vec2 center = vec2(0.0);

	// Also try:
	//center = mouse;

	// Distance of current point to center of circle
	float d = distance(p, center);

	if(d < 0.3 + 0.01 * cos(time * 3.1416 * 2.0)){
		col.rgba = vec4(0.4, 0.5, 0.6, 1.0);
	}

	col.a = 1.0;

	gl_FragColor = col;
}
