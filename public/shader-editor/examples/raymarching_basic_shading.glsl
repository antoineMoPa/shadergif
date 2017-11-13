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
    vec3 p = pos;
    
    pos.xz = fract(pos.xz) - 0.5;
    pos.y += 1.0;
    
    
    return length(max(abs(pos) - 0.2, 0.0));
}

vec3 getNormal(vec3 p, float h){
	vec3 n = vec3(
        map(p + vec3(h,0.0,0.0)) - map(p - vec3(h,0.0,0.0)),
        map(p + vec3(0.0,h,0.0)) - map(p - vec3(0.0,h,0.0)),
        map(p + vec3(0.0,0.0,h)) - map(p - vec3(0.0,0.0,h))
		);
	
    return normalize(n);
}

/* Walk the ray through the scene */
vec4 trace(vec3 o, vec3 r){
    vec4 col = vec4(0.0);
    vec3 p;
    float t = 0.0;
    float d;
    
    for(int i = 0; i < 60; i++){
        p = o + r * t;
        d = map(p);
        t += d * 0.45;
        
        if(d < 0.001){
            break;
        }
    }
    
    vec3 n = getNormal(p, 0.00001);
    
    vec3 lamp = 5.0 * vec3(5.3, 2.2, -10.0);    
	float diffusefac = 0.3 * clamp(dot(n,lamp - p),0.0,1.0);
    float specfac = 1.0 * pow(clamp(length(dot(normalize(o-p),normalize(reflect(lamp-p,n)))),0.0, 1.0),10.0);
    float ambiant = 0.2;
    
    if(d < 0.04){
        col += ambiant + diffusefac + specfac;
    }
    
    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy / iResolution.xy; 
    float ratio = iResolution.x /  iResolution.y;
    uv.x *= ratio;
    
    vec4 col = vec4(0.0);
    
    vec2 pos = uv - vec2(0.5 * ratio, 0.5);
    
    // Create ray (with position and origin) 
    vec3 r,o;    
    
    r = normalize(vec3(pos, 1.0));
    o = vec3(0.0);
    o.z += time;
    
    // Trace
    col += trace(o, r);
    
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
