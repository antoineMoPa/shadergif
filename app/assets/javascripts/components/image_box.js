//= require lib/umarkdown.js

Vue.component(
	'image-box',
	{
		template: '#image-box-template',
		props: ["gif"],
		data: function(){
			return {
				show_video: false,
				code_is_visible: false
			};
		},
		methods: {
			show_code: function(){
				var component = this;
				this.code_is_visible = true;
				Vue.nextTick(function(){
					var el = component.$el
						.querySelectorAll(".image-code code")[0];
					
					Prism.highlightElement(el, false, function(){
						/* bulma messes up .number */
						var numbers = el.querySelectorAll(".number");

						// Replace .number with something else random
						numbers.forEach(function(num){
							num.classList.remove("number");
							num.classList.add("property");
						});
						
					});
				});
			},
			play: function(){
				// stop other videos
				var videos = document.querySelectorAll("video");
				// Start this one
				var video = this.$el.querySelectorAll("video")[0];

				video.isCurrent = true;
				
				videos.forEach(function(vid){
					if(vid.isCurrent){
						// Don't pause ourselves
						return;
					}
					vid.pause();

					if(typeof(vid.onShadergifPause) != "undefined"){
						vid.onShadergifPause();
					}
				});

				video.isCurrent = false;
				
				video.play();
			}
		},
		watch: {
			show_video: function(){
				if(this.show_video){
					this.play();
				}
			}
		},
		mounted: function(){
			var comp = this;
			var video = this.$el.querySelectorAll("video")[0];

			video.onShadergifPause = function(){
				comp.show_video = false;
			};

			this.$nextTick(function(){
				/* run umarkdown on gif description */
				umarkdown(
					this.$el.querySelectorAll(".gif-description")[0]
				);
			});
		}
	}
);

Vue.component(
	'image-box-list',
	{
		template: '#image-box-list-template',
		props: ["gifs"],
		data: function(){
			return {
				
			};
		}		
	}
);
