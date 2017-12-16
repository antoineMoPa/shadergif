Vue.component(
	'image-box',
	{
		template: '#image-box-template',
		props: ["gif"],
		data: function(){
			return {
				show_actual_gif: false,
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
			}
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
