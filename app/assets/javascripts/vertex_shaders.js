
const vertexShader = `// Vertex Shader
attribute vec3 position;
varying vec2 UV;
varying vec2 lastUV;
varying vec3 v_position;
uniform vec2 renderBufferRatio;

void main(){
    v_position = position;
    UV = vec2((position.x+1.0) / 2.0, (position.y + 1.0)/2.0);
    lastUV = UV / renderBufferRatio;
    gl_Position = vec4(v_position.x,v_position.y, 0.0, 1.0);
}`;

const vertexShaderWebGL2 = `#version 300 es
// Vertex Shader for WebGL2
 
layout(location = 0) in vec3 position;
out vec2 UV;
out vec2 lastUV;
out vec3 v_position;

uniform vec2 renderBufferRatio;

void main(){
    v_position = position;
    UV = vec2((position.x+1.0) / 2.0, (position.y + 1.0)/2.0);
    lastUV = UV / renderBufferRatio;
    gl_Position = vec4(v_position.x,v_position.y, 0.0, 1.0);
}`;

