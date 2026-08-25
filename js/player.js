const PLAYER_CONFIG={speed:300,size:30,hitboxRadius:7};
class Player{
  constructor(w,h){this.reset(w,h)}
  reset(w,h){this.x=w/2;this.y=h/2;this.vx=0;this.vy=0;this.hitboxRadius=PLAYER_CONFIG.hitboxRadius}
  update(dt,input,w,h){
    const d=input.direction();this.vx=d.x;this.vy=d.y;
    this.x+=d.x*PLAYER_CONFIG.speed*dt;this.y+=d.y*PLAYER_CONFIG.speed*dt;
    const p=PLAYER_CONFIG.size/2;
    this.x=Math.max(p,Math.min(w-p,this.x));this.y=Math.max(p,Math.min(h-p,this.y));
  }
  draw(ctx,t){
    ctx.save();
    const pulse=1+Math.sin(t*.008)*.06;
    const g=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,28*pulse);
    g.addColorStop(0,"rgba(104,224,255,.28)");g.addColorStop(1,"rgba(104,224,255,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(this.x,this.y,28*pulse,0,Math.PI*2);ctx.fill();
    ctx.translate(this.x,this.y);
    if(this.vx||this.vy)ctx.rotate(Math.atan2(this.vy,this.vx)+Math.PI/2);
    ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(12,13);ctx.lineTo(0,7);ctx.lineTo(-12,13);ctx.closePath();
    ctx.fillStyle="#eaffff";ctx.shadowColor="#68e0ff";ctx.shadowBlur=18;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle="#68e0ff";ctx.stroke();
    ctx.restore();
    ctx.save();ctx.beginPath();ctx.arc(this.x,this.y,this.hitboxRadius,0,Math.PI*2);
    ctx.fillStyle="rgba(104,224,255,.25)";ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.stroke();
    ctx.beginPath();ctx.arc(this.x,this.y,2,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.restore();
  }
}