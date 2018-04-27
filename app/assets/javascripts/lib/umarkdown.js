/*
  Copyright Antoine Morin-Paulhus 2018
  Licence: GNU GPL v3
  micro markdown

  TODO: bullet list, numbered list, links, etc.
  
*/

function umarkdown(element){
	var html = element.innerHTML;

	html = html.split("\n");

	var is_code = false;
	var new_html = "";
	
	for(var i = 0; i < html.length; i++){
		var line = html[i];
		if(line.match(/    |\t/) != null){
			line = line.replace(/^(    |\t)/, "");
			if(is_code){
				// do nothing special
			} else {
				is_code = true;
				// Start code block
				new_html += "<pre class='code'>";
			}

			line = line.replace(/([a-zA-Z0-9]*)/g,"<span class='token'>$1</span>");
			
			new_html += line;
		} else {
			is_code = false;
			// Stop code block
			new_html += "</pre>";

			// Bold
			line = line.replace(/\*\*(.*)\*\*/g,"<span class='bold'>$1</span>");
			// Italic
			line = line.replace(/\*(.*)\*/g,"<span class='italic'>$1</span>");
			// Backticks
			line = line.replace(/\`(.*)\`/g,"<span class='backticks'>$1</span>");
			
			new_html += line;
		}
	}
	
	element.innerHTML = new_html;
}
