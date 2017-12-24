class ShaderPlayer {
	constructor(){
		this.canvas = null;
		this.gl = null;
		this.fragment_shader = "";
		this.vertex_shader = "";
		this.rttTexture = [];
		this.framebuffer = [];
		this.renderbuffer = [];
		this.renderBufferDim = [];

		// TODO: synchronize with vue
		this.width = 540;
		this.height = 540;
		this.passes = 1;
		this.frames = 10;
		this.rendering_gif = false;
		this.mouse = [0,0];


		// Audio stuff
		this.pixels = new Uint8Array(this.width * this.height * 4);
		this.audioCtx = new AudioContext();
		this.currentSource = null;
		this.lastChunk = 0;
		this.time = 0.0;
		this.timeout = null;

		this.on_error_listener = function(){
			throw "Shader compilation error";
		};
	}

	canvas_mousemove(e){
		var c = e.target;
		var x = (e.clientX) / this.width - 0.5;
		// Todo: parse parent nodes' scrollTop
		var y = (e.clientY) / this.height - 0.5;
		this.mouse = [x, -y];
	}
	
	set_canvas(_canvas){
		var gl = _canvas.getContext("webgl");
		this.canvas = _canvas;
		_canvas.width = this.width;
		_canvas.height = this.height;
		_canvas.addEventListener("mousemove", this.canvas_mousemove.bind(this));
		this.gl = gl;
		this.init_gl();
	}
	
	init_gl(){
		var gl = this.gl;
		var ww = 2;
		var hh = 2;

		// Delete previous textures
		for(var i = 0; i < this.rttTexture.length; i++){
			gl.deleteTexture(this.rttTexture[i]);
			gl.deleteRenderbuffer(this.renderbuffer[i]);
			gl.deleteFramebuffer(this.framebuffer[i]);
		}
		
		// Find nearest power of 2 above width and height
		while(this.width > ww){
			ww <<= 1;
		}
		while(this.height > hh){
			hh <<= 1;
		}
		
		this.renderBufferDim = [ww, hh];

		for(var i = 0; i < 10; i++){
			this.rttTexture[i] = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[i]);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ww, hh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			
			// Render to texture stuff
			this.framebuffer[i] = gl.createFramebuffer();
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer[i]);
			
			this.renderbuffer = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
			
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.rttTexture[i], 0);
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer[i]);
			gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, ww, hh);
		}
		
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		// Triangle strip for whole screen square
		var vertices = [
            -1,-1,0,
            -1,1,0,
			1,-1,0,
			1,1,0,
		];
		
		var tri = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, tri);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	}

	init_program(){
		var app = this;
		var gl = this.gl;
		
		gl.program = gl.createProgram();

		var vertex_shader =
			add_shader(gl.VERTEX_SHADER, this.vertex_shader);
		
		var fragment_shader =
			add_shader(gl.FRAGMENT_SHADER, this.fragment_shader);
		
		function add_shader(type, content){
			var shader = gl.createShader(type);
			gl.shaderSource(shader,content);
			gl.compileShader(shader);
			
			// TODO: Find out right error pre
						
			if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
				var err = gl.getShaderInfoLog(shader);
				
				// Find shader type
				var type_str = type == gl.VERTEX_SHADER ?
					"vertex":
					"fragment";

				app.on_error_listener({
					type: type,
					error: err
				}, gl);
				
				return -1;
			} else {
				//
			}
			
			gl.attachShader(gl.program, shader);
			
			return shader;
		}
		
		if(vertex_shader == -1 || fragment_shader == -1){
			return;
		}
		
		gl.linkProgram(gl.program);
		
		if(!gl.getProgramParameter(gl.program, gl.LINK_STATUS)){
			console.log(gl.getProgramInfoLog(gl.program));
		}
		
		gl.useProgram(gl.program);
		
		var positionAttribute = gl.getAttribLocation(gl.program, "position");
		
		gl.enableVertexAttribArray(positionAttribute);
		gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);
	}

	// TODO: TEST SOUND
	play_sound(){
		var gl = this.gl
		this.draw_gl(0);
		gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
		
		// Get an AudioBufferSourceNode.
		// This is the AudioNode to use when we want to play an AudioBuffer
		var source = this.audioCtx.createBufferSource();
		var frameCount = this.audioCtx.sampleRate * 1.0;
		var audioArrayBuffer = this.audioCtx.createBuffer(1, 48000, 48000);
		var nowBuffering = audioArrayBuffer.getChannelData(0);
		
		this.currentSource = source;
		
		var i = 0;
		var j = 0;
		
		while(j < 48000){
			// Copy and skip alpha
			nowBuffering[j+0] = (this.pixels[i+0]/255) - 0.5;
			nowBuffering[j+1] = (this.pixels[i+1]/255) - 0.5;
			nowBuffering[j+2] = (this.pixels[i+2]/255) - 0.5;
			i+=4;
			j+=3;
		}
		
		// set the buffer in the AudioBufferSourceNode
		source.buffer = audioArrayBuffer;
		
		// connect the AudioBufferSourceNode to the
		// destination so we can hear the sound
		source.connect(this.audioCtx.destination);
		
		if(this.lastChunk == 0){
			// start the source playing
			source.start(0);
			this.lastChunk = this.audioCtx.currentTime + 1;
		} else {
			source.start(this.lastChunk);
			this.lastChunk += 1;
		}
		
		// Find some resonable time for next computation
		var deltat = (this.lastChunk - this.audioCtx.currentTime) * 1000 - 500;
		this.timeout = setTimeout(this.play_sound.bind(this), deltat);
	}
	
	draw_gl(time){
		var gl = this.gl;

		for(var pass = 0; pass < this.passes; pass++ ){
			if(pass < this.passes - 1){
				gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer[pass]);
			} else {
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			}
			
			// Manage lastpass
			if(pass > 0){
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[pass - 1]);
				gl.uniform1i(gl.getUniformLocation(gl.program, 'lastPass'), pass - 1);
			}
			
			for(var i = 0; i < this.passes; i++){
				gl.activeTexture(gl.TEXTURE0 + i);
				if(i == pass){
					// Unbind current to prevent feedback loop
					gl.bindTexture(gl.TEXTURE_2D, null);
					continue;
o				}
				var att = gl.getUniformLocation(gl.program, "pass" + i);
				gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[i]);
				gl.uniform1i(att,i);
			}
			
			gl.uniform2fv(
				gl.getUniformLocation(gl.program, 'renderBufferRatio'),
				[
					this.renderBufferDim[0] / this.width,
					this.renderBufferDim[1] / this.height
				]
			);
			
			gl.uniform2fv(
				gl.getUniformLocation(gl.program, 'mouse'),
				[ this.mouse[0], this.mouse[1] ]
			);
			
			var passAttribute = gl.getUniformLocation(gl.program, "pass");
			gl.uniform1i(passAttribute, pass + 1);
			
			var soundTimeAttribute = gl.getUniformLocation(gl.program, "soundTime");

			gl.uniform1f(soundTimeAttribute, this.lastChunk);
			
			// Set time attribute
			var tot_time = this.frames * this.anim_delay;
			
			var timeAttribute = gl.getUniformLocation(gl.program, "time");
			gl.uniform1f(timeAttribute, time);
			
			var iGlobalTimeAttribute = gl.getUniformLocation(gl.program, "iGlobalTime");
			var date = new Date();
			var gtime = (date.getTime()) / 1000.0 % (3600 * 24);
			// Add seconds
			gtime += time;
			gl.uniform1f(iGlobalTimeAttribute, gtime);
			
			
			var iResolutionAttribute = gl.getUniformLocation(gl.program, "iResolution");
			
			gl.uniform3fv(iResolutionAttribute,
						   new Float32Array(
							   [
								   this.width,
								   this.height,
								   1.0
							   ])
						  );
			
			// Screen ratio
			var ratio = this.width / this.height;
			
			var ratioAttribute = gl.getUniformLocation(gl.program, "ratio");
			gl.uniform1f(ratioAttribute, ratio);
			
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			gl.viewport(0, 0, this.width, this.height);
		}
	}

	animate(){
		var app = this;
		var frame = 0;
		var anim_delay = 100;

		// Update width/height
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		
		if(this.anim_already_started){
			return;
		}
		
		this.anim_already_started = true;
		
		setInterval(
			function(){
				frame++;
				frame = frame % (app.frames);
				
				window.requestAnimationFrame(function(){
					// When rendering gif, draw is done elsewhere
					if(!app.rendering_gif){
						app.draw_gl((frame + 1) / app.frames);
					}
				});
			}
			, anim_delay
		);
	}

}

Vue.component(
	'shader-player',
	{
		template: '#shader-player-template',
		props: ["fragment-shader"],
		data: function(){
			return {
				canvas: null,
				vertex_shader: "",
				shader_player: null,
				fullscreen: false,
				debug_info: false,
				passes_defined_in_code: false,
				frames_defined_in_code: false,
				size_before_fullscreen: null
			};
		},
		methods: {
			manage_passes: function(){
				var c = this.shader_player.fragment_shader;
				// Verify if passes is set there
				var re = /\/\/PASSES=([0-6])/;
				var result = re.exec(c);
				
				if(result == null){
					this.passes_defined_in_code = false;
				} else {
					this.passes_defined_in_code = true;
					this.shader_player.passes = parseInt(result[1]);
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
						this.shader_player.frames = qty;
					}
				}
			},
			update_player: function(){
				if(this.fragmentShader == ""){
					return;
				}
				
				this.shader_player.fragment_shader = this.fragmentShader;
				this.manage_passes();
				// Needed when changing passes number
				// (renderbuffer & stuff)
				this.shader_player.init_gl();
				this.shader_player.init_program();
				this.shader_player.animate();
			}
		},
		watch: {
			fragmentShader: function(){
				console.log("update");
				this.update_player();
			},
			fullscreen: function(fullscreen){
				if(fullscreen == true){
					// Switch to fullscreen
					
					this.size_before_fullscreen = [
						this.shader_player.width,
						this.shader_player.height,
					];

					this.shader_player.width = window.innerWidth;
					this.shader_player.height = window.innerHeight;

					// Hardcode fullscreen helper
					var style = document.createElement("style");
					style.innerHTML = ".container{position:static;}";
					style.innerHTML += "html{overflow:hidden;}";
					document.body.appendChild(style);
					window.shader_player_hardcoded_style = style;
					
					this.shader_player.animate();
				} else {
					this.shader_player.width =
						this.size_before_fullscreen[0];
					this.shader_player.height =
						this.size_before_fullscreen[1];

					this.shader_player.animate();

					// Remove hardcoded style
					var style = window.shader_player_hardcoded_style;
					style.parentNode.removeChild(style);
				}
			}
		},
		computed: {
			player_size_style: function(){
				return 'width:' + this.shader_player.width + 'px;' +
					'height:' + this.shader_player.height + 'px';
			}
		},
		mounted: function(){
			var app = this;
			this.shader_player = new ShaderPlayer();

			this.$nextTick(function(){
				this.canvas = this.$el.querySelectorAll(".gif-canvas")[0];
				this.vertex_shader = document.querySelectorAll("script[name=vertex-shader]")[0].innerHTML;
			
				this.shader_player.set_canvas(this.canvas);
				
				this.shader_player.vertex_shader = this.vertex_shader;
				
				if(this.shader_player.fragmentShader != ""){
					this.update_player();
				}

				window.addEventListener("resize", function(){
					if(app.fullscreen){
						app.shader_player.width = window.innerWidth;
						app.shader_player.height = window.innerHeight;
						app.update_player();
					}
				});
			});
		}
	}
);
