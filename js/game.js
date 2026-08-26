const GAME={DURATION:30,SPEED_MULTIPLIER:1.5};

// 기존 기본 장애물 속도 120px/s를 1.5배 한 180px/s를 "쉬움"의 기준으로 사용.
const DIFFICULTIES={
  easy:{name:"쉬움",initialObstacles:3,speedMultiplier:1.00,spawnInterval:.80},
  normal:{name:"보통",initialObstacles:5,speedMultiplier:1.25,spawnInterval:.65},
  hard:{name:"어려움",initialObstacles:8,speedMultiplier:1.55,spawnInterval:.50}
};

// 도전 모드: "어려움"을 기준으로 단계(stage)가 오를수록 계속 어려워진다.
function challengeConfig(stage){
  const base=DIFFICULTIES.hard;
  const growth=Math.max(0,stage-1);
  return{
    name:`도전 ${stage}단계`,
    initialObstacles:Math.min(20,base.initialObstacles+Math.floor(growth*0.8)),
    speedMultiplier:base.speedMultiplier+growth*0.10,
    spawnInterval:Math.max(0.22,base.spawnInterval-growth*0.018)
  };
}

class Game{
  constructor(){
    this.canvas=document.getElementById("gameCanvas");this.ctx=this.canvas.getContext("2d");
    this.input=new Input();this.ui=new UI();this.player=new Player(960,540);
    this.state="MENU";this.obstacles=[];this.particles=[];this.elapsed=0;this.score=0;
    this.spawnTimer=0;this.spawnInterval=.8;this.shake=0;this.last=performance.now();this.audio=null;
    this.currentDifficulty=DIFFICULTIES.easy;

    // 도전 모드 상태
    this.isChallenge=false;this.challengeStage=1;this._stageTimer=null;

    // 저장된 기록 불러오기 (손상/누락 시 storage.js가 기본값 반환)
    this.save=Storage.load();
    this.ui.setBestStage(this.save.bestChallengeStage);
    this.ui.renderHistory(this.save.history);

    // 효과 설정: 음소거 / 움직임 줄이기 (저장값으로 초기화 + 변경 시 즉시 반영·저장)
    this.muted=this.save.settings.muted;
    this.reduceMotion=this.save.settings.reduceMotion;
    this.ui.initEffectToggles(this.save.settings,(next)=>{
      this.muted=next.muted;
      this.reduceMotion=next.reduceMotion;
      this.save=Storage.saveSettings(next);
      if(this.reduceMotion){
        // 켜는 즉시 현재 흔들림을 멈추고 파티클 수를 줄인다.
        this.shake=0;
        if(this.particles.length>5)this.particles.length=5;
      }
    });

    // 캐릭터 커스터마이즈: 프리셋 선택 또는 직접 그리기 -> 즉시 반영 + 저장
    this.customizer=new Customizer(this.save.appearance,(appearance)=>{
      this.save=Storage.saveAppearance(appearance);
      this.player.setSkin(this.customizer.currentSkin());
    });
    this.player.setSkin(this.customizer.currentSkin());

    this.resize();addEventListener("resize",()=>this.resize());
    this.ui.startButton.onclick=()=>this.start(this.ui.difficulty());
    this.ui.restartButton.onclick=()=>this.start(this.ui.difficulty());
    this.ui.menuButton.onclick=()=>this.goToMenu();

    // 일시정지 컨트롤
    this.ui.pauseButton.onclick=()=>this.togglePause();
    this.ui.resumeButton.onclick=()=>this.resume();
    this.ui.pauseMenuButton.onclick=()=>this.goToMenu();
    addEventListener("keydown",e=>{if(e.code==="Escape")this.togglePause()});
    addEventListener("blur",()=>{if(this.state==="PLAYING")this.pause()});

    requestAnimationFrame(t=>this.loop(t));
  }

  resize(){
    const r=this.canvas.getBoundingClientRect(),ow=this.canvas.width||r.width,oh=this.canvas.height||r.height;
    this.canvas.width=Math.max(1,Math.floor(r.width));this.canvas.height=Math.max(1,Math.floor(r.height));
    if(this.state==="MENU")this.player.reset(this.canvas.width,this.canvas.height);
    else{this.player.x*=this.canvas.width/ow;this.player.y*=this.canvas.height/oh}
  }

  goToMenu(){
    clearTimeout(this._stageTimer);
    // 도전 모드 진행 중(PLAYING/PAUSED) 메뉴로 나가면, 그 시점 단계를 이어하기 지점으로 저장한다.
    if(this.isChallenge&&(this.state==="PLAYING"||this.state==="PAUSED")){
      const result=Storage.recordPlay({mode:"challenge",difficultyName:this.currentDifficulty.name,stage:this.challengeStage,cleared:false,score:this.score,time:this.elapsed});
      this.save=result.data;
      this.ui.setBestStage(this.save.bestChallengeStage);
      this.ui.renderHistory(this.save.history);
    }
    this.state="MENU";this.ui.showMenu();this.player.reset(this.canvas.width,this.canvas.height);this.obstacles=[];
  }

  start(key){
    clearTimeout(this._stageTimer);
    this.isChallenge=key==="challenge";
    this.challengeStage=this.isChallenge?this.ui.challengeStartStage():1;
    this.currentDifficulty=this.isChallenge?challengeConfig(this.challengeStage):(DIFFICULTIES[key]||DIFFICULTIES.easy);

    this.state="PLAYING";this.elapsed=0;this.score=0;this.spawnTimer=0;
    this.obstacles=[];this.particles=[];this.shake=0;
    this.player.reset(this.canvas.width,this.canvas.height);
    this.spawnInterval=this.currentDifficulty.spawnInterval;
    this.ui.showPlaying(this.currentDifficulty.name,this.isChallenge,this.challengeStage);
    this.initialSpawn();
    this.beep(520,.07);
  }

  initialSpawn(){
    for(let i=0;i<this.currentDifficulty.initialObstacles;i++)this.spawn();
  }

  end(clear){
    // 도전 모드에서 30초를 버티면 종료하지 않고 다음 단계로 자동 진행한다.
    if(clear&&this.isChallenge){
      const clearedStage=this.challengeStage;
      this.challengeStage++;
      this.state="STAGE_CLEAR";
      this.shake=this.reduceMotion?2:10;
      this.burst(this.player.x,this.player.y,40);
      this.ui.showStageClear(clearedStage,this.challengeStage);
      this.beep(880,.12);
      this._stageTimer=setTimeout(()=>this.nextChallengeStage(),1100);
      return;
    }

    this.state=clear?"CLEAR":"GAMEOVER";this.shake=this.reduceMotion?3:18;
    this.burst(this.player.x,this.player.y,clear?50:75);
    this.beep(clear?880:120,.18);

    let challengeInfo=null;
    if(this.isChallenge){
      // 사용자가 요청한 규칙: "N단계에서 죽으면 기록은 N, 다음엔 N단계부터 이어하기"
      const reachedStage=this.challengeStage;
      const result=Storage.recordPlay({mode:"challenge",difficultyName:this.currentDifficulty.name,stage:reachedStage,cleared:false,score:this.score,time:this.elapsed});
      this.save=result.data;
      this.ui.setBestStage(this.save.bestChallengeStage);
      this.ui.renderHistory(this.save.history);
      challengeInfo={reachedStage,bestStage:this.save.bestChallengeStage};
    }else{
      const result=Storage.recordPlay({mode:"normal",difficultyName:this.currentDifficulty.name,stage:null,cleared:clear,score:this.score,time:this.elapsed});
      this.save=result.data;
      this.ui.renderHistory(this.save.history);
    }

    this.ui.showResult(clear,this.score,this.elapsed,this.currentDifficulty.name,challengeInfo);
  }

  nextChallengeStage(){
    this.ui.hideStageClear();
    this.state="PLAYING";
    this.elapsed=0;this.spawnTimer=0;this.obstacles=[];this.particles=[];
    this.player.reset(this.canvas.width,this.canvas.height);
    this.currentDifficulty=challengeConfig(this.challengeStage);
    this.spawnInterval=this.currentDifficulty.spawnInterval;
    this.ui.showPlaying(this.currentDifficulty.name,true,this.challengeStage);
    this.initialSpawn();
    this.last=performance.now();
  }

  // 일시정지: ESC 또는 화면(탭) 이탈 시 진행 상태를 멈춘다. 재개 전까지 시간/장애물/점수는 그대로 유지된다.
  pause(){
    if(this.state!=="PLAYING")return;
    this.state="PAUSED";
    this.input.keys.clear();
    this.ui.showPause();
  }
  resume(){
    if(this.state!=="PAUSED")return;
    this.state="PLAYING";
    this.last=performance.now();
    this.ui.hidePause();
  }
  togglePause(){
    if(this.state==="PLAYING")this.pause();
    else if(this.state==="PAUSED")this.resume();
  }

  difficulty(){
    const p=Math.min(1,this.elapsed/GAME.DURATION);
    const base=this.currentDifficulty.spawnInterval;
    this.spawnInterval=Math.max(.2,base-(base-.2)*p);
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
    this.score+=dt*100;
    if(!this.isChallenge)this.score=Math.min(3000,this.score);
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
    if(this.state==="PLAYING"||this.state==="PAUSED")this.progress();
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

  burst(x,y,n){
    if(this.reduceMotion)n=Math.max(1,Math.round(n*0.2));
    for(let i=0;i<n;i++)this.particles.push(new Particle(x,y));
  }

  beep(freq,duration){
    if(this.muted)return;
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

// window.__gameForTest: QA 자동화 스크립트가 현재 게임 상태(점수/시간/단계 등)를
// 읽어 검증할 수 있도록 노출. 개인정보/비밀값을 담지 않으므로 안전함.
addEventListener("DOMContentLoaded",()=>{window.__gameForTest=new Game();});
