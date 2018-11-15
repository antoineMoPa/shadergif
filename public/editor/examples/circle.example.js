function render(can, time){
    ctx = can.getContext("2d");
 
    // Clear screen
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,can.width,can.height);
    
    // Draw circle
    ctx.fillStyle = "rgba(140,100,200,1.0)";
    ctx.beginPath();
    ctx.arc(can.width/2,can.height/2,100,0,2 * Math.PI);
    ctx.fill();
}
