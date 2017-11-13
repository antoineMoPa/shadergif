//PASSES=3
precision highp float;

varying vec2 UV;
varying vec2 lastUV;
uniform float time;
uniform int pass;
uniform sampler2D lastPass;
uniform float ratio;

#define PI 3.14159265359
#define PI2 6.28318

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
    
    vec2 pos = vec2(x, y);
    
    vec4 col = vec4(0.0);

    if(pass == 1){
        // Original pass: a simple circle
        vec2 center = vec2(0.5,0.5);
        float distance_from_center = distance(pos, center);

        if(distance_from_center < 0.3){
            col.rgba = vec4(0.4, 0.5, 0.6, 1.0);
        }
    } else if (pass == 2){
        // Second pass: have fun with position via an offset
        vec2 pos_offset = vec2(0.0);
        
        pos_offset.x += 0.002 * cos(time * PI2 + pos.y * 100.0);
        col = texture2D(lastPass, lastUV + pos_offset);
        col.r += 0.1 * floor(pos.y * 10.0);
    } else if (pass == 3){
        // Last pass: add some blue and a vignette effect
        col = texture2D(lastPass, lastUV);
        col.b += 0.1 * floor(pos.x * 10.0);
        col = col - 2.0 * pow(distance(UV, vec2(0.5)), 3.0);
    }

    col.a = 1.0;
    
    gl_FragColor = col;
}
