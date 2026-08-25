class UI{
  constructor(){
    this.start=document.getElementById("startScreen");this.result=document.getElementById("resultScreen");this.hud=document.getElementById("hud");
    this.startButton=document.getElementById("startButton");this.restartButton=document.getElementById("restartButton");this.menuButton=document.getElementById("menuButton");
    this.score=document.getElementById("score");this.time=document.getElementById("time");
    this.difficultyLabel=document.getElementById("difficultyLabel");this.difficultyValue=document.getElementById("difficultyValue");
    this.resultTitle=document.getElementById("resultTitle");this.resultMessage=document.getElementById("resultMessage");
    this.finalDifficulty=document.getElementById("finalDifficulty");this.finalScore=document.getElementById("finalScore");this.finalTime=document.getElementById("finalTime");
    this.selected="easy";
    this.buttons=[...document.querySelectorAll(".difficulty")];
    this.buttons.forEach(b=>b.onclick=()=>{this.selected=b.dataset.difficulty;this.buttons.forEach(x=>x.classList.toggle("active",x===b))});
  }
  difficulty(){return this.selected}
  showPlaying(name){this.start.classList.add("hidden");this.result.classList.add("hidden");this.hud.classList.remove("hidden");this.difficultyValue.textContent=name;this.difficultyLabel.textContent=name.toUpperCase()}
  showMenu(){this.result.classList.add("hidden");this.hud.classList.add("hidden");this.start.classList.remove("hidden")}
  showResult(clear,score,time,name){
    this.hud.classList.add("hidden");this.result.classList.remove("hidden");
    this.resultTitle.textContent=clear?"CLEAR!":"GAME OVER";
    this.resultMessage.textContent=clear?"30초 생존 성공!":"장애물에 피격되었습니다.";
    this.finalDifficulty.textContent=name;this.finalScore.textContent=Math.floor(score).toLocaleString();this.finalTime.textContent=time.toFixed(1)+"s";
  }
  update(score,time){this.score.textContent=Math.floor(score).toLocaleString();this.time.textContent=Math.max(0,30-time).toFixed(1)+"s"}
}