# Uniforms in Shadergif

Uniforms are variables set by the backend (Shadergif's javascript code). You can use these values in your shaders to control the way things look and move.


Uniform      | Type          | Description
------------ | ------------- | ------------
`time` | float | Time: goes from 0.0 to 1.0 and repeats
`iGlobalTime` | float | Seconds since UTC day start (mostly for shadertoy compatibility)
`ratio` | float | The screen ratio
`renderBufferRatio` | float | The render buffer ratio when using multi-pas rendering
`iResolutionAttribute` | vec3 | Canvas width, Canvas height, 1.0
`lastPass` | int | Index of the last pass
`pass` | int | Index of the current pass
`pass0` | texture | The texture of first pass
`pass[number]` | texture | the texture of pass [number]
`mouse` | vec2 | Position of the mouse
