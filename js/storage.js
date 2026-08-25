// 저장 기능: 로그인/인증 없이 브라우저 localStorage만 사용.
// - bestChallengeStage: 도전 모드에서 클리어한 최고 단계
// - history: 최근 플레이 기록(최대 20개). 개인정보/비밀값은 저장하지 않음.
const STORAGE_KEY = "dodge_save_v1";

function defaultSave(){
  return { version: 1, bestChallengeStage: 0, history: [] };
}

function isValidHistoryEntry(e){
  return e && typeof e === "object"
    && typeof e.difficultyName === "string"
    && typeof e.mode === "string"
    && typeof e.cleared === "boolean"
    && Number.isFinite(e.score)
    && Number.isFinite(e.time);
}

const Storage = {
  // 저장값이 없거나 손상되어도 게임이 중단되지 않고 기본값으로 시작한다.
  load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return defaultSave();
      const data = JSON.parse(raw);
      if(!data || typeof data !== "object") return defaultSave();

      const bestChallengeStage = Number.isFinite(data.bestChallengeStage)
        ? Math.max(0, Math.floor(data.bestChallengeStage)) : 0;
      const history = Array.isArray(data.history)
        ? data.history.filter(isValidHistoryEntry).slice(-20) : [];

      return { version: 1, bestChallengeStage, history };
    }catch(e){
      // JSON 파싱 실패 등 손상된 저장값 -> 기본값으로 안전하게 복구
      return defaultSave();
    }
  },

  save(data){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    }catch(e){
      return false; // 저장 실패해도 게임 진행에는 영향 없음
    }
  },

  // 한 판이 끝날 때 호출. 기록을 남기고, 도전 모드면 최고 단계 갱신 여부를 반환한다.
  recordPlay({mode, difficultyName, stage, cleared, score, time}){
    const data = this.load();

    data.history.push({
      ts: Date.now(),
      mode,
      difficultyName,
      stage: Number.isFinite(stage) ? stage : null,
      cleared: !!cleared,
      score: Math.floor(score) || 0,
      time: Math.round((time || 0) * 10) / 10
    });
    if(data.history.length > 20) data.history = data.history.slice(-20);

    let isNewBest = false;
    if(mode === "challenge" && Number.isFinite(stage) && stage > data.bestChallengeStage){
      data.bestChallengeStage = stage;
      isNewBest = true;
    }

    this.save(data);
    return { data, isNewBest };
  }
};
