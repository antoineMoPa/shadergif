function render(can, time){
    ctx = can.getContext("2d");
    
    // Clear screen
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,can.width,can.height);
    
    // Draw square
    ctx.fillStyle = "rgba(140,100,200,1.0)";
    ctx.fillRect(can.width/2 - 100,can.height/2 - 100, 200, 200);
}
