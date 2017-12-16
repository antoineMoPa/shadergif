/*
  Resources: 
  
  * https://gist.github.com/mbostock/5440492
  * http://memfrag.se/blog/simple-vertex-shader-for-2d
  * https://www.opengl.org/wiki/Data_Type_%28GLSL%29#Vector_constructors
  * https://www.opengl.org/wiki/Built-in_Variable_%28GLSL%29
  * https://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf

  */

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
		sound_mode: false,
		shader_player: null,
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
				this.update_player();
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
		update_player: function(){
			// Remove previous errors
			for(var err in cm_errorLines){
				f_editor.removeLineClass(cm_errorLines[err],"background");
			}

			var fragment_error_pre = qsa(".fragment-error-pre")[0];
			var vertex_error_pre = qsa(".vertex-error-pre")[0];
			
			vertex_error_pre.textContent = "";
			fragment_error_pre.textContent = "";
			
			if(this.fragmentShader == ""){
				return;
			}
			
			this.shader_player.fragment_shader = this.code;
			this.shader_player.init_program();
			this.shader_player.animate();
		},
		recompile: function(){
			this.update_player();
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
		}
    },
	mounted: function(){
		this.shader_player = new ShaderPlayer();
		this.canvas = this.$el.querySelectorAll(".gif-canvas")[0];
		this.vertex_shader = document.querySelectorAll("script[name=vertex-shader]")[0].innerHTML;
		this.shader_player.set_canvas(this.canvas);
		this.shader_player.vertex_shader = this.vertex_shader;
		this.shader_player.fragment_shader = this.code;
		
		this.shader_player.on_error_listener = function(error, gl){
			var type_str = type == gl.VERTEX_SHADER ?
				"vertex":
				"fragment";
			
			add_error(err, type_str, type_pre);
		};
		
		this.update_player();

	}
});

// In case passes is set in code,
// set it at page load:
app.manage_passes();

function resize(){
    var parent = qsa(".vertical-scroll-parent")[0];
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

function add_error(err, type_str, type_pre){
    try{
		var line = err.match(/^ERROR: [0-9]*:([0-9]*)/)[1];

		// Fix potential bug killing all text sometimes
		// like when inserting backticks (`)
		// and the compiler does not give any line
		// then codemirror becomes crazy
		if(line == ""){
			return
		}
		
		line = parseInt(line) - 1;

		// Bug that could happen
		if(isNaN(line)){
			return;
		}
		
		var errline = f_editor.addLineClass(line, "background", "errorline");
		cm_errorLines.push(errline);
    } finally {
		type_pre.textContent =
            "Error in " + type_str + " shader.\n" +
            err;
    }
}

var gif_button = qsa("button[name='make-gif']")[0];
var png_button = qsa("button[name='make-png']")[0];

gif_button.addEventListener("click", make_gif);
png_button.addEventListener("click", make_png);

// Render all the frames to a png
function make_gif(){
    app.shader_player.rendering_gif = true;
	
	var to_export = {};
    
    to_export.delay = anim_delay;
    to_export.data = [];
	
    var tempCanvas = document.createElement("canvas");
    var canvas = tempCanvas;
    
    app.shader_player.rendering_gif = true;
	
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
            app.shader_player.draw_gl((curr + 1) / app.frames);
            var image_data = gif_canvas.toDataURL();
            var temp_img = document.createElement("img");
            temp_img.src = image_data;
            temp_img.onload = function(){
                ctx.drawImage(temp_img, 0, 0);
				ctx.fillStyle = "#ffffff";
				ctx.fillText("shadergif.com", app.width - 60, app.height - 10);
				to_export.data.push(canvas.toDataURL());
                next();
            }
        } else {
			export_gif(to_export);
			app.shader_player.rendering_gif = false;
        }
        i++;
    }
    
    next();
}

// Render all the frames to a png
function make_png(){
    app.shader_player.rendering_gif = true;
    
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
            app.shader_player.draw_gl((curr + 1) / app.frames);
            var image_data = gif_canvas.toDataURL();
            var temp_img = document.createElement("img");
            temp_img.src = image_data;
            temp_img.onload = function(){
				var offset = curr * gif_canvas.height;
                ctx.drawImage(temp_img, 0, offset);
				ctx.fillStyle = "#ffffff";
				ctx.fillText("shadergif.com", app.width - 60, app.height - 10 + offset);
                next();
            }
        } else {
            // Final step
            var image_data = canvas.toDataURL();
            app.shader_player.rendering_gif = false;
			app.images.unshift({type: "png", size: false, src: image_data});
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
        workerScript: "/workers/gif.worker.js"
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
				app.images.unshift({type: "gif", size: size, blob: reader.result, src: URL.createObjectURL(blob), code: code});
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
