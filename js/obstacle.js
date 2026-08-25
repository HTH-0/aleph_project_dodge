class Obstacle{
  constructor(x,y,radius,speed,angle,type){
    this.x=x;this.y=y;this.radius=radius;this.speed=speed;this.angle=angle;this.type=type;
    this.age=0;this.seed=Math.random()*Math.PI*2;
    this.vx=Math.cos(angle)*speed;this.vy=Math.sin(angle)*speed;
    this.baseVx=this.vx;this.baseVy=this.vy;
  }
  update(dt,player){
    this.age+=dt;
    if(this.type==="homing"){
      // 유도형: 매 프레임 현재 플레이어 위치를 다시 계산한다.
      const dx=player.x-this.x,dy=player.y-this.y,l=Math.hypot(dx,dy)||1;
      const tx=dx/l*this.speed,ty=dy/l*this.speed;
      const turn=Math.min(1,dt*1.35);
      this.vx+=(tx-this.vx)*turn;this.vy+=(ty-this.vy)*turn;
      const v=Math.hypot(this.vx,this.vy)||1;
      this.vx=this.vx/v*this.speed;this.vy=this.vy/v*this.speed;
      this.x+=this.vx*dt;this.y+=this.vy*dt;
    }else if(this.type==="sine"){
      // 생성 시 정한 플레이어 위치 방향을 기본 진행 방향으로 유지하면서 S자 이동.
      this.x+=this.baseVx*dt;this.y+=this.baseVy*dt;
      const perpX=-Math.sin(this.angle),perpY=Math.cos(this.angle);
      const wave=Math.sin(this.age*3.8+this.seed)*105;
      this.x+=perpX*wave*dt;this.y+=perpY*wave*dt;
    }else{
      this.x+=this.vx*dt;this.y+=this.vy*dt;
    }
  }
  draw(ctx,t){
    ctx.save();
    let fill,stroke;
    if(this.type==="homing"){fill="rgba(255,100,124,.95)";stroke="#ff8092"}
    else if(this.type==="sine"){fill="rgba(181,126,255,.95)";stroke="#c79dff"}
    else{fill="rgba(255,181,91,.95)";stroke="#ffd08b"}
    const pulse=1+Math.sin(t*.01+this.seed)*.08;
    const g=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.radius*3);
    g.addColorStop(0,fill.replace(".95",".35"));g.addColorStop(1,fill.replace(".95","0"));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(this.x,this.y,this.radius*3,0,Math.PI*2);ctx.fill();
    ctx.translate(this.x,this.y);ctx.rotate(this.age*2);ctx.beginPath();
    if(this.type==="sine"){
      for(let i=0;i<6;i++){const a=i*Math.PI/3,rr=this.radius*pulse;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}
      ctx.closePath();
    }else ctx.arc(0,0,this.radius*pulse,0,Math.PI*2);
    ctx.fillStyle=fill;ctx.shadowColor=stroke;ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle=stroke;ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  }
  offscreen(w,h){return this.x<-90||this.x>w+90||this.y<-90||this.y>h+90}
}