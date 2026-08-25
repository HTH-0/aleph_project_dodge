class UI{
  constructor(){
    this.start=document.getElementById("startScreen");this.result=document.getElementById("resultScreen");this.hud=document.getElementById("hud");
    this.pause=document.getElementById("pauseScreen");
    this.startButton=document.getElementById("startButton");this.restartButton=document.getElementById("restartButton");this.menuButton=document.getElementById("menuButton");
    this.resumeButton=document.getElementById("resumeButton");this.pauseMenuButton=document.getElementById("pauseMenuButton");this.pauseButton=document.getElementById("pauseButton");
    this.score=document.getElementById("score");this.time=document.getElementById("time");
    this.difficultyLabel=document.getElementById("difficultyLabel");this.difficultyValue=document.getElementById("difficultyValue");
    this.resultTitle=document.getElementById("resultTitle");this.resultMessage=document.getElementById("resultMessage");
    this.finalDifficulty=document.getElementById("finalDifficulty");this.finalScore=document.getElementById("finalScore");this.finalTime=document.getElementById("finalTime");
    this.challengeNote=document.getElementById("challengeResultNote");this.challengeStageText=document.getElementById("challengeStageText");this.challengeBestText=document.getElementById("challengeBestText");
    this.bestStageValue=document.getElementById("bestStageValue");
    this.historyList=document.getElementById("historyList");
    this.stageToast=document.getElementById("stageClearToast");this.stageToastText=document.getElementById("stageClearText");

    // 도전 모드: 이어하기 / 처음부터
    this.challengeStartOptions=document.getElementById("challengeStartOptions");
    this.resumeStageBtn=document.getElementById("resumeStageBtn");this.resumeStageValue=document.getElementById("resumeStageValue");
    this.startModeButtons=[...document.querySelectorAll(".start-mode")];
    this.startMode="resume"; // "resume" | "1"
    this.bestStage=0;
    this.startModeButtons.forEach(b=>b.onclick=()=>{
      this.startMode=b.dataset.start;
      this.startModeButtons.forEach(x=>x.classList.toggle("active",x===b));
    });
    this.startModeButtons.forEach(b=>b.classList.toggle("active", b.dataset.start===this.startMode));

    // 효과 설정: 음소거 / 움직임 줄이기
    this.muteToggle=document.getElementById("muteToggle");this.motionToggle=document.getElementById("motionToggle");

    this.selected="easy";
    this.buttons=[...document.querySelectorAll(".difficulty")];
    this.buttons.forEach(b=>b.onclick=()=>{
      this.selected=b.dataset.difficulty;
      this.buttons.forEach(x=>x.classList.toggle("active",x===b));
      this.challengeStartOptions.classList.toggle("hidden", this.selected!=="challenge" || this.bestStage<1);
    });
  }
  difficulty(){return this.selected}

  // 도전 모드 시작 단계: 이어하기 선택 시 저장된 최고(=이어하기) 단계, 아니면 1단계
  challengeStartStage(){
    return this.startMode==="resume" ? Math.max(1,this.bestStage) : 1;
  }

  showPlaying(name,isChallenge,stage){
    this.start.classList.add("hidden");this.result.classList.add("hidden");this.pause.classList.add("hidden");this.hud.classList.remove("hidden");
    if(isChallenge){
      this.difficultyValue.textContent=`STAGE ${stage}`;
      this.difficultyLabel.textContent="CHALLENGE";
    }else{
      this.difficultyValue.textContent=name;
      this.difficultyLabel.textContent=name.toUpperCase();
    }
  }

  showMenu(){this.result.classList.add("hidden");this.hud.classList.add("hidden");this.pause.classList.add("hidden");this.start.classList.remove("hidden")}

  showResult(clear,score,time,name,challengeInfo){
    this.hud.classList.add("hidden");this.pause.classList.add("hidden");this.result.classList.remove("hidden");
    this.resultTitle.textContent=clear?"CLEAR!":"GAME OVER";
    this.resultMessage.textContent=clear?"30초 생존 성공!":"장애물에 피격되었습니다.";
    this.finalDifficulty.textContent=name;this.finalScore.textContent=Math.floor(score).toLocaleString();this.finalTime.textContent=time.toFixed(1)+"s";

    if(challengeInfo){
      this.challengeNote.classList.remove("hidden");
      this.challengeStageText.textContent=challengeInfo.reachedStage;
      this.challengeBestText.textContent=challengeInfo.bestStage;
    }else{
      this.challengeNote.classList.add("hidden");
    }
  }

  // 일시정지: HUD는 그대로 두어 현재 게임 상태(점수/시간)가 계속 보이게 하고, 위에 패널만 띄운다.
  showPause(){this.pause.classList.remove("hidden")}
  hidePause(){this.pause.classList.add("hidden")}

  showStageClear(stageCleared,nextStage){
    this.stageToastText.textContent=`STAGE ${stageCleared} CLEAR! → ${nextStage} 단계로`;
    this.stageToast.classList.remove("hidden");
  }
  hideStageClear(){this.stageToast.classList.add("hidden")}

  update(score,time){this.score.textContent=Math.floor(score).toLocaleString();this.time.textContent=Math.max(0,30-time).toFixed(1)+"s"}

  // 저장 기능: 도전 모드 최고(=이어하기 시작) 단계 배지 갱신
  setBestStage(stage){
    this.bestStage=stage;
    this.bestStageValue.textContent=stage;
    this.resumeStageValue.textContent=stage>=1?stage:1;
    if(this.selected==="challenge")this.challengeStartOptions.classList.toggle("hidden", stage<1);
  }

  // 저장 기능: 최근 플레이 기록 렌더링 (개인정보 없이 결과/점수/시간만 표시)
  renderHistory(history){
    this.historyList.innerHTML="";
    if(!history||history.length===0){
      this.historyList.innerHTML=`<li class="history-empty">아직 플레이 기록이 없습니다.</li>`;
      return;
    }
    const recent=history.slice(-8).reverse();
    for(const h of recent){
      const li=document.createElement("li");
      li.className=h.cleared?"win":"lose";
      const label=h.mode==="challenge"
        ? `도전 · ${h.stage!=null?h.stage+"단계":"-"}`
        : h.difficultyName;
      const resultText=h.cleared?"성공":"실패";
      li.innerHTML=`<span>${label}</span><b>${resultText}</b><span>${h.score.toLocaleString()}점 · ${h.time.toFixed(1)}s</span>`;
      this.historyList.appendChild(li);
    }
  }

  // 효과 설정: 저장된 값으로 체크박스 초기화 (화면에 즉시 반영)
  initEffectToggles(settings,onChange){
    this.muteToggle.checked=!!settings.muted;
    this.motionToggle.checked=!!settings.reduceMotion;
    this.muteToggle.onchange=()=>onChange({muted:this.muteToggle.checked,reduceMotion:this.motionToggle.checked});
    this.motionToggle.onchange=()=>onChange({muted:this.muteToggle.checked,reduceMotion:this.motionToggle.checked});
  }
}
