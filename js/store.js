const KEY = "minishop_state_v2";

export function loadState(){
  try { return JSON.parse(localStorage.getItem(KEY)) || null; }
  catch { return null; }
}

export function saveState(state){
  localStorage.setItem(KEY, JSON.stringify(state));
}
