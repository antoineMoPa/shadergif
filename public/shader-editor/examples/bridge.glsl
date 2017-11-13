// Fragment shader
precision highp float;

varying vec2 UV;
varying vec3 v_position;
uniform float time;
uniform float ratio;

vec4 stars(vec2 pos){
    float x = pos.x;
    float y = pos.y;
    
    vec4 col = vec4(0.0,0.0,0.0,1.0);
    
    bool is_star = false;
    
    if( sin(300.0 * x + 2.0 * cos(x * 3.0)) * (sin(y * 230.0)) > 0.98) {
        if(sin(200.0 * y + cos(x * y * 100.0) + 5.0 * cos(x * 20.0)) > 0.98){
            is_star = true;
        }
    }
    
    if(is_star){
        col.r = 1.0 * (1.0 - 0.6 * sin(3.14 * time + sin(100.0 * y)));
        col.g = 0.6 * (1.0 - 0.3 * sin(3.14 * time));
        col.b = 1.0 * (1.0 - 0.3 * sin(3.14 * time));
    }
    
    return col;
}

vec4 bridge(vec2 pos){
    vec4 col = vec4(0.0,0.0,0.0,0.0);
    
    float bridge_curve = 0.03 * sin(3.1416 * pos.x) + 0.3;
    
    float bridge_sin = 0.1 * (1.0 - sin(mod(15.0 * pos.x, 3.1416))) + 0.1;
    
    bool is_tower = bridge_sin > 0.1926;
    
    bridge_sin *= 11.0 * pow(bridge_curve,2.0);
    
    bridge_sin += bridge_curve;
    
    // Cables
    if(pos.y < bridge_sin && pos.y > bridge_sin - 0.01){
        col = vec4(0.2,0.2,0.2,1.0);
    }
    
    // Deck
    if(pos.y < bridge_curve && pos.y > bridge_curve - 0.01){
        col = vec4(0.2,0.2,0.2,1.0);
    }
    
    // Lamps
    if(pos.y < bridge_curve + 0.03  && pos.y > bridge_curve){
        
        float height = pos.y - bridge_curve;
        height = height/0.03;
        float time_fac = sin(time * 3.1416 * 2.0) * cos(10.0 * pos.x);
        
        if(abs(cos(pos.x * 60.0)) < 1.0 * pow(1.0 - height,1.0)){
            col = (0.3 + 0.04 * time_fac) * vec4(0.9,0.5,0.2,1.0);
            col.a = 1.0;
        }
        
        // Pole
        if(abs(cos(pos.x * 60.0)) < 0.06){
            col = vec4(0.2,0.2,0.2,1.0);
        }
    }
    
    // Cars
    if(pos.y < bridge_curve + 0.002  && pos.y > bridge_curve){
        float height = pos.y - bridge_curve;
        height = height/0.01;
        vec4 car_col = vec4(0.0,0.0,0.0,1.0);
        
        car_col.r = 1.0 * sin(140.0 * pos.x - 2.0 *  3.1416 * time);
        
        if(car_col.r < 0.0){
            car_col.r = abs(car_col.r);
            car_col.g = car_col.r;
            car_col.b = 0.1 * car_col.r;
        }
        
        car_col *= 0.3 * (1.0 - pow(height - 0.5,2.0));
        
        col += car_col;
    }
    
    
    // Hangers
    if(pos.y < bridge_sin - 0.01 && pos.y > bridge_curve){
        if(abs(cos(100.0 * pos.x)) < 0.1){
            col.r = 0.4;
            col.g = 0.3;
            col.b = 0.2;
            col.a = 1.0;
        }   
    }
    
    // Towers
    if(pos.y < bridge_sin - 0.01  && pos.y > 0.2 && is_tower){
        col = vec4(0.2,0.2,0.2,1.0);
    }
    
    return col;
}

vec4 scene(vec2 pos){
    vec4 col = vec4(0.0);
    
    if(pos.y > 0.2){
        col += stars(pos);
    }
    
    // Moon
    float moon_dist = distance(pos, vec2(0.33,0.66));
    float moon_fac = 0.1 * (1.0 - moon_dist);
    
    moon_fac += 0.6 * pow(1.0 - moon_dist, 20.0);
    
    if(moon_dist > 1.0){
        moon_fac = 0.0;
    }
    
    moon_fac *= 1.0 + 0.0063 * cos(time * 3.1416 * 2.0);
    
    
    if(moon_dist < 0.03){
        moon_fac *= 0.0;
        col = 1.0 * vec4(1.0,1.0,1.0,1.0);
        col.rgb *= 0.86;
        col.rgb -= 0.08 * abs(cos(pos.x * cos(pos.y * 300.0) * 250.0));
    }
    
    // Mountains
    if(pos.y < 0.3 && pos.y > 0.2){
        float y = (pos.y - 0.2)/0.1;
        float mountain_line = sin(-6.0 * pos.x + 0.5);
        mountain_line += 0.3 * sin(-3.0 * pos.x + 1.5);
        
        if(y < mountain_line){
            col = vec4(0.1,0.1,0.1,1.0);
        }
    }
    
    vec4 b = bridge(pos);
    col = b * b.a + col * (1.0 - b.a);
    
    col += 1.6 * moon_fac;
    
    return col;
}

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
    
    vec2 pos = vec2(x, y);
    
    
    vec4 col = vec4(0.0);
    
    // Sky
    col.b = 0.4 * y;
    col.g = 0.2 * y;
    col.a = 1.0;
    
    col += scene(pos);
    
    vec2 ref_pos = pos;
    
    ref_pos.y = -ref_pos.y + 0.4;
    
    
    if(pos.y < 0.2){
        col.g = 0.3;
        col.b = 0.4;
        // Water shading
        col -= 0.01 * cos(100.0 * sin(x * y * 10.0) * cos(20.0 * y) + time);
        // Waves
        ref_pos += vec2(0.006 * 
                        sin(5003.0 * pow(1.0-y,3.0) + 2.0 * time * 3.1416)
            );
    }
    
    col += 0.8 * scene(ref_pos);
    
    // Some forced gradient
    col += 0.2 * y;
    
    // Some shading
    col -= 0.03 * abs(3.0 * cos(x));
    
    gl_FragColor = col;
}
