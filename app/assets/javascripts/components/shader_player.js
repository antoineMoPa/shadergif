Vue.component(
	'shader-player',
	{
		template: '#shader-player-template',
		props: ["fragment-shader"],
		data: function(){
			return {
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
				var now = new Date().getTime();

				if(this.fragmentShader == ""){
					return;
				}
				
				this.shader_player.fragment_shader = this.fragmentShader;
				this.manage_passes();
				// Needed when changing passes number
				// (renderbuffer & stuff)
				if(this.shader_player.gl == null){
					// Only init once
					this.shader_player.init_gl();
				}

				// TODO: rename this update_program
				this.shader_player.init_program();
				
				this.shader_player.animate();
			}
		},
		watch: {
			fragmentShader: function(){
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
				var container = this.$el.querySelectorAll(".player-container")[0];
				this.vertex_shader = document.querySelectorAll("script[name=vertex-shader]")[0].innerHTML;
			
				this.shader_player.set_container(container);
				
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
