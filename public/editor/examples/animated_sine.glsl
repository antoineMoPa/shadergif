precision highp float;

varying vec2 UV;
uniform float ratio;
uniform float time;

#define PI2 6.28318530718

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
    
    vec2 pos = vec2(x, y) - vec2(0.5);
    
    vec4 col = vec4(0.0);

    // The function that we will plot
    float function = 0.1 * sin(pos.x * 10.0 + time * PI2);

    // Line width
    float line_size = 0.01;

    // Is the current point close enough to the function?
    if(distance(pos.y, function) < line_size){
        col.rgba = vec4(0.4, 0.5, 0.6, 1.0);
    }

    col.a = 1.0;
    
    gl_FragColor = col;
}
