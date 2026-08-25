const GAME={DURATION:30,SPEED_MULTIPLIER:1.5};

// 기존 기본 장애물 속도 120px/s를 1.5배 한 180px/s를 "쉬움"의 기준으로 사용.
const DIFFICULTIES={
  easy:{name:"쉬움",initialObstacles:3,speedMultiplier:1.00,spawnInterval:.80},
  normal:{name:"보통",initialObstacles:5,speedMultiplier:1.25,spawnInterval:.65},
  hard:{name:"어려움",initialObstacles:8,speedMultiplier:1.55,spawnInterval:.50}
};

class Game{
  constructor(){
    this.canvas=document.getElementById("gameCanvas");this.ctx=this.canvas.getContext("2d");
    this.input=new Input();this.ui=new UI();this.player=new Player(960,540);
    this.state="MENU";this.obstacles=[];this.particles=[];this.elapsed=0;this.score=0;
    this.spawnTimer=0;this.spawnInterval=.8;this.shake=0;this.last=performance.now();this.audio=null;
    this.currentDifficulty=DIFFICULTIES.easy;
    this.resize();addEventListener("resize",()=>this.resize());
    this.ui.startButton.onclick=()=>this.start(this.ui.difficulty());
    this.ui.restartButton.onclick=()=>this.start(this.ui.difficulty());
    this.ui.menuButton.onclick=()=>{this.state="MENU";this.ui.showMenu();this.player.reset(this.canvas.width,this.canvas.height);this.obstacles=[]};
    requestAnimationFrame(t=>this.loop(t));
  }

  resize(){
    const r=this.canvas.getBoundingClientRect(),ow=this.canvas.width||r.width,oh=this.canvas.height||r.height;
    this.canvas.width=Math.max(1,Math.floor(r.width));this.canvas.height=Math.max(1,Math.floor(r.height));
    if(this.state==="MENU")this.player.reset(this.canvas.width,this.canvas.height);
    else{this.player.x*=this.canvas.width/ow;this.player.y*=this.canvas.height/oh}
  }

  start(key){
    this.currentDifficulty=DIFFICULTIES[key]||DIFFICULTIES.easy;
    this.state="PLAYING";this.elapsed=0;this.score=0;this.spawnTimer=0;
    this.obstacles=[];this.particles=[];this.shake=0;
    this.player.reset(this.canvas.width,this.canvas.height);
    this.spawnInterval=this.currentDifficulty.spawnInterval;
    this.ui.showPlaying(this.currentDifficulty.name);
    this.initialSpawn();
    this.beep(520,.07);
  }

  initialSpawn(){
    for(let i=0;i<this.currentDifficulty.initialObstacles;i++)this.spawn();
  }

  end(clear){
    this.state=clear?"CLEAR":"GAMEOVER";this.shake=18;
    this.burst(this.player.x,this.player.y,clear?50:75);
    this.ui.showResult(clear,this.score,this.elapsed,this.currentDifficulty.name);
    this.beep(clear?880:120,.18);
  }

  difficulty(){
    const p=Math.min(1,this.elapsed/GAME.DURATION);
    const base=this.currentDifficulty.spawnInterval;
    this.spawnInterval=Math.max(.25,base-(base-.25)*p);
  }

  spawn(){
    const w=this.canvas.width,h=this.canvas.height,r=8+Math.random()*5;
    let type="straight";
    const roll=Math.random();

    // 초반은 직선형 중심, 10초 이후 S자형, 20초 이후 유도형 등장.
    if(this.elapsed>=20&&roll<.32)type="homing";
    else if(this.elapsed>=10&&roll<.42)type="sine";

    const side=Math.floor(Math.random()*4);
    let x,y,angle;

    if(side===0){x=Math.random()*w;y=-35}
    else if(side===1){x=w+35;y=Math.random()*h}
    else if(side===2){x=Math.random()*w;y=h+35}
    else{x=-35;y=Math.random()*h}

    // 핵심: 장애물 생성 순간의 "현재 플레이어 위치"를 향한다.
    const dx=this.player.x-x,dy=this.player.y-y;
    const targetAngle=Math.atan2(dy,dx);
    angle=targetAngle;

    // 기본 속도 120 × 1.5 = 180px/s. 이 값이 쉬움 기준.
    let speed=180*this.currentDifficulty.speedMultiplier;

    if(type==="homing")speed*=.72;
    if(type==="sine")speed*=.92;

    this.obstacles.push(new Obstacle(x,y,r,speed,angle,type));
  }

  update(dt){
    if(this.state!=="PLAYING")return;

    this.elapsed+=dt;
    this.score=Math.min(3000,this.elapsed*100);
    this.difficulty();
    this.player.update(dt,this.input,this.canvas.width,this.canvas.height);

    this.spawnTimer+=dt;
    while(this.spawnTimer>=this.spawnInterval){
      this.spawnTimer-=this.spawnInterval;
      this.spawn();
    }

    for(const o of this.obstacles)o.update(dt,this.player);

    for(let i=this.obstacles.length-1;i>=0;i--){
      const o=this.obstacles[i];

      if(o.offscreen(this.canvas.width,this.canvas.height)){
        this.obstacles.splice(i,1);
        continue;
      }

      if(Math.hypot(this.player.x-o.x,this.player.y-o.y)<this.player.hitboxRadius+o.radius){
        this.end(false);
        break;
      }
    }

    for(const p of this.particles)p.update(dt);
    this.particles=this.particles.filter(p=>p.life>0);
    this.shake=Math.max(0,this.shake-dt*40);
    this.ui.update(this.score,this.elapsed);

    if(this.elapsed>=GAME.DURATION)this.end(true);
  }

  render(t){
    const w=this.canvas.width,h=this.canvas.height;
    this.ctx.clearRect(0,0,w,h);this.background(t);this.ctx.save();

    if(this.shake)this.ctx.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);

    for(const o of this.obstacles)o.draw(this.ctx,t);
    for(const p of this.particles)p.draw(this.ctx);
    this.player.draw(this.ctx,t);

    this.ctx.restore();
    if(this.state==="PLAYING")this.progress();
  }

  background(t){
    const w=this.canvas.width,h=this.canvas.height;
    const g=this.ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h)*.75);
    g.addColorStop(0,"#12243a");g.addColorStop(.55,"#08111e");g.addColorStop(1,"#050811");
    this.ctx.fillStyle=g;this.ctx.fillRect(0,0,w,h);

    this.ctx.save();this.ctx.globalAlpha=.22;
    for(let x=0;x<w;x+=48){this.ctx.strokeStyle="rgba(255,255,255,.05)";this.ctx.beginPath();this.ctx.moveTo(x,0);this.ctx.lineTo(x,h);this.ctx.stroke()}
    for(let y=0;y<h;y+=48){this.ctx.beginPath();this.ctx.moveTo(0,y);this.ctx.lineTo(w,y);this.ctx.stroke()}
    this.ctx.restore();

    this.ctx.save();
    for(let i=0;i<45;i++){
      const x=(i*137)%w,y=(i*73)%h,a=.1+Math.sin(t*.001+i)*.04;
      this.ctx.fillStyle=`rgba(200,230,255,${a})`;this.ctx.fillRect(x,y,1,1);
    }
    this.ctx.restore();
  }

  progress(){
    const w=this.canvas.width,h=this.canvas.height;
    this.ctx.fillStyle="rgba(255,255,255,.06)";this.ctx.fillRect(0,h-3,w,3);
    this.ctx.fillStyle="#68e0ff";this.ctx.fillRect(0,h-3,w*Math.min(1,this.elapsed/GAME.DURATION),3);
  }

  burst(x,y,n){for(let i=0;i<n;i++)this.particles.push(new Particle(x,y))}

  beep(freq,duration){
    try{
      if(!this.audio)this.audio=new(window.AudioContext||window.webkitAudioContext)();
      if(this.audio.state==="suspended")this.audio.resume();
      const o=this.audio.createOscillator(),g=this.audio.createGain();
      o.frequency.value=freq;o.type="sine";
      g.gain.setValueAtTime(.045,this.audio.currentTime);
      g.gain.exponentialRampToValueAtTime(.001,this.audio.currentTime+duration);
      o.connect(g);g.connect(this.audio.destination);
      o.start();o.stop(this.audio.currentTime+duration);
    }catch(e){}
  }

  loop(t){
    const dt=Math.min(.05,(t-this.last)/1000);
    this.last=t;this.update(dt);this.render(t);
    requestAnimationFrame(x=>this.loop(x));
  }
}

addEventListener("DOMContentLoaded",()=>new Game());