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
	
	if(/\/drafts\//.test(window.location.href)){
		// If we are viewing a draft, use it
		code = JSON.parse(load_script("draft-code"));
	} else if(
		window.localStorage.code != undefined &&
			window.localStorage.code != ""
	){
		// Not a draft, use last edited code saved in localstorage
		// (Prevents losing code when reloading the page)
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
		anim_delay: 100,
		rendering_gif: false,
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
			var app = this;
			window.localStorage.code = app.code;
			if(app.autocompile){
				app.$nextTick(function(){
					app.update_player();
				});
			}
		},
		update_player: function(){
			// Remove previous errors
			for(var err in cm_errorLines){
				app.f_editor.removeLineClass(cm_errorLines[err], "background");
			}
			
			var sp = this.$refs['shader-player'];
			sp.shader_player.width = this.width;
			sp.shader_player.height = this.height;
			
			if(!sp.frames_defined_in_code){
				sp.shader_player.frames = this.frames;
			}
			if(!sp.passes_defined_in_code){
				sp.shader_player.passes = this.passes;
			}

			var fragment_error_pre = qsa(".fragment-error-pre")[0];
			var vertex_error_pre = qsa(".vertex-error-pre")[0];
			
			vertex_error_pre.textContent = "";
			fragment_error_pre.textContent = "";
			
			if(this.fragmentShader == ""){
				return;
			}

			sp.update_player();
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
		},
		export_gif: function(to_export){
			// Make the gif from the frames
			var app = this;
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
					};
				});
			}
		},
		make_gif: function() {
			var app = this;
			// Renders all the frames to a png
			var sp = app.$refs['shader-player'];
			sp.shader_player.rendering_gif = true;
			app.rendering_gif = true;
			
			var to_export = {};
			
			to_export.delay = app.anim_delay;
			to_export.data = [];
			
			var tempCanvas = document.createElement("canvas");
			var canvas = tempCanvas;
			
			sp.shader_player.rendering_gif = true;
			app.rendering_gif = true;
			
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
						ctx.fillStyle = "#888888";
						ctx.fillText("shadergif.com", sp.shader_player.width - 80, sp.shader_player.height - 10);
						to_export.data.push(canvas.toDataURL());
						next();
					};
				} else {
					app.export_gif(to_export);
					sp.shader_player.rendering_gif = false;
					app.rendering_gif = false;
				}
				i++;
			}
			next();
		},
		make_png: function() {
			// Renders all the frames to a png
			var app = this;
			var sp = app.$refs['shader-player'];
			sp.shader_player.rendering_gif = true;
			app.rendering_gif = true;
			
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
						ctx.fillStyle = "#888888";
						ctx.fillText("shadergif.com", sp.shader_player.width - 80, sp.shader_player.height - 10 + offset);
						next();
					};
				} else {
					// Final step
					var image_data = canvas.toDataURL();
					sp.shader_player.rendering_gif = false;
					app.rendering_gif = false;
					app.images.unshift({type: "png", size: false, src: image_data});
				}
				i++;
			}
			
			next();
		},
		make_zip: function(){
			// Lazy-load gif.js
			var script = document.createElement("script");
			script.src = "/assets/lib/jszip.min.js";
			script.onload = function(){
				window.shadergif_zip = new JSZip();
				zip.file("Hello.txt", "Hello World\n");
				var img = zip.folder("images");
				img.file("smile.gif", imgData, {base64: true});
				zip.generateAsync({type:"blob"})
					.then(function(content) {
						// see FileSaver.js
						saveAs(content, "example.zip");
					});
				alert("zip");
			};
			document.body.appendChild(script);
		}
	},
	mounted: function(){
		var app = this;

		// TODO: refactor everything here into methods
		// (Legacy code from before VUE.js)
		function resize(){
			var parent = qsa(".vertical-scroll-parent")[0];
		}
		
		resize();
		window.addEventListener("resize",resize);
				
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

		var change_timeout = null;
		
		function change_throttled(){
			// Sleep at least 300 milliseconds
			// to avoid constant compilation when typing,
			// which slows down the thread
			if(change_timeout == null){
				change_timeout = setTimeout(function(){
					app.code = app.f_editor.getValue();
					app.code_change();
					change_timeout = null;
					return;
				}, 300);
			}
		}
		
		app.f_editor.on("change", function(){
			change_throttled();
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
			
			sp.shader_player.on_error_listener = function(error, gl){
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
			
			this.update_player();
		});
	}
});
