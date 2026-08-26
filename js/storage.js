// 저장 기능: 로그인/인증 없이 브라우저 localStorage만 사용.
// - bestChallengeStage: 도전 모드에서 도달한 최고 단계(이어하기 시작점으로도 사용)
// - history: 최근 플레이 기록(최대 20개). 개인정보/비밀값은 저장하지 않음.
// - settings: 음소거/움직임 줄이기 등 효과 설정
// - appearance: 캐릭터 외형(프리셋 색상 또는 직접 그린 픽셀 그림)
const STORAGE_KEY = "dodge_save_v1";
const SKIN_GRID_SIZE = 8;

function defaultSave(){
  return {
    version: 1, bestChallengeStage: 0, history: [],
    settings: { muted: false, reduceMotion: false },
    appearance: { type: "preset", presetId: "cyan", pixels: null }
  };
}

function isValidHistoryEntry(e){
  return e && typeof e === "object"
    && typeof e.difficultyName === "string"
    && typeof e.mode === "string"
    && typeof e.cleared === "boolean"
    && Number.isFinite(e.score)
    && Number.isFinite(e.time);
}

function isValidPixelCell(c){
  return c === null || (typeof c === "string" && /^#[0-9a-fA-F]{3,8}$/.test(c));
}

function sanitizeAppearance(a){
  const fallback = { type: "preset", presetId: "cyan", pixels: null };
  if(!a || typeof a !== "object") return fallback;

  if(a.type === "custom"){
    const total = SKIN_GRID_SIZE * SKIN_GRID_SIZE;
    if(Array.isArray(a.pixels) && a.pixels.length === total && a.pixels.every(isValidPixelCell)){
      return { type: "custom", presetId: "cyan", pixels: a.pixels.slice() };
    }
    return fallback; // 손상된 픽셀 데이터 -> 기본값
  }

  const presetId = typeof a.presetId === "string" ? a.presetId : "cyan";
  return { type: "preset", presetId, pixels: null };
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
      const settings = {
        muted: !!(data.settings && data.settings.muted),
        reduceMotion: !!(data.settings && data.settings.reduceMotion)
      };
      const appearance = sanitizeAppearance(data.appearance);

      return { version: 1, bestChallengeStage, history, settings, appearance };
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

  // 한 판이 끝나거나(사망) 도전 모드 중간에 나갈 때 호출.
  // stage는 "그 시점에 도전 중이던 단계"(이어하기 시작점) 기준으로 저장한다.
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
  },

  saveSettings(settings){
    const data = this.load();
    data.settings = { muted: !!settings.muted, reduceMotion: !!settings.reduceMotion };
    this.save(data);
    return data;
  },

  saveAppearance(appearance){
    const data = this.load();
    data.appearance = sanitizeAppearance(appearance);
    this.save(data);
    return data;
  }
};
