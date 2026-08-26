// 시작 화면의 "조작 안내" / "캐릭터 커스터마이즈" 카드를 클릭으로 펼치고 접는다.
// 기본은 접힘 상태 — 세로 공간을 아끼면서도, 커스터마이즈를 열지 않아도
// 기본(시안 프리셋) 캐릭터로 바로 게임을 즐길 수 있다.
// 펼친 내용이 game-wrap 높이를 넘기면 overlay 자체가 스크롤되며(style.css),
// 펼치는 순간 해당 섹션이 화면에 바로 보이도록 스크롤을 맞춰준다.
addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll(".collapsible-toggle").forEach(btn=>{
    const target=document.getElementById(btn.dataset.target);
    if(!target)return;
    btn.onclick=()=>{
      const open=target.classList.toggle("open");
      btn.classList.toggle("open",open);
      if(open){
        // max-height 트랜지션(.25s)이 어느 정도 진행된 뒤 스크롤해야
        // 펼쳐진 실제 위치 기준으로 맞춰진다.
        setTimeout(()=>{ btn.scrollIntoView({behavior:"smooth",block:"start"}); },260);
      }
    };
  });
});
