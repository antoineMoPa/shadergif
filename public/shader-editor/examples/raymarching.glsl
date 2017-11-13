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

// Cube function
float map(vec3 pos){
    pos = fract(pos) * 2.0 - 1.0;
    
	return length(max(abs(pos) - 0.2, 0.0));
}

/* Walk the ray through the scene */
float trace(vec3 o, vec3 r){
    vec3 p;
    float t = 0.0;
    float d;
    
    for(int i = 0; i < 50; i++){
    	p = o + r * t;
        d = map(p);
        t += d * 0.45;
        
        if(d < 0.04){
        	break;
        }
    }
    
	return t;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy; 
    float ratio = iResolution.x /  iResolution.y;
    uv.x *= ratio;
    
	vec4 col = vec4(1.0);
    
    vec2 pos = uv - vec2(0.5 * ratio, 0.5);
	
    // Create ray (with position and origin) 
    vec3 r,o;	
    
	r = normalize(vec3(pos, 1.0));
    o = vec3(0.0);
    o.z += time;
	
    // Trace
    float t = trace(o, r);
    	
    // Fog function
    col -= 1.3 / (1.0 + t * t * 0.06);
   	
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
