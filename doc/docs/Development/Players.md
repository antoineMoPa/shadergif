# The idea

There is one editor that calls a similar interface for every platform/language. This way, it is easy to add new languages to ShaderGif. 

# Player kernels

A player kernel is a class containing at least these functions:

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

		dispose(){
			// Clean up your stuff on player change/delete
		}
		
		/* callback receives a canvas element */
		render(time, callback){
			
		}

		set_on_error_listener(callback){
			// Call this on error
			this.on_error_listener = callback;
		}
	}

* Some extra methods exist and may be required, in doubt, refer to Javascript player.

# Where are the players?

This folder: `app/assets/javascript/players`

# Adding a new language

If you want to add a new player, I suggest you copy/pasta the Javascript Player and proceed to update the constants in `app/assets/javascript/editor.js` and `app/assets/javascript/components.js`.
