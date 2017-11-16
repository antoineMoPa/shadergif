/*
  Resources: 
  
  * https://gist.github.com/mbostock/5440492
  * http://memfrag.se/blog/simple-vertex-shader-for-2d
  * https://www.opengl.org/wiki/Data_Type_%28GLSL%29#Vector_constructors
  * https://www.opengl.org/wiki/Built-in_Variable_%28GLSL%29
  * https://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf

  */

var sg_api = window.location.protocol + "//" + window.location.host + ":4002/api";

var is_example = window.location.href.match(/\?file\=([_a-zA-Z0-9\/]+\.glsl)/);
var DEFAULT_WIDTH = 540;
var DEFAULT_HEIGHT = 540;
var cm_errorLines = [];

function default_fragment_policy(){
    var code = "";
    
    if(window.localStorage.code != undefined && window.localStorage.code != ""){
        code = window.localStorage.code;
    } else {
        code = load_script("default-fragment-shader");
    }

    return code;
}

var app = new Vue({
    el: "#shadergif-app",
    data: {
        canvas: null,
		has_sg_api: false,
		sound_mode: false,
		send_status: "",
        error: "",
        code: default_fragment_policy(),
        frames: 10,
		time: 0,
		passes: 1,
		passes_defined_in_code: false,
		frames_defined_in_code: false,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
		gifjs: {
			quality: 8,
			dithering: 'FloydSteinberg'
		},
		autocompile: true,
		mouse: [0, 0],
		images: []
    },
    watch: {
		'gifjs.dithering': function(d){
			// Convert string to null
			if(d == "false"){
				this.gifjs.dithering = false;
			}
		},
        width: function(w){
            this.canvas.width = w;
			this.re_init_ctx();
        },
        height: function(h){
            this.canvas.height = h;
			this.re_init_ctx();
        },
		passes: function(){
			this.re_init_ctx();
		}
    },
    methods: {
		re_init_ctx: function(){
			init_ctx(gl);
		},
        code_change: function(){
            window.localStorage.code = this.code;
			if(this.autocompile){
				update_shader();
			}
			this.manage_passes();
        },
	 	manage_passes: function(){
			var c = this.code;
			// Verify if passes is set there
			var re = /\/\/PASSES=([0-6])/;
			var result = re.exec(c);
			
			if(result == null){
				this.passes_defined_in_code = false;
			} else {
				this.passes_defined_in_code = true;
				this.passes = parseInt(result[1]);
			}

			// Verify if frames is set in code
			var re = /\/\/FRAMES=([0-9]*)/;
			var result = re.exec(c);
			
			if(result == null){
				this.frames_defined_in_code = false;
			} else {
				var qty = parseInt(result[1]);
				if(isNaN(qty) || qty < 1){
					this.frames_defined_in_code = false;
				} else {
					this.frames_defined_in_code = true;
					this.frames = qty;
				}
			}
		},
		recompile: function(){
			update_shader();
		},
		play_sound: function(){
			play_sound();
		},
		stop_sound: function(){
			clearTimeout(timeout);
			lastChunk = 0;
			if(currentSource != null){
				currentSource.stop();
			}
		},
		enable_sound_mode: function(){
			this.sound_mode = true;
			this.passes = 2;
			this.width = 256;
			this.height = 256;
			this.re_init_ctx();
		},
		disable_sound_mode: function(){
			this.sound_mode = false;
			this.stop_sound();
		},
		load_default_sound_shader: function(){
			this.code = load_script("default-sound-shader");
			f_editor.setValue(this.code);
		},
		send_to_server: function(){
			make_png_server();
		},
		canvas_mousemove: function(e){
			var c = e.target;
			var x = (e.clientX - c.offsetLeft) / this.width - 0.5;
			var y = (e.clientY - c.offsetTop) / this.height - 0.5;
			this.mouse = [x, -y];
		}
    }
});

// In case passes is set in code,
// set it at page load:
app.manage_passes();

function resize(){
    var parent = qsa(".vertical-scroll-parent")[0];
    if(window.innerWidth > 768){
        parent.style.height = (window.innerHeight - 40) + "px";
    } else {
        parent.style.height = "auto";
    }
}

resize();
window.addEventListener("resize",resize);

var anim_delay = 100;
var frame = 0;

var filename = "";

if(is_example != null){
    filename = is_example[1] || "";
}

// Canvas for making gifs
var gif_canvas = qsa(".gif-canvas")[0];

{
	gif_canvas.width = DEFAULT_WIDTH;
	gif_canvas.height = DEFAULT_HEIGHT;
	
	app.canvas = gif_canvas;
}

var gl = gif_canvas.getContext("webgl");
var fragment_error_pre = qsa(".fragment-error-pre")[0];
var vertex_error_pre = qsa(".vertex-error-pre")[0];

// Create render to texture stuff
var rttTexture = [];
var framebuffer = [];
var renderbuffer = [];
var renderBufferDim = [];

init_ctx(gl);

// Audio stuff
var pixels = new Uint8Array(gif_canvas.width * gif_canvas.height * 4);
var audioCtx = new AudioContext();
var currentSource = null;
var lastChunk = 0;
var timeout = null;

function init_ctx(ctx){
	var ww = 2;
	var hh = 2;

	// Delete previous textures
	for(var i = 0; i < rttTexture.length; i++){
		gl.deleteTexture(rttTexture[i]);
		gl.deleteRenderbuffer(renderbuffer[i]);
		gl.deleteFramebuffer(framebuffer[i]);
	}
	
	// Find nearest power of 2 above width and height
	while(app.width > ww){
		ww <<= 1;
	}
	while(app.height > hh){
		hh <<= 1;
	}

	renderBufferDim = [ww, hh];
	
	for(var i = 0; i < 10; i++){
		rttTexture[i] = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, rttTexture[i]);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ww, hh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		// Render to texture stuff
		framebuffer[i] = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer[i]);
		
		renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
		
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture[i], 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer[i]);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, ww, hh);
	}

    ctx.clearColor(0.0, 0.0, 0.0, 1.0);
    ctx.enable(ctx.DEPTH_TEST);
    ctx.depthFunc(ctx.LEQUAL);
    ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);

    // Triangle strip for whole screen square
    var vertices = [
            -1,-1,0,
            -1,1,0,
        1,-1,0,
        1,1,0,
    ];
    
    var tri = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER,tri);
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.STATIC_DRAW);
}

var vertex_code = load_script("vertex-shader");
var fragment_code = qsa("textarea[name='fragment']")[0];

// Enable codemirror

var f_editor = CodeMirror.fromTextArea(fragment_code, {
    lineNumbers: true,
    mode: "x-shader/x-fragment",
    indentUnit: 4
});

// Fetch file and put it in textarea
if(filename != ""){
    try{
        var xhr = new XMLHttpRequest;
        xhr.open('GET', "./" + filename, true);
        xhr.onreadystatechange = function(){
            if (4 == xhr.readyState) {
                var val = xhr.responseText;
                f_editor.setValue(val);
				
				// Change URL to avoid erasing user text
				// when reloading next time.
				window.history.pushState(
					{},
					"ShaderGif",
					window.location.href.replace(/\?.*$/, "", "")
				);
            }
        };
		xhr.setRequestHeader('Content-type', 'text/plain');
        xhr.send();
    } catch (e){
        // Do nothing
    }
}

f_editor.on("change", function(){
    app.code = f_editor.getValue();
    app.code_change();
});

update_shader();

function update_shader(){
    init_program(gl);
}

function add_error(err, type_str, type_pre){
    try{
    var line = err.match(/^ERROR: [0-9]*:([0-9]*)/)[1];
    line = parseInt(line) - 1;
    var errline = f_editor.addLineClass(line, "background", "errorline");
    cm_errorLines.push(errline);
    } finally {
    type_pre.textContent =
            "Error in " + type_str + " shader.\n" +
            err;
    }
}

function init_program(ctx){
    ctx.program = ctx.createProgram();

    // Remove previous errors
    for(var err in cm_errorLines){
        f_editor.removeLineClass(cm_errorLines[err],"background");
    }
    
    var vertex_shader =
        add_shader(ctx.VERTEX_SHADER, vertex_code);
    
    var fragment_shader =
        add_shader(ctx.FRAGMENT_SHADER, f_editor.getValue());
    
    function add_shader(type,content){
        var shader = ctx.createShader(type);
        ctx.shaderSource(shader,content);
        ctx.compileShader(shader);

        // Find out right error pre
        var type_pre = type == ctx.VERTEX_SHADER ?
            vertex_error_pre:
            fragment_error_pre;
        
        if(!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)){
            var err = ctx.getShaderInfoLog(shader);
            
            // Find shader type
            var type_str = type == ctx.VERTEX_SHADER ?
                "vertex":
                "fragment";
            
            add_error(err, type_str, type_pre);

            return -1;
        } else {
            type_pre.textContent = "";
        }

        ctx.attachShader(ctx.program, shader);
        
        return shader;
    }

    if(vertex_shader == -1 || fragment_shader == -1){
        return;
    }
    
    ctx.linkProgram(ctx.program);
    
    if(!ctx.getProgramParameter(ctx.program, ctx.LINK_STATUS)){
        console.log(ctx.getProgramInfoLog(ctx.program));
    }
    
    ctx.useProgram(ctx.program);

    var positionAttribute = ctx.getAttribLocation(ctx.program, "position");
    
    ctx.enableVertexAttribArray(positionAttribute);
    ctx.vertexAttribPointer(positionAttribute, 3, ctx.FLOAT, false, 0, 0);
}

function draw_ctx(can, ctx, time){
	for(var pass = 0; pass < app.passes; pass++ ){
		if(pass < app.passes - 1){
			ctx.bindFramebuffer(ctx.FRAMEBUFFER, framebuffer[pass]);
		} else {
			ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
		}

		// Manage lastpass
		if(pass > 0){
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, rttTexture[pass - 1]);
			gl.uniform1i(gl.getUniformLocation(ctx.program, 'lastPass'), pass - 1);
		}
		
		
		for(var i = 0; i < app.passes; i++){
			gl.activeTexture(gl.TEXTURE0 + i);
			if(i == pass){
				// Unbind current to prevent feedback loop
				gl.bindTexture(gl.TEXTURE_2D, null);
				continue;
			}
			var att = gl.getUniformLocation(ctx.program, "pass" + i);
			gl.bindTexture(gl.TEXTURE_2D, rttTexture[i]);
			gl.uniform1i(att,i);
		}
		
		gl.uniform2fv(
			gl.getUniformLocation(ctx.program, 'renderBufferRatio'),
			[
				renderBufferDim[0] / app.width,
				renderBufferDim[1] / app.height
			]
		);

		gl.uniform2fv(
			gl.getUniformLocation(ctx.program, 'mouse'),
			[ app.mouse[0], app.mouse[1] ]
		);
		
		var passAttribute = ctx.getUniformLocation(ctx.program, "pass");
		ctx.uniform1i(passAttribute, pass + 1);

		var soundTimeAttribute = ctx.getUniformLocation(ctx.program, "soundTime");
		ctx.uniform1f(soundTimeAttribute, lastChunk);

		// Set time attribute
		var tot_time = app.frames * anim_delay;
		
		app.time = time.toFixed(4);
		
		var timeAttribute = ctx.getUniformLocation(ctx.program, "time");
		ctx.uniform1f(timeAttribute, time);
		
		var iGlobalTimeAttribute = ctx.getUniformLocation(ctx.program, "iGlobalTime");
		var date = new Date();
		var gtime = (date.getTime() % (3600 * 24)) / 1000.0;
		ctx.uniform1f(iGlobalTimeAttribute, gtime);
		
		
		var iResolutionAttribute = ctx.getUniformLocation(ctx.program, "iResolution");
		
		ctx.uniform3fv(iResolutionAttribute,
					   new Float32Array(
						   [
							   can.width,
							   can.height,
							   1.0
						   ])
					  );
		
		// Screen ratio
		var ratio = can.width / can.height;
		
		var ratioAttribute = ctx.getUniformLocation(ctx.program, "ratio");
		ctx.uniform1f(ratioAttribute, ratio);
		
		ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
		
		ctx.viewport(0, 0, can.width, can.height);
	}
}

var rendering_gif = false;

function draw(){
    window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw);

setInterval(
    function(){
        frame++;
        frame = frame % (app.frames);
        
        window.requestAnimationFrame(function(){
            // When rendering gif, draw is done elsewhere
            if(!rendering_gif){
                draw_ctx(gif_canvas, gl, (frame + 1) / app.frames);
            }
        });
    }
    , anim_delay
);

var gif_button = qsa("button[name='make-gif']")[0];
var png_button = qsa("button[name='make-png']")[0];

gif_button.addEventListener("click", make_gif);
png_button.addEventListener("click", make_png);

// Render all the frames to a png
function make_gif(){
    rendering_gif = true;
	
	var to_export = {};
    
    to_export.delay = anim_delay;
    to_export.data = [];
	
    var tempCanvas = document.createElement("canvas");
    var canvas = tempCanvas;
    
    rendering_gif = true;
	
    canvas.width = gif_canvas.width;
    canvas.height = gif_canvas.height;
    var ctx = canvas.getContext("2d");

    var i = 0;

    /*
      "Unrolled" async loop:
      for every image:
      render & load image
      onload: add to canvas
      when all are loaded: create image from canvas
     */
    function next(){
        if(i < app.frames){
            var curr = i;
            draw_ctx(gif_canvas, gl, (curr + 1) / app.frames);
            var image_data = gif_canvas.toDataURL();
            var temp_img = document.createElement("img");
            temp_img.src = image_data;
            temp_img.onload = function(){
                ctx.drawImage(temp_img, 0, 0);
				ctx.fillStyle = "#ffffff";
				ctx.fillText("ShaderGif",app.width - 60, app.height - 10);
				to_export.data.push(canvas.toDataURL());
                next();
            }
        } else {
			export_gif(to_export);
			rendering_gif = false;
        }
        i++;
    }
    
    next();
}

function send_image(name, data, callback){
	try{
		var xhr = new XMLHttpRequest;
		xhr.open('POST', sg_api + "/upload.sh", true);
		xhr.onreadystatechange = function(){
			if (4 == xhr.readyState) {
				callback();
			}
		};
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.send(name+"="+data);
	} catch (e){
		// Do nothing
		console.log(e);
	}
}

// Render all frames to a pngs while sending them to a server
function make_png_server(){
    rendering_gif = true;
    
    var tempCanvas = document.createElement("canvas");
    var canvas = tempCanvas;
    
    canvas.width = gif_canvas.width;
    canvas.height = gif_canvas.height * app.frames;
    var ctx = canvas.getContext("2d");

    var i = 0;

    /*
      "Unrolled" async loop:
      for every image:
      render & load image
      onload: add to canvas
      when all are loaded: create image from canvas
     */
    function next(){
        if(i < app.frames){
            var curr = i;
            draw_ctx(gif_canvas, gl, (curr + 1) / app.frames);
            var image_data = gif_canvas.toDataURL();

			// Zero-pad the number
			var num = "0".repeat((app.frames + "").length - (i + "").length) + i;
			
			send_image("image-"+num, image_data, next);
			app.send_status = i + "/" + app.frames;
        } else {
            rendering_gif = false;
			app.send_status = "";
        }
        i++;
    }
    
    next();
}


// Render all the frames to a png
function make_png(){
    rendering_gif = true;
    
    var tempCanvas = document.createElement("canvas");
    var canvas = tempCanvas;
    
    canvas.width = gif_canvas.width;
    canvas.height = gif_canvas.height * app.frames;
    var ctx = canvas.getContext("2d");

    var i = 0;

    /*
      "Unrolled" async loop:
      for every image:
      render & load image
      onload: add to canvas
      when all are loaded: create image from canvas
     */
    function next(){
        if(i < app.frames){
            var curr = i;
            draw_ctx(gif_canvas, gl, (curr + 1) / app.frames);
            var image_data = gif_canvas.toDataURL();
            var temp_img = document.createElement("img");
            temp_img.src = image_data;
            temp_img.onload = function(){
				var offset = curr * gif_canvas.height;
                ctx.drawImage(temp_img, 0, offset);
				ctx.fillStyle = "#ffffff";
				ctx.fillText("ShaderGif",app.width - 60, app.height - 10 + offset);
                next();
            }
        } else {
            // Final step
            var image_data = canvas.toDataURL();
            rendering_gif = false;
			app.images.unshift({size: false, src: image_data});
        }
        i++;
    }
    
    next();
}

// Make the gif from the frames
function export_gif(to_export){
    var gif = new GIF({
        workers: 2,
        quality: app.gifjs.quality,
		dither: app.gifjs.dithering,
        workerScript: "gif-export/lib/gifjs/gif.worker.js"
    });
    
    data = to_export.data;
    
    var images = [];
    
    for(var i = 0; i < data.length; i++){
        var image = new Image();
        image.src = data[i];
        image.onload = imageLoaded;
        images.push(image);
    }
    
    var number_loaded = 0;
    function imageLoaded(){
        number_loaded++;
        if(number_loaded == data.length){
            convert();
        }
    }
    
    function convert(){
		var code = f_editor.getValue();
		
        for(var i = 0; i < images.length; i++){    
            gif.addFrame(images[i],{delay: to_export.delay});
        }
        
        gif.render();
        
        gif.on('finished',function(blob){
            // Create image
			var size =  (blob.size / 1000).toFixed(2);

			// Create base64 version
			// PERF: TODO: generate image on submit only
			var reader = new window.FileReader();
			reader.readAsDataURL(blob);
			reader.onloadend = function() {
				// reader.result = base64 data
				app.images.unshift({size: size, blob: reader.result, src: URL.createObjectURL(blob), code: code});
			}
        })
    }
}

// Init UI

(function(){
	var foldables = qsa(".foldable");

	function init_foldable(foldable){
		var header = foldable.querySelectorAll(".foldable-header")[0];
		var content = foldable.querySelectorAll(".foldable-content")[0];

		header.addEventListener("click", function(e){
			e.preventDefault();
			foldable.classList.toggle("foldable-hidden");
		});
	}
	
	for(var i = 0; i < foldables.length; i++){
		init_foldable(foldables[i]);
	}
})();

// Render all the frames
function play_sound(){
    draw_ctx(gif_canvas, gl);
	gl.readPixels(0, 0, gif_canvas.width, gif_canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

	// Get an AudioBufferSourceNode.
	// This is the AudioNode to use when we want to play an AudioBuffer
	var source = audioCtx.createBufferSource();
	var frameCount = audioCtx.sampleRate * 1.0;
	var audioArrayBuffer = audioCtx.createBuffer(1, 48000, 48000);
	var nowBuffering = audioArrayBuffer.getChannelData(0);

	currentSource = source;
	
	var i = 0;
	var j = 0;

	while(j < 48000){
		// Copy and skip alpha
		nowBuffering[j+0] = (pixels[i+0]/255) - 0.5;
		nowBuffering[j+1] = (pixels[i+1]/255) - 0.5;
		nowBuffering[j+2] = (pixels[i+2]/255) - 0.5;
		i+=4;
		j+=3;
	}

	// set the buffer in the AudioBufferSourceNode
	source.buffer = audioArrayBuffer;
	
	// connect the AudioBufferSourceNode to the
	// destination so we can hear the sound
	source.connect(audioCtx.destination);
	
	if(lastChunk == 0){
		// start the source playing
		source.start(0);
		lastChunk = audioCtx.currentTime + 1;
	} else {
		source.start(lastChunk);
		lastChunk += 1;
	}

	// Find some resonable time for next computation
	var deltat = (lastChunk - audioCtx.currentTime) * 1000 - 500;
	timeout = setTimeout(play_sound,deltat);
}

function detect_sg_api(){
	try{
		var xhr = new XMLHttpRequest;
		xhr.open('GET', sg_api + "/exists.sh", true);
		xhr.onreadystatechange = function(){
			if (4 == xhr.readyState) {
				if(xhr.responseText.substr(0,3) == "yes"){
					app.has_sg_api = true;
				}
			}
		};
		
		xhr.setRequestHeader('Content-Type', 'text/plain');
		xhr.send();
	} catch (e){
		// Do nothing
		console.log(e);
	}
}

detect_sg_api();
