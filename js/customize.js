// 캐릭터 커스터마이즈: 프리셋 색상 선택 또는 8x8 도화지에 직접 그려서 사용.
// 히트박스(원형)는 이 모듈과 무관하게 player.js에서 항상 고정 렌더링된다.
const SKIN_PRESETS=[
  {id:"cyan",   name:"시안",    glow:"#68e0ff", fill:"#eaffff", stroke:"#68e0ff"},
  {id:"magenta",name:"마젠타",  glow:"#ff6ec7", fill:"#fff0fa", stroke:"#ff6ec7"},
  {id:"lime",   name:"라임",    glow:"#9dff6e", fill:"#f4ffe8", stroke:"#9dff6e"},
  {id:"amber",  name:"앰버",    glow:"#ffbb55", fill:"#fff6e8", stroke:"#ffbb55"},
  {id:"violet", name:"바이올렛",glow:"#b388ff", fill:"#f3ecff", stroke:"#b388ff"},
];
const SKIN_PALETTE=["#ffffff","#68e0ff","#ff6ec7","#9dff6e","#ffbb55","#b388ff","#ff5c5c","#12181f"];

class Customizer{
  constructor(initialAppearance,onChange){
    this.onChange=onChange;
    this.gridSize=SKIN_GRID_SIZE; // storage.js에 정의된 상수(8)와 반드시 동일해야 함
    this.pixels=new Array(this.gridSize*this.gridSize).fill(null);
    this.currentColor=SKIN_PALETTE[0];
    this.mode="preset";
    this.presetId="cyan";

    if(initialAppearance){
      if(initialAppearance.type==="custom"&&Array.isArray(initialAppearance.pixels)&&initialAppearance.pixels.length===this.pixels.length){
        this.mode="custom";
        this.pixels=initialAppearance.pixels.slice();
      }else if(initialAppearance.presetId){
        this.presetId=initialAppearance.presetId;
      }
    }

    this.presetRow=document.getElementById("skinPresetRow");
    this.paletteRow=document.getElementById("skinPaletteRow");
    this.canvas=document.getElementById("skinEditorCanvas");
    this.ctx=this.canvas.getContext("2d");
    this.clearBtn=document.getElementById("skinClearBtn");
    this.applyBtn=document.getElementById("skinApplyBtn");
    this.resetBtn=document.getElementById("skinResetBtn");
    this.statusText=document.getElementById("skinStatusText");
    this.applyLabel=this.applyBtn.textContent;
    this.resetLabel=this.resetBtn.textContent;

    this.buildPresetSwatches();
    this.buildPalette();
    this.bindCanvas();

    this.clearBtn.onclick=()=>{
      this.pixels.fill(null);
      this.renderCanvas();
      this.flash(this.clearBtn,"지워짐 ✓",this.clearBtn.textContent);
    };
    this.applyBtn.onclick=()=>{
      this.mode="custom";
      this.onChange({type:"custom",pixels:this.pixels.slice()});
      this.highlight();
      this.updateStatus();
      this.flash(this.applyBtn,"적용됨 ✓",this.applyLabel);
    };
    this.resetBtn.onclick=()=>{
      this.mode="preset";this.presetId="cyan";this.pixels.fill(null);
      this.onChange({type:"preset",presetId:"cyan"});
      this.renderCanvas();
      this.highlight();
      this.updateStatus();
      this.flash(this.resetBtn,"기본형 적용 ✓",this.resetLabel);
    };

    this.renderCanvas();
    this.highlight();
    this.updateStatus();
  }

  // 버튼 클릭이 실제로 반영됐음을 잠깐 눈에 띄게 보여준다 (텍스트+색 변화, 일정 시간 뒤 원상복구).
  flash(btn,text,revertLabel){
    btn.textContent=text;
    btn.classList.add("flash");
    clearTimeout(btn._flashTimer);
    btn._flashTimer=setTimeout(()=>{
      btn.textContent=revertLabel;
      btn.classList.remove("flash");
    },1100);
  }

  // 현재 실제로 적용되어 있는 캐릭터가 무엇인지 항상 눈에 보이게 표시.
  updateStatus(){
    if(this.mode==="custom"){
      this.statusText.textContent="현재 캐릭터: 직접 그린 캐릭터 적용됨";
    }else{
      this.statusText.textContent=`현재 캐릭터: ${this.presetById(this.presetId).name} 프리셋 적용됨`;
    }
  }

  presetById(id){ return SKIN_PRESETS.find(p=>p.id===id)||SKIN_PRESETS[0]; }

  buildPresetSwatches(){
    this.presetRow.innerHTML="";
    SKIN_PRESETS.forEach(p=>{
      const b=document.createElement("button");
      b.type="button";
      b.className="skin-swatch";
      b.style.background=p.glow;
      b.title=p.name;
      b.dataset.id=p.id;
      b.onclick=()=>{
        this.mode="preset";this.presetId=p.id;
        this.onChange({type:"preset",presetId:p.id});
        this.highlight();
        this.updateStatus();
      };
      this.presetRow.appendChild(b);
    });
  }

  buildPalette(){
    this.paletteRow.innerHTML="";
    const makeSwatch=(color,label)=>{
      const b=document.createElement("button");
      b.type="button";
      b.className="palette-swatch"+(color===null?" eraser":"");
      if(color)b.style.background=color;
      if(label)b.textContent=label;
      b.onclick=()=>{
        this.currentColor=color;
        [...this.paletteRow.children].forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
      };
      return b;
    };
    SKIN_PALETTE.forEach(c=>this.paletteRow.appendChild(makeSwatch(c,null)));
    this.paletteRow.appendChild(makeSwatch(null,"⌫"));
    if(this.paletteRow.children[0])this.paletteRow.children[0].classList.add("active");
  }

  bindCanvas(){
    let painting=false;
    const paintAt=(clientX,clientY)=>{
      const r=this.canvas.getBoundingClientRect();
      const cellW=r.width/this.gridSize, cellH=r.height/this.gridSize;
      const gx=Math.floor((clientX-r.left)/cellW), gy=Math.floor((clientY-r.top)/cellH);
      if(gx<0||gy<0||gx>=this.gridSize||gy>=this.gridSize)return;
      this.pixels[gy*this.gridSize+gx]=this.currentColor;
      this.renderCanvas();
    };
    this.canvas.addEventListener("mousedown",e=>{painting=true;paintAt(e.clientX,e.clientY);});
    addEventListener("mousemove",e=>{if(painting)paintAt(e.clientX,e.clientY);});
    addEventListener("mouseup",()=>{painting=false;});
    this.canvas.addEventListener("touchstart",e=>{painting=true;const t=e.touches[0];paintAt(t.clientX,t.clientY);e.preventDefault();},{passive:false});
    this.canvas.addEventListener("touchmove",e=>{if(painting){const t=e.touches[0];paintAt(t.clientX,t.clientY);}e.preventDefault();},{passive:false});
    addEventListener("touchend",()=>{painting=false;});
  }

  renderCanvas(){
    const w=this.canvas.width,h=this.canvas.height;
    const cellW=w/this.gridSize, cellH=h/this.gridSize;
    this.ctx.clearRect(0,0,w,h);
    this.ctx.fillStyle="#0c1420";this.ctx.fillRect(0,0,w,h);
    for(let gy=0;gy<this.gridSize;gy++){
      for(let gx=0;gx<this.gridSize;gx++){
        const c=this.pixels[gy*this.gridSize+gx];
        if(c){this.ctx.fillStyle=c;this.ctx.fillRect(gx*cellW,gy*cellH,cellW,cellH);}
        this.ctx.strokeStyle="rgba(255,255,255,.06)";this.ctx.strokeRect(gx*cellW,gy*cellH,cellW,cellH);
      }
    }
  }

  highlight(){
    [...this.presetRow.children].forEach(b=>b.classList.toggle("active",this.mode==="preset"&&b.dataset.id===this.presetId));
    this.canvas.classList.toggle("active-skin",this.mode==="custom");
  }

  // game.js가 렌더링용 skin 객체를 얻을 때 사용
  currentSkin(){
    if(this.mode==="custom")return {type:"custom",pixels:this.pixels.slice(),gridSize:this.gridSize};
    const p=this.presetById(this.presetId);
    return {type:"preset",glow:p.glow,fill:p.fill,stroke:p.stroke};
  }
}
