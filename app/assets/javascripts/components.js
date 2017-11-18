
Vue.component(
	'image-box',
	{
		template: '#image-box-template',
		props: ["gif"],
		data: function(){
			return {
				show_actual_gif: false,
			};
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

Vue.component(
	'profile',
	{
		template: '#profile-template',
		props: ["gifs"],
		data: function(){
			return {
				
			};
		}		
	}
);
