#version 300 es
precision highp float;

in vec2 UV;
out vec4 out_color;
uniform float ratio;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
    
    vec2 pos = vec2(x, y) - vec2(0.5);
    
    vec4 col = vec4(0.0);

    vec2 center = vec2(0.0);
    float distance_from_center = distance(pos, center);

    if(distance_from_center < 0.3){
        col.rgba = vec4(0.4, 0.5, 0.6, 1.0);
    }

    col.a = 1.0;
    
    out_color = col;
}
