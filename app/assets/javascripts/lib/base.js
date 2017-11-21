/*
  Here is a small set of dom tools
*/

/*
  Shortcut to document.querySelectorAll
 */
function qsa(sel){
    return document.querySelectorAll(sel);
}

/*
  qsa, but on an element
 */
function subqsa(el,sel){
    return el.querySelectorAll(sel);
}

/*
  Hide an element
  (you need to hide elements with a .hidden css 
   rule in your css code)
*/
function hide(el){
    el.classList.add("hidden");
}

/*
   Determine if hidden
 */
function hidden(el){
    return el.classList.contains("hidden");
}

/*
  Show an element
 */
function show(el){
    el.classList.remove("hidden");
}

/*
  Load a script
  Returns the content
 */
function load_script(name){
    var content = qsa("script[name="+name+"]")[0].innerHTML;
    return content;
}

/*
  Create a dom element
 */
function dom(html){
    var node = document.createElement("div");
    node.innerHTML = html;
    return node.children[0];
}

