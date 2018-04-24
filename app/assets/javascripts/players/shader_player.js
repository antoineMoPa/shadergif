class ShaderPlayer {
	constructor(){
		this.compiled = false;
		this.canvas = document.createElement("canvas");
		this.gl = null;
		this.fragment_shader = "";
		this.vertex_shader = "";
		this.rttTexture = [];
		this.framebuffer = [];
		this.renderbuffer = [];
		this.renderBufferDim = [];
		this.textures = [];
		this.passes_defined_in_code = false;
		this.frames_defined_in_code = false;
				

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
			console.log("Shader compilation error");
		};

		{
			// Init canvas
			var gl = this.canvas.getContext("webgl");
			this.canvas.width = this.width;
			this.canvas.height = this.height;
			this.canvas.addEventListener("mousemove", this.canvas_mousemove.bind(this));
			this.gl = gl;
			this.init_gl();
		}	
	}

	/* 
	   Generic player functions 
	   (That would be in an interface if Javascript had that)
	 */

	set_container(div){
		div.appendChild(this.canvas);
	}

	set_code(code){
		this.fragment_shader = code;
		this.update();
	}
	
	set_width(w){
		this.width = w;
		this.update();
	}

	set_height(h){
		this.height = h;
		this.update();
	}

	/* callback receives a canvas element */
	render(time, callback){
		
	}
	
	set_on_error_listener(callback){
		// Call this on error
		this.on_error_listener = callback;
	}
	

	/* Shader specific functions */

	set_vertex_shader(code){
		this.vertex_shader = code;
		this.update();
	}

	update(){
		var now = new Date().getTime();

		if(this.fragmentShader == "" || this.vertex_shader == ""){
			return;
		}
		
		this.manage_passes();

		// Needed when changing passes number
		// (renderbuffer & stuff)
		if(this.gl == null){
			// Only init once
			this.init_gl();
		}
		
		// TODO: rename this update_program
		this.init_program();
		this.animate();
	}
	
	// Took from MDN:
	// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
	// Initialize a texture and load an image.
	// When the image finished loading copy it into the texture.
	//
	add_texture(url) {
		function isPowerOf2(value) {
			return (value & (value - 1)) == 0;
		}
		
		var gl = this.gl;
		
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		
		// Because images have to be download over the internet
		// they might take a moment until they are ready.
		// Until then put a single pixel in the texture so we can
		// use it immediately. When the image has finished downloading
		// we'll update the texture with the contents of the image.
		const level = 0;
		const internalFormat = gl.RGBA;
		const width = 1;
		const height = 1;
		const border = 0;
		const srcFormat = gl.RGBA;
		const srcType = gl.UNSIGNED_BYTE;
		const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
					  width, height, border, srcFormat, srcType,
					  pixel);
		
		const image = new Image();
		image.onload = function() {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
						  srcFormat, srcType, image);
			
			// WebGL1 has different requirements for power of 2 images
			// vs non power of 2 images so check if the image is a
			// power of 2 in both dimensions.
			if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
				// Yes, it's a power of 2. Generate mips.
				gl.generateMipmap(gl.TEXTURE_2D);
			} else {
				// No, it's not a power of 2. Turn of mips and set
				// wrapping to clamp to edge
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			}
		};
		image.src = url;

		this.textures.push(texture);
	}

	delete_texture(index){
		var gl = this.gl;
		gl.deleteTexture(this.textures[index]);
		this.textures.splice(index, 1);
	}
	
	canvas_mousemove(e){
		var c = e.target;
		var x = (e.clientX) / this.width - 0.5;
		// Todo: parse parent nodes' scrollTop
		var y = (e.clientY) / this.height - 0.5;
		this.mouse = [x, -y];
	}
	
	init_gl(){
		this.compiled = false;

		if(this.gl == null){
			return;
		}
		
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
		this.compiled = true;
	}

	init_program(){
		this.compiled = false;
		var player = this;

		if(this.gl == null){
			return;
		}

		var gl = this.gl;

		// Delete previous program
		if(typeof gl.program != "undefined"){
			gl.useProgram(gl.program);
			if(this.fragment_shader_object > -1){
				gl.detachShader(gl.program, this.fragment_shader_object);
			}
			if(this.vertex_shader_object > -1){
				gl.detachShader(gl.program, this.vertex_shader_object);
			}
			gl.deleteShader(gl.fragment_shader);
			gl.deleteShader(gl.vertex_shader);
			gl.deleteProgram(gl.program);
		}
		
		gl.program = gl.createProgram();

		var vertex_shader =
			add_shader(gl.VERTEX_SHADER, this.vertex_shader);
		
		var fragment_shader =
			add_shader(gl.FRAGMENT_SHADER, this.fragment_shader);

		this.fragment_shader_object = fragment_shader;
		this.vertex_shader_object = vertex_shader;
		
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

				player.on_error_listener({
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
		this.compiled = true;
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

		if(!this.compiled){
			return;
		}
		
		var gl = this.gl;

		if(gl == null || gl.program == null || typeof gl.program == "undefined"){
			return;
		}
		
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
			
			var i = 0;
			
			// Warning: i is continued in other loop
			for(; i < this.passes; i++){
				gl.activeTexture(gl.TEXTURE0 + i);
				if(i == pass){
					// Unbind current to prevent feedback loop
					gl.bindTexture(gl.TEXTURE_2D, null);
					continue;
				}
				var att = gl.getUniformLocation(gl.program, "pass" + i);
				gl.bindTexture(gl.TEXTURE_2D, this.rttTexture[i]);
				gl.uniform1i(att,i);
			}
			
			for(var j = 0; j < this.textures.length; j++, i++){
				gl.activeTexture(gl.TEXTURE0 + i);
				var att = gl.getUniformLocation(gl.program, "texture" + j);
				gl.bindTexture(gl.TEXTURE_2D, this.textures[j]);
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
		var player = this;
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
				frame = frame % (player.frames);
				
				window.requestAnimationFrame(function(){
					// When rendering gif, draw is done elsewhere
					if(!player.rendering_gif){
						player.draw_gl((frame + 1) / player.frames);
					}
				});
			}
			, anim_delay
		);
	}

	manage_passes(){
		var c = this.fragment_shader;
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
	}
}
