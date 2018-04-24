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
				size_before_fullscreen: null
			};
		},
		methods: {
		},
		watch: {
			fragmentShader: function(){
				this.shader_player.set_code(this.fragmentShader);
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
				
				this.shader_player.set_vertex_shader(app.vertex_shader);
				this.shader_player.set_code(app.fragmentShader);
				
				window.addEventListener("resize", function(){
					if(app.fullscreen){
						app.shader_player.set_width(window.innerWidth);
						app.shader_player.set_height(window.innerHeight);
					}
				});
			});
		}
	}
);
