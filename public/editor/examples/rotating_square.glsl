precision highp float;

varying vec2 UV;
uniform float ratio;
uniform float time;

#define PI 3.14159265359

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
    
    vec2 pos = vec2(x, y);
    
    vec4 col = vec4(0.0);

    // Create an angle from time
    // Multiplying by PI * 2.0 will make
    // the animation seamless. AKA perfect loop.
    float angle = time * PI * 1.0;

    // Place origin (0,0) at middle of screen
    pos -= vec2(0.5);
    
    // Find angle with basic trigonometry
    float original_angle = atan(pos.y, pos.x);
    float distance_from_center = length(pos);

    // Find new angle
    pos.x = distance_from_center * cos(original_angle + angle);
    pos.y = distance_from_center * sin(original_angle + angle);
    
    if(pos.x > -0.2 && pos.x < 0.2){
        if(pos.y < 0.2 && pos.y > -0.2){
            col.rgba = vec4(0.4, 0.5, 0.6, 1.0);
        }
    }

    col.a = 1.0;
    
    gl_FragColor = col;
}
