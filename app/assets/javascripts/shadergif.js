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
		has_zip: false,
		zip_url: "",
		textures: [],
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
			var sp = this.$refs['shader-player'];
			sp.shader_player.play_sound();
		},
		stop_sound: function(){
			var sp = this.$refs['shader-player'];
			clearTimeout(sp.shader_player.timeout);
			sp.shader_player.lastChunk = 0;
			if(sp.shader_player.currentSource != null){
				sp.shader_player.currentSource.stop();
			}
		},
		enable_sound_mode: function(){
			this.sound_mode = true;
			this.passes = 2;
			this.width = 256;
			this.height = 256;
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
		render: function(options) {
			if(typeof(options) == "undefined"){
				options = {
					zip: false,
					stack: true,
					gif: false
				};
			}
				
			// Renders all the frames to a png
			var app = this;
			var sp = app.$refs['shader-player'].shader_player;
			sp.rendering_gif = true;
			app.rendering_gif = true;

			var to_export = {};
			
			if(options.gif){
				to_export.delay = app.anim_delay;
				to_export.data = [];
			}
			
			var tempCanvas = document.createElement("canvas");
			var canvas = tempCanvas;

			canvas.width = sp.canvas.width;
			canvas.height = sp.canvas.height;
			
			if(options.stack){
				canvas.height = sp.canvas.height * sp.frames;
			}
			
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
				if(i < sp.frames){
					var curr = i;
					sp.draw_gl((curr + 1) / sp.frames);

					var image_data = sp.canvas.toDataURL();
					var temp_img = document.createElement("img");
					temp_img.src = image_data;

					var w = sp.width;
					var h = sp.height;
					var watermark = "shadergif.com";
					var color = "#888888";
					
					temp_img.onload = function(){
						if(options.stack){
							var offset = curr * sp.canvas.height;
							ctx.drawImage(temp_img, 0, offset);
							ctx.fillStyle = color;
							ctx.fillText(watermark,  - 80, h - 10 + offset);
							next();
						} else if(options.gif) {
							ctx.drawImage(temp_img, 0, 0);
							ctx.fillStyle = color;
							ctx.fillText(watermark, w - 80, h - 10);
							to_export.data.push(canvas.toDataURL());
							next();
						} else if (options.zip) {
							var zip = window.shadergif_zip;
							ctx.drawImage(temp_img, 0, 0);
							ctx.fillStyle = color;
							ctx.fillText(watermark, w - 80, h - 10);

							// 4-Zero pad number
							var filename = "image-";
							var numzeros = 4;
							var numlen = (curr + "").length;

							for(var i =0; i < numzeros - numlen; i++){
								filename += "0";
							}
							
							filename += curr + ".png";
							
							canvas.toBlob(function(blob){
								zip.file(
									filename,
									blob
								);
								next();
							});
						}
					};
				} else {
					// Final step
					if(options.gif){
						app.export_gif(to_export);
						sp.rendering_gif = false;
						app.rendering_gif = false;
					} else if (options.stack) {
						image_data = canvas.toDataURL();
						sp.rendering_gif = false;
						app.rendering_gif = false;
						app.images.unshift({
							type: "png",
							size: false,
							src: image_data
						});
					} else if (options.zip) {
						var zip = window.shadergif_zip;
						sp.rendering_gif = false;
						app.rendering_gif = false;
						zip.generateAsync({type: "blob"})
							.then(function(content) {
								app.has_zip = true;
								app.zip_url = URL.createObjectURL(content);
							});
					}
				}
				i++;
			}
			
			next();
		},
		delete_downloaded_zip: function(){
			// This could avoid memory problems in the future
			app.has_zip = false;
			setTimeout(function(){
				URL.revokeObjectURL(app.zip_url);
				app.zip_url = "";
				console.log("revoked last gif object url to save memory.");
			}, 10000);
		},
		make_gif: function() {
			this.render({
				zip: false,
				stack: false,
				gif: true
			});
		},
		make_png: function(){
			this.render({
				zip: false,
				stack: true,
				gif: false
			});
		},
		make_zip: function(){
			var app = this;
			// Lazy-load gif.js
			var script = document.createElement("script");
			script.src = "/assets/lib/jszip.min.js";
			script.onload = function(){
				var zip = window.shadergif_zip = new JSZip();

				app.render({
					zip: true,
					stack: false,
					gif: false
				});
			};
			document.body.appendChild(script);
		},
		new_texture: function(){
			var app = this;
			var input = document.querySelectorAll(".shadergif-texture-input")[0];
			var sp = this.$refs['shader-player'];
			
			for(var i = 0; i < input.files.length; i++){
				try{
					var file = input.files[i];
					var reader  = new FileReader();

					reader.addEventListener("load", function (){
						app.textures.push({
							name: file.name,
							data: reader.result
						});
						sp.shader_player.add_texture(reader.result);
					}, false);
					
					if(file){
						reader.readAsDataURL(file);
					}
				} catch (e) {
					// Well I guess you are using a dumb browser
				}
			}
		},
		delete_texture(index){
			this.textures.splice(index, 1);
						
			var sp = this.$refs['shader-player'];
			sp.delete_texture(index);
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
