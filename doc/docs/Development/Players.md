# Player kernels

A player kernel is a class containing at least these functions

	class ShaderPlayer {
		constructor(){
	
		set_container(div){
			div.appendChild(this.canvas);
		}
		
		set_code(code){
			
		}
		
		set_width(w){
			this.width = w;
		}
		
		set_height(h){
			this.height = h;
		}
		
		/* callback receives a canvas element */
		render(time, callback){
			
		}
	}