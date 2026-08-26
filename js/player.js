const PLAYER_CONFIG={speed:300,size:30,hitboxRadius:7};

function hexToRgb(hex){
  let h=(hex||"#68e0ff").replace("#","");
  if(h.length===3)h=h.split("").map(c=>c+c).join("");
  const n=parseInt(h,16);
  return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
}

class Player{
  constructor(w,h){
    this.skin=null; // setSkin()으로 외부(캐릭터 커스터마이즈)에서 주입. 없으면 기본 시안색 삼각형.
    this.reset(w,h);
  }
  reset(w,h){this.x=w/2;this.y=h/2;this.vx=0;this.vy=0;this.hitboxRadius=PLAYER_CONFIG.hitboxRadius}

  // 캐릭터 커스터마이즈 결과 적용.
  // preset: {type:"preset", glow, fill, stroke}
  // custom: {type:"custom", pixels:[...], gridSize:8}
  setSkin(skin){ this.skin=skin; }

  update(dt,input,w,h){
    const d=input.direction();this.vx=d.x;this.vy=d.y;
    this.x+=d.x*PLAYER_CONFIG.speed*dt;this.y+=d.y*PLAYER_CONFIG.speed*dt;
    const p=PLAYER_CONFIG.size/2;
    this.x=Math.max(p,Math.min(w-p,this.x));this.y=Math.max(p,Math.min(h-p,this.y));
  }

  draw(ctx,t){
    const isCustom = this.skin && this.skin.type==="custom" && Array.isArray(this.skin.pixels);
    const glowHex = (this.skin && this.skin.type==="preset" && this.skin.glow) ? this.skin.glow : "#68e0ff";
    const rgb = hexToRgb(glowHex);

    ctx.save();
    const pulse=1+Math.sin(t*.008)*.06;
    const g=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,28*pulse);
    g.addColorStop(0,`rgba(${rgb.r},${rgb.g},${rgb.b},.28)`);g.addColorStop(1,`rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(this.x,this.y,28*pulse,0,Math.PI*2);ctx.fill();

    ctx.translate(this.x,this.y);
    if(this.vx||this.vy)ctx.rotate(Math.atan2(this.vy,this.vx)+Math.PI/2);

    if(isCustom){
      // 직접 그린 픽셀 캐릭터: 격자를 캐릭터 크기에 맞춰 채워 그린다.
      const n=this.skin.gridSize||8;
      const size=PLAYER_CONFIG.size+6;
      const cell=size/n;
      ctx.translate(-size/2,-size/2);
      ctx.shadowColor=glowHex;ctx.shadowBlur=10;
      for(let gy=0;gy<n;gy++){
        for(let gx=0;gx<n;gx++){
          const c=this.skin.pixels[gy*n+gx];
          if(c){ctx.fillStyle=c;ctx.fillRect(Math.floor(gx*cell),Math.floor(gy*cell),Math.ceil(cell),Math.ceil(cell));}
        }
      }
      ctx.shadowBlur=0;
    }else{
      // 기본/프리셋 색상 삼각형 캐릭터
      const fill = (this.skin && this.skin.type==="preset" && this.skin.fill) ? this.skin.fill : "#eaffff";
      const stroke = (this.skin && this.skin.type==="preset" && this.skin.stroke) ? this.skin.stroke : "#68e0ff";
      ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(12,13);ctx.lineTo(0,7);ctx.lineTo(-12,13);ctx.closePath();
      ctx.fillStyle=fill;ctx.shadowColor=stroke;ctx.shadowBlur=18;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=stroke;ctx.stroke();
    }
    ctx.restore();

    // 히트박스 표시(원형) — 스킨과 무관하게 항상 동일하게 고정 표시.
    ctx.save();ctx.beginPath();ctx.arc(this.x,this.y,this.hitboxRadius,0,Math.PI*2);
    ctx.fillStyle="rgba(104,224,255,.25)";ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.stroke();
    ctx.beginPath();ctx.arc(this.x,this.y,2,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.restore();
  }
}
