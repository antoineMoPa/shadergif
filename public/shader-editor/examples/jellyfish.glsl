// Fragment shader

#define PI 3.141592653589793

precision highp float;

varying vec2 UV;
varying vec3 v_position;
uniform float time;
uniform float ratio;

bool in_rect(vec2 pt, vec2 topleft, vec2 bottomright){
    if(pt.x > topleft.x && pt.y < topleft.y){
        if(pt.x < bottomright.x && pt.y > bottomright.y){
            return true;
        }
    }
    return false;
}

vec4 tentacles(vec2 pos){
    vec4 col = vec4(0.0);

    if(pos.x > 0.5){
        return col;
    }

    for(int i = 0; i < 5; i++){
        float shape = 0.7 - float(i) * 0.1;
        float time_offset = 2.0 * float(i);
        shape += 0.01 * sin(60.0 * pos.x + time * 2.0 * PI + time_offset);
        shape += 0.015 * sin(30.0 * pos.x + time * 2.0 * PI);

        shape += 0.04 * sin(10.0 * pos.x + time * 2.0 * PI);
        
        float size = 0.03;
        float black_line = 0.02;
        
        if( pos.y < shape + size + black_line &&
            pos.y > shape - size - black_line ){
            col = vec4(0.0, 0.0, 0.0, 1.0);
            if(pos.y < shape + size && pos.y > shape - size){
                col = vec4(0.3, 0.2, 0.4, 1.0);
            }
        }
    }
    
    return col;
}

vec4 trippy_circle(vec2 pos){
    vec4 col = vec4(0.0);
    
    float dist = distance(pos, vec2(0.5,0.5));

    float angle = abs(atan(pos.y - 0.5, pos.x - 0.5));

    angle = pow(angle, 3.0);
    
    float off = 0.01 * (sin(angle + 2.0 * PI * time) + 1.0);

    if(dist < 0.4  - off){
        col = vec4(0.3, 0.2, 0.4, 1.0);
        if(dist > 0.38 - off){
            col = vec4(0.0, 0.0, 0.0, 1.0);
        }
    }

    return col;
}

vec4 eye(vec2 pos){
    vec4 col = vec4(0.0);
    
    vec2 eye_pos = vec2(0.6, 0.6);
    float eye_size = 0.03;

    eye_pos.x -= 0.4 * eye_size * cos(2.0 * PI * time);
    eye_pos.y -= 0.4 * eye_size * sin(2.0 * PI * time);
    
    if(distance(pos, eye_pos) < 0.1){
        col = vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec2 dot_pos = eye_pos + eye_size / 2.0;

    if(distance(pos, dot_pos) < eye_size){
        col = vec4(1.0, 1.0, 1.0, 1.0);
    }
    
    return col;
}

vec4 eyes(vec2 pos){
    vec4 col = vec4(0.0);

    col += eye(pos);
    col += eye(pos - vec2(0.23, 0.0));
    
    return col;
}

vec4 background(vec2 pos){
    vec4 col = vec4(0.0, 0.1, 0.2, 1.0);

    float linex = pos.x;

    linex += cos(2.0 * pos.y + 5.0);
    linex += 0.02 * cos(2.0 * PI * time + 10.0 * pos.y);
        
    float lines = 0.2 * pow(cos(8.0 * linex), 2.0);
    
    col += 0.6 * lines;

    col += 0.3 * pos.y;
    
    return col;
}

vec4 jellyfish(vec2 pos){
    vec4 temp;
    vec4 col = vec4(0.0);
    pos = pos + vec2(0.5, -0.5);
    
    temp = tentacles(pos);
    col = temp.a * temp + (1.0 - temp.a) * col;
    temp = trippy_circle(pos);
    col = temp.a * temp + (1.0 - temp.a) * col;
    temp = eyes(pos);
    col = temp.a * temp + (1.0 - temp.a) * col;
    
    return col;
}

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;

    vec2 pos = vec2(x, y);
    
    // Water background
    vec4 col = vec4(0.0, 0.1, 0.2, 1.0);

    col += 0.1 * background(pos);

    vec4 jfish = jellyfish(pos + vec2(-0.5, 0.5));

    col += jfish;
    
    col += 0.2 * jfish.a *
        tan(2.0 * background(pos + vec2(0.23, 0.0)));

    gl_FragColor = col;
}
