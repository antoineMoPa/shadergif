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
				has_more: true,
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

        var mosaic_gifs = JSON.parse(
			document.getElementById("mosaic-gifs-json").innerHTML
		);

		main_app.mosaic_gifs = gifs;
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
}
