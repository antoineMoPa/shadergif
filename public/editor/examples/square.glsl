#version 300 es
precision highp float;

in vec2 UV;
out vec4 out_color;
uniform float ratio;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
    
    vec2 pos = vec2(x, y);
    
    vec4 col = vec4(0.0);

    pos.x += 0.02 * time;

    if(pos.x > 0.3 && pos.x < 0.7){
        if(pos.y < 0.7 && pos.y > 0.3){
            col.rgba = vec4(0.4, 0.5, 0.6, 1.0);
        }
    }

    col.a = 1.0;
    
    out_color = col;
}
