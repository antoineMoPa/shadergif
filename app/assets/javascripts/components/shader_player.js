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
	}

	set_canvas(_canvas){
		var gl = _canvas.getContext("webgl");
		this.canvas = _canvas;
		_canvas.width = this.width;
		_canvas.height = this.height;
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
		gl.bindBuffer(gl.ARRAY_BUFFER,tri);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	}

	init_program(){
		var gl = this.gl;
		
		gl.program = gl.createProgram();

		// TODO: clear code mirror errors here
		
		var vertex_shader =
			add_shader(gl.VERTEX_SHADER, this.vertex_shader);
		
		var fragment_shader =
			add_shader(gl.FRAGMENT_SHADER, this.fragment_shader);
		
		function add_shader(type,content){
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
				
				// TODO: add error to pre
				//add_error(err, type_str, type_pre);
				throw "Shader compilation error";
				
				return -1;
			} else {
				// TODO
				//type_pre.textContent = "";
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


	draw_gl(time){
		var gl = this.gl;

		for(var pass = 0; pass < this.passes; pass++ ){
			if(pass < this.passes - 1){
				gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer[pass]);
			} else {
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			}
			
			// Manage lastpass
			if(pass > 0){
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, rttTexture[pass - 1]);
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
				gl.bindTexture(gl.TEXTURE_2D, rttTexture[i]);
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

			// TODO: bring back audio support to player
			//gl.uniform1f(soundTimeAttribute, lastChunk);
			
			// Set time attribute
			var tot_time = this.frames * this.anim_delay;
			
			this.time = time.toFixed(4);
			
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
				shader_player: null
			};
		},
		methods: {
			canvas_mousemove: function(e){
				var c = e.target;
				var x = (e.clientX - c.offsetLeft) / this.width - 0.5;
				var y = (e.clientY - c.offsetTop) / this.height - 0.5;
				this.mouse = [x, -y];
			},
			update_player: function(){
				
				if(this.fragmentShader == ""){
					return;
				}
				
				this.shader_player.fragment_shader = this.fragmentShader;
				
				this.shader_player.init_program();
				this.shader_player.animate();
			}
		},
		watch: {
			fragmentShader: function(){
				this.update_player();
			}
		},
		mounted: function(){
			this.canvas = this.$el.querySelectorAll(".gif-canvas")[0];
			this.vertex_shader = document.querySelectorAll("script[name=vertex-shader]")[0].innerHTML;
			this.shader_player = new ShaderPlayer();
			this.shader_player.set_canvas(this.canvas);

			this.shader_player.vertex_shader = this.vertex_shader;
			this.update_player();
		}
	}
);
