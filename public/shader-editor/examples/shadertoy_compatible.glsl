#define PI 3.14159265359
#define PI2 6.28318530718

// Comment or uncomment
// (Leave commented if in shadergif)
// (uncomment if in shadertoy)
//#define shadertoy 1

#ifdef shadertoy
// time is iGlobalTime in shadertoy
#define time iGlobalTime
#endif
#ifndef shadertoy
// Define some uniforms
// (which shadertoy already defines for us, but not shadergif)
precision highp float;
uniform float time;
uniform float iGlobalTime;
varying vec2 UV;
uniform vec3 iResolution;
#endif

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy; 
    float ratio = iResolution.x /  iResolution.y;
    uv.x *= ratio;
    
	vec4 col = vec4(0.0);
    
    vec2 pos = uv - vec2(0.5 * ratio, 0.5);

	if(length(pos) < 0.4){
		// Do some magic
		float angle = atan(pos.x, pos.y);
		col.r = cos(angle * 10.0 + time * PI2 + 0.2);
		col.g = cos(angle * 10.0 - time * PI2 + length(pos) * 10.3);
		col.b = cos(angle * 10.0 + time * PI2 + 1.4);
		col *= 1.0 - 2.3 * length(pos);
	}
	
	col.a = 1.0;
    
	fragColor = col;
}

#ifndef shadertoy
void main(){
    vec2 uv = UV.xy * iResolution.xy;
    vec4 col;

    mainImage(col, uv);

    gl_FragColor = col;
}
#endif
