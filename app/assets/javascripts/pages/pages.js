window.onload = function(){
	if(document.getElementById("main-app") != null){
		var chunk_size = 8;

		var main_app = new Vue({
			el: "#main-app",
			data: {
				gifs: [],
				mosaic_gifs: [],
				initial_qty: -1,
				current_offset: -1,
				has_more: true
			},
			methods: {
				receive_more: function(req){
					// Exctract data
					var resp = JSON.parse(req.responseText);

					// Reached the end?
					if(resp.length == 0){
						this.has_more = false;
					}
					
					// Increase quantiry
					this.current_offset += resp.length;
					// Add gifs
					this.gifs = this.gifs.concat(resp);
				},
				load_more: function(){
					var app = this;
					var req = new XMLHttpRequest();

					if(app.initial_qty == -1){
						app.initial_qty = app.gifs.length;
						app.current_offset = app.initial_qty;
					}
					
					var to_skip = app.current_offset + chunk_size;
					req.addEventListener("load", function(){
						app.receive_more(req);
					});
					req.open("GET", "/gifs/list?take="+chunk_size+"&skip="+app.current_offset);
					req.send();
				}
			}
		});
		
		var gifs = JSON.parse(
			document.getElementById("main-gifs-json").innerHTML
		);

		main_app.gifs = gifs;

		var mosaic_el = document.getElementById("mosaic-gifs-json");
		
		if(typeof(mosaic_el) != "undefined"){
			var mosaic_gifs = JSON.parse(
				mosaic_el.innerHTML
			);

			main_app.mosaic_gifs = mosaic_gifs;
		}
	}

	

	if(document.getElementById("single-gif-app") != null){
		var single_gif_app = new Vue({
			el: "#single-gif-app",
			data: {
				gifs: []
			}
		});

		var gifs = JSON.parse(
			document.getElementById("single-gif-json").innerHTML
		);
		
		single_gif_app.gifs = gifs;


		single_gif_app.$nextTick(function(){
			single_gif_app.$children[0].$children[0].show_code();
		});
	}

	
	if(document.getElementById("profile-app") != null){
		var profile_app = new Vue({
			el: "#profile-app",
			data: {
				gifs: []
			}
		});

		var gifs = JSON.parse(
			document.getElementById("profile-gifs-json").innerHTML
		);
		
		profile_app.gifs = gifs;
	}

	if(document.getElementById("gifs-and-drafts-app") != null){
		var gifs_and_drafts_app = new Vue({
			el: "#gifs-and-drafts-app",
			data: {
				data: []
			}
		});
		
		var data = JSON.parse(
			document.getElementById("gifs-and-drafts-json").innerHTML
		);
		
		gifs_and_drafts_app.data = data;
	}

	
	
};
