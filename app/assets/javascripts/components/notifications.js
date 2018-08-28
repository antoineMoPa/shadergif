Vue.component(
	'notifications',
	{
		template: `
			<div class="notifications">
				<div v-for="notification in notifications"
					 v-bind:class="((!notification.is_read)?'is-primary':'') + ' notification'">
					<a v-bind:href="notification.link">
					   {{ notification.text }}
					</a>
				</div>
			</div>
			`,
		props: ['notifications'],
		data: function(){
			return {
			  	
			}	  
		}
	}
);
