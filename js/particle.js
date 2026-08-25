class Particle{
  constructor(x,y){
    this.x=x;this.y=y;const a=Math.random()*Math.PI*2,s=80+Math.random()*260;
    this.vx=Math.cos(a)*s;this.vy=Math.sin(a)*s;this.life=.45+Math.random()*.5;this.maxLife=this.life;this.size=2+Math.random()*4;
  }
  update(dt){this.life-=dt;this.x+=this.vx*dt;this.y+=this.vy*dt;this.vx*=.97;this.vy*=.97}
  draw(ctx){if(this.life<=0)return;ctx.save();ctx.globalAlpha=this.life/this.maxLife;ctx.fillStyle="#68e0ff";ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();ctx.restore()}
}