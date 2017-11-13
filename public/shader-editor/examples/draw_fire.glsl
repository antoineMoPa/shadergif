//PASSES=3
precision highp float;

varying vec2 UV;
varying vec2 lastUV;
uniform vec2 mouse;
uniform float time;
uniform int pass;
uniform sampler2D pass0;
uniform sampler2D pass1;
uniform sampler2D lastPass;
uniform float ratio;

#define PI 3.14159265359
#define PI2 6.28318

void main(void){
	float x = UV.x * ratio;
	float y = UV.y;
	
	vec2 pos = vec2(x, y) - vec2(0.5);
	
	vec4 col = vec4(0.0);

	if(pass == 1){
		// Original pass: a simple circle
		vec2 center = vec2(0.5,0.5);
		float md = distance(pos, mouse);
		float f = 0.07 + 0.01 * cos(time * PI2) + 0.003 * cos(time * 2.0 * PI2);
		col = vec4(0.0);
		
		if(md < f){
			col.rgba += vec4(0.7, 0.8, 0.8, 1.0) * (1.0 - (md/f)) *
				( 1.0 + 0.4 * cos(pos.x * 300.0 + pos.y * 60.0 + time * PI2));
		}
		
		// Blend in last frame
		col += 0.17 * texture2D(pass1, lastUV + vec2(0.0, 0.0));
		col += 0.17 * texture2D(pass1, lastUV + vec2(0.0, 0.005));
		col += 0.17 * texture2D(pass1, lastUV + vec2(0.005, 0.0));
		col += 0.33 * texture2D(pass1, lastUV + vec2(0.0, -0.02));
		col += 0.17 * texture2D(pass1, lastUV + vec2(-0.005, 0.0));
		
		col.gb *= vec2(0.95, 0.7) + 0.05 * cos(time * PI2);
		col.rgb *= 0.98;
		
	} else if (pass == 2){
		col = texture2D(pass0, lastUV);
	} else if (pass == 3){
		col = texture2D(lastPass, lastUV);
	}

	col.a = 1.0;
	
	gl_FragColor = col;
}
