//= require lib/base.js

Vue.component(
	'shader-player',
	{
		template: '#shader-player-template',
		props: ["gif"],
		data: function(){
			return {
				vertex_shader: "",
				shader_player: null,
				fullscreen: false,
				debug_info: false,
				size_before_fullscreen: null
			};
		},
		watch: {
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

			var vertex_code = "";
				
			if(app.gif.lang == null || app.gif.lang == "shader_webgl1"){
				this.shader_player = new ShaderPlayer();
				vertex_code = load_script("vertex-shader");
			} else if (app.gif.lang == "shader_webgl2"){
				this.shader_player = new ShaderPlayerWebGL2();
				vertex_code = load_script("vertex-shader-webgl2");
			}
			
			this.$nextTick(function(){
				var container = this.$el.querySelectorAll(".player-container")[0];
				this.vertex_shader = vertex_code;
			
				this.shader_player.set_container(container);


				function add_image(texture, index){
					// 'Hardcoded' xhr
					var xhr = new XMLHttpRequest();
					xhr.open("GET", "/textures/" + texture.filename);
					xhr.onreadystatechange = function() {
						if(xhr.readyState == 4){
							if (xhr.status == 200){
								app.shader_player.add_texture(xhr.responseText);
							}
						};
					};
					xhr.send();
				}
				
				if(typeof(app.gif.textures) != "undefined"){
					for(var i = 0; i < app.gif.textures.length; i++){
						add_image(app.gif.textures[i], i);
					}
				}

				this.shader_player.set_vertex_shader(app.vertex_shader);
				this.shader_player.set_code(app.gif.code);
				
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
