window.onload = function(){
	if(document.getElementById("home-app") != null){
		var home_app = new Vue({
			el: "#home-app",
			data: {
				gifs: []
			}
		});
		
		var gifs = JSON.parse(
			document.getElementById("home-gifs-json").innerHTML
		);
		
		home_app.gifs = gifs;
		
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
