class Input{
  constructor(){
    this.keys=new Set();
    const blocked=new Set(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyW","KeyA","KeyS","KeyD"]);
    addEventListener("keydown",e=>{if(blocked.has(e.code))e.preventDefault();this.keys.add(e.code)});
    addEventListener("keyup",e=>this.keys.delete(e.code));
    addEventListener("blur",()=>this.keys.clear());
  }
  down(...codes){return codes.some(c=>this.keys.has(c))}
  direction(){
    let x=0,y=0;
    if(this.down("ArrowLeft","KeyA"))x--;
    if(this.down("ArrowRight","KeyD"))x++;
    if(this.down("ArrowUp","KeyW"))y--;
    if(this.down("ArrowDown","KeyS"))y++;
    const l=Math.hypot(x,y);
    return l?{x:x/l,y:y/l}:{x:0,y:0};
  }
}