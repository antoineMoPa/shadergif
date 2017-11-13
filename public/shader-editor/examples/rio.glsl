// Fragment shader
precision highp float;

varying vec2 UV;
varying vec3 v_position;
uniform float time;
uniform float ratio;

vec3 firework(vec2 pos, vec2 fpos, float size,vec3 fcolor, float time_offset){
    vec3 color = vec3(0.0, 0.0, 0.0);
    float ftime = time + time_offset; 
    float radius = 1.0 - (distance(fpos, pos)/size);
    float angle = tan((pos.x - fpos.x) / (pos.y - fpos.y));    
    
    if(distance(pos, fpos) < size){
        color = fcolor * abs(sin(ftime * 1.0 * 3.1416));
        color *= cos(10.0 * angle);
        color *= cos(radius * 20.0 * ftime + 6.0 * time);
    }
    
    // Keep only positive values
    if(color.r < 0.0){
        color.r = 0.0;
    }
    
    if(color.g < 0.0){
        color.g = 0.0;
    }
    
    if(color.b < 0.0){
        color.b = 0.0;
    }
    
    return color;
}

vec3 fireworks(float x, float y){
    vec3 color;
    
    vec2 pos = vec2(x,y);
    
    color = vec3(0.0, 0.0, 0.0);    
    
    color += firework(pos, vec2(0.18,0.2), 0.02, vec3(1.0, 1.0, 0.0),1.0);  
    color += firework(pos, vec2(0.27,0.25), 0.04, vec3(1.0, 0.0, 0.0),2.0); 
    color += firework(pos, vec2(0.2,0.26), 0.03, vec3(0.2, 0.2, 1.0),2.4);
    
    return color;
}

bool in_rect(vec2 pt, vec2 topleft, vec2 bottomright){
    if(pt.x > topleft.x && pt.y < topleft.y){
        if(pt.x < bottomright.x && pt.y > bottomright.y){
            return true;
        }
    }
    return false;
}

vec3 corcovado(float x, float y){
    vec3 color;
    
    vec2 pos = vec2(x,y);
    
    color = vec3(0.0, 0.0, 0.0);    
    
    vec2 head = vec2(0.435,0.437);
    
    float gradient_y = -(y-head.y)/0.0208;
    
    vec3 corcovado_color = vec3(
        2.0 * gradient_y, 
        (2.0 - gradient_y) * 0.9, 
        (1.0 - gradient_y) * 0.6
        );
    
    // Head
    if(distance(head, pos) < 0.004){
        color = corcovado_color;
    }
    
    vec2 body_start = head - vec2(0.004);
    
    if(in_rect(pos, body_start, body_start + vec2(0.008, -0.02))){
        color = corcovado_color;
    }
    
    vec2 arms_start = body_start - vec2(0.01, 0.0);
    
    if(in_rect(pos, arms_start, arms_start + vec2(0.028, -0.0025))){
        color = corcovado_color;
    }
    
    return color;
}

vec4 above_water(float x,float y){
    float r,g,b,a = 1.0;
    
    // Sky
    b = y/3.0;
    g = (1.0 - y)/6.0;
    r = pow(1.0 - y,2.0)/3.0;
    
    bool is_mountain = false;
    
    // beach
    if(y < 0.004 + 0.003 * (sin(3.0 * x + 4.3) + 1.0)){
        vec3 beach_color = 0.6 * vec3(0.5, 0.4, 0.3);
        return vec4(beach_color, 1.0);
    }
    
    if(y < 0.75){
        is_mountain = y < 
            0.6 * (
                0.003 * sin(600.0 * x) + 
                abs(0.1 * sin(1.0 * x - 0.3)) + 
                abs(0.2 * sin(8.0 * x - 2.4)) +
                0.2 * sin(8.0 * x - 2.2) +
                0.1 * sin(13.0 * x - 2.1) +
                0.1 * sin(18.1 * x)
                ) + 0.15;
    }
    
    bool is_building = false;
    
    bool is_building_x = sin(x * 60.0) <  0.8;
    
    bool is_star = false;
    
    if( sin(300.0 * x + 2.0 * cos(x * 3.0)) * 
        (sin(y * 230.0)) > 0.98) {
        if(sin(200.0 * y + cos(x * y * 100.0) + 5.0 * cos(x * 20.0)) > 0.98){
            is_star = true;
        }
    }
    
    is_building = 
        is_building_x && 
        y < 0.06 * sin(floor(10.0 * x)) + 
        0.02 * sin(2.0 * 3.1415) + 
        0.01 * sin(2.0 * 3.1415) 
        + 0.14;
    
    bool is_window = false;
    
    if(is_building){
        is_window = ceil(sin(500.0 * x)) * sin(500.0 * y) > 0.02;
        is_window = is_window && 
            sin(80.0 * x) + cos(40.0 * pow(x,2.0)) + 
            cos(x * y * 500.0) < 0.3;
    }
    
    if(is_star){
        r = 1.0 * (1.0 - 0.6 * sin(3.14 * time + sin(100.0 * y)));
        g = 0.6 * (1.0 - 0.3 * sin(3.14 * time));
        b = 1.0 * (1.0 - 0.3 * sin(3.14 * time));
    }
    
    if(is_mountain){
        r = 0.03 * y + 0.2 - y;
        g = 0.03 + 0.12 - y;
        b = 0.04;
    }
    
    vec3 col = fireworks(x-0.5,y+0.04);
    
    r += col.r;
    g += col.g;
    b += col.b;
    
    col = corcovado(x,y);
    
    r += col.r;
    g += col.g;
    b += col.b;
    
    float mountain_offset = is_mountain? 0.02: 0.0;
    
    // A luz do Maracana
    if(x < 0.8 + mountain_offset + 0.15 * y && x > 0.7 - mountain_offset - 0.15 * y){
        bool is_inside = false;
        if(x < 0.8 + 0.15 * y && x > 0.7 - 0.15 * y){
            is_inside = true;
        }
        
        float yfac = 1.0 - pow(y,3.0);
        
        yfac *= 0.3;
        
        // more light on the mountains
        if(is_mountain && is_inside){
            yfac *= 8.0;    
        } else if(is_mountain) {
            yfac *= 5.0;
        }
        
        r += 0.05 * yfac;
        g += 0.06 * yfac;
        b += 0.06 * yfac;
        
    }
    
    if(is_building){
        r = 0.1;
        g = 0.2;    
        b = 0.3;
    }
    
    if(is_window){
        g = 2.0 + sin(200.0 * x + cos(75.0 * x) +time);
        r = 1.9;
    }
    
    // Buisnesses (colored light spots)
    if(y < 0.03){
        float biz;
        
        biz = 1.0 * floor(2.0 * sin(140.0 * x) + floor(sin(1000.0 * y)));
        biz -= cos(4.0 * x);
        biz -= cos(15.0 * x);
        biz -= cos(10.0 * x);
        
        if(biz > 0.4 && y < sin(14.0 * x)){
            r = 1.1;
            g = 0.3;
        }
        
        biz = 1.0 * floor(2.0 * sin(200.0 * x) + floor(sin(1000.0 * y)));
        
        if(biz > 0.4 && y < 0.008){
            g = 0.6;
        }
        
        biz = 1.0 * floor(2.0 * sin(250.0 * x) + floor(sin(1000.0 * y)));
        biz *= sin(10.0 * x);
        
        if(biz > 0.5 && y < 0.015){
            r = 0.6;
            b = 1.2;
        }
        
    }
    
    return vec4(r,g,b,1.0);
}

vec4 scene(float x, float y){
    vec4 color;
    
    float water_height = 0.3;
    
    if(y > water_height){
        color = above_water(x,y - water_height);
    } else {
        float water_noise = sin(2.0 * 3.1416 * time * sin(100.0 * y));
        float water_x = x 
            + 0.003 * water_noise;
        
        float water_x_2 = x 
            + 0.005 * sin(2.0 * 3.1416 * time * sin(100.0 * y));
        
        color = above_water(water_x,water_height - y);
        
        //color.rgb = pow(color.rgb, vec3(1.2,1.4,1.3));
        
        // Some nice gradient
        color.rgb += 0.4 * abs(sin(1.4 * x + 4.0))/4.0 + y/4.0;
    }
    
    return color;
}

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
    
    float radius = sqrt(pow(x/ratio-0.5,2.0) + pow(y-0.5,2.0));
    
    vec4 color = scene(x,y);
    
    color.rgb *= 1.0 - pow(radius,2.0);
    
    gl_FragColor = color;
}