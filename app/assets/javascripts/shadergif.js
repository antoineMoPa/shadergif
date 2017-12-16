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
		sound_mode: false,
		send_status: "",
        error: "",
		f_editor: null,
        code: default_fragment_policy(),
		passes_defined_in_code: false,
		frames_defined_in_code: false,
		width: 540,
		height: 540,
		frames: 10,
		passes: 1,
		gifjs: {
			quality: 8,
			dithering: 'FloydSteinberg'
		},
		autocompile: true,
		images: []
    },
    watch: {
		'gifjs.dithering': function(d){
			// Convert string to null
			if(d == "false"){
				this.gifjs.dithering = false;
			}
		},
        'width': function(w){
			this.update_player();
        },
        'height': function(h){
			this.update_player();
        },
		'frames': function(f){
			this.update_player();
        },
		'passes': function(){
			this.update_player();
		}
    },
    methods: {
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

			var sp = this.$refs['shader-player'];
			
			if(result == null){
				this.passes_defined_in_code = false;
			} else {
				this.passes_defined_in_code = true;
				sp.shader_player.passes = parseInt(result[1]);
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
					sp.shader_player.frames = qty;
				}
			}
		},
		update_player: function(){
			// Remove previous errors
			for(var err in cm_errorLines){
				app.f_editor.removeLineClass(cm_errorLines[err],"background");
			}

			var fragment_error_pre = qsa(".fragment-error-pre")[0];
			var vertex_error_pre = qsa(".vertex-error-pre")[0];
			
			vertex_error_pre.textContent = "";
			fragment_error_pre.textContent = "";
			
			if(this.fragmentShader == ""){
				return;
			}
			
			var sp = this.$refs['shader-player'];
			sp.shader_player.width = this.width;
			sp.shader_player.height = this.height;
			sp.shader_player.frames = this.frames;
			sp.shader_player.passes = this.passes;
			sp.shader_player.fragment_shader = this.code;

			// Needed when changing passes number
			// (renderbuffer & stuff)
			sp.shader_player.init_gl();
			sp.shader_player.init_program();
			sp.shader_player.animate();
		},
		recompile: function(){
			this.update_player();
		},
		play_sound: function(){
			this.shader_player.play_sound();
		},
		stop_sound: function(){
			clearTimeout(this.shader_player.timeout);
			this.shader_player.lastChunk = 0;
			if(this.shader_player.currentSource != null){
				this.shader_player.currentSource.stop();
			}
		},
		enable_sound_mode: function(){
			this.sound_mode = true;
			this.shader_player.passes = 2;
			this.shader_player.width = 256;
			this.shader_player.height = 256;
			this.update_player();
		},
		disable_sound_mode: function(){
			this.sound_mode = false;
			this.stop_sound();
		},
		load_default_sound_shader: function(){
			this.code = load_script("default-sound-shader");
			app.f_editor.setValue(this.code);
		},
		send_to_server: function(){
			make_png_server();
		}
    },
	mounted: function(){
		var app = this;
		
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
		
		var vertex_code = load_script("vertex-shader");
		var fragment_code = qsa("textarea[name='fragment']")[0];
		
		// Enable codemirror
		
		app.f_editor = CodeMirror.fromTextArea(fragment_code, {
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
						app.f_editor.setValue(val);
						
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
		
		app.f_editor.on("change", function(){
			app.code = app.f_editor.getValue();
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
				
				var errline = app.f_editor.addLineClass(line, "background", "errorline");
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
			var sp = this.$refs['shader-player'];
			sp.shader_player.rendering_gif = true;
			
			var to_export = {};
			
			to_export.delay = anim_delay;
			to_export.data = [];
			
			var tempCanvas = document.createElement("canvas");
			var canvas = tempCanvas;

			sp.shader_player.rendering_gif = true;
			
			canvas.width = sp.shader_player.canvas.width;
			canvas.height = sp.shader_player.canvas.height;
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
				if(i < sp.shader_player.frames){
					var curr = i;
					sp.shader_player.draw_gl((curr + 1) / sp.shader_player.frames);
					var image_data = sp.shader_player.canvas.toDataURL();
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
					sp.shader_player.rendering_gif = false;
				}
				i++;
			}
			
			next();
		}
		
		// Render all the frames to a png
		function make_png(){
			var sp = this.$refs['shader-player'];
			sp.shader_player.rendering_gif = true;
			
			var tempCanvas = document.createElement("canvas");
			var canvas = tempCanvas;
			
			canvas.width = sp.shader_player.canvas.width;
			canvas.height = sp.shader_player.canvas.height * sp.shader_player.frames;
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
				if(i < sp.shader_player.frames){
					var curr = i;
					sp.shader_player.draw_gl((curr + 1) / sp.shader_player.frames);
					var image_data = sp.shader_player.canvas.toDataURL();
					var temp_img = document.createElement("img");
					temp_img.src = image_data;
					temp_img.onload = function(){
						var offset = curr * sp.shader_player.canvas.height;
						ctx.drawImage(temp_img, 0, offset);
						ctx.fillStyle = "#ffffff";
						ctx.fillText("shadergif.com", app.width - 60, app.height - 10 + offset);
						next();
					}
				} else {
					// Final step
					var image_data = canvas.toDataURL();
					sp.shader_player.rendering_gif = false;
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
				var code = app.f_editor.getValue();
				
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
		

		this.$nextTick(function(){
			var sp = this.$refs['shader-player'];
			sp.debug_info = true;
			
			this.vertex_shader = document.querySelectorAll("script[name=vertex-shader]")[0].innerHTML;
			sp.vertex_shader = this.vertex_shader;
			sp.fragment_shader = this.code;
			
			sp.on_error_listener = function(error, gl){
				var fragment_error_pre = qsa(".fragment-error-pre")[0];
				var vertex_error_pre = qsa(".vertex-error-pre")[0];
				
				var type_str = error.type == gl.VERTEX_SHADER ?
					"vertex":
					"fragment";
				
				var type_pre = vertex_error_pre;
				if(type_str == "vertex"){
					type_pre = fragment_error_pre;
				}
				
				add_error(error.error, type_str, type_pre);
			};
			
			// In case passes is set in code,
			// set it at page load:
			app.manage_passes();
			
			this.update_player();
		});
	}
});
