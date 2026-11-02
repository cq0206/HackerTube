export const ID = /^[A-Za-z0-9_-]{11}$/;
export const freshState = () => ({version: 1, liked: [], later: [], hidden: [], history: [], frames: true, hideSeen: true, theme: 'dark'});
export function validateState(raw) {
  if (!raw || raw.version !== 1) throw new Error('备份版本不支持');
  const out = freshState();
  for (const key of ['liked','later','hidden','history']) {
    if (!Array.isArray(raw[key]) || raw[key].length > 10000 || raw[key].some(x => typeof x !== 'string' || !ID.test(x))) throw new Error('备份中的视频 ID 无效');
    out[key] = [...new Set(raw[key])];
  }
  for (const key of ['frames','hideSeen']) if (typeof raw[key] === 'boolean') out[key] = raw[key];
  if (['light','dark'].includes(raw.theme)) out.theme = raw.theme;
  return out;
}
export function hash(s) { let h=2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h,16777619); } return (h >>> 0) / 4294967296; }
export function prepare(docs) {
  return docs.map(d => ({...d, search: [d.title,d.channel,d.summary,d.why_hn,d.primary_topic,...d.tags,...d.categories.map(c=>c.name)].join(' ').toLowerCase()}));
}
export function selectVideos(docs, state, options = {}) {
  const {page='discover',area='',query='',sort='mix',type='',seed='today',longIds=null}=options;
  const sets = Object.fromEntries(['liked','later','hidden','history'].map(k=>[k,new Set(state[k])]));
  const profile = new Map();
  for (const d of docs) if (sets.liked.has(d.vid)) for (const c of d.categories) profile.set(c.id,(profile.get(c.id)||0)+1);
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const library = ['liked','later','history','hidden'].includes(page);
  const rows=docs.filter(d=> {
    if (library && !sets[page].has(d.vid)) return false;
    if (!library && (sets.hidden.has(d.vid) || (state.hideSeen && sets.history.has(d.vid)))) return false;
    if (!library && (!(d.hn.recommenders > 0) || d.shelf_life === 'news')) return false;
    if (page==='longs' && !longIds?.has(d.vid)) return false;
    return (!area || d.categories.some(c=>c.area===area)) && (!type || d.content_type===type) && terms.every(t=>d.search.includes(t));
  });
  function rank(d) {
    if (sort==='hn' || page==='classics') return d.score;
    if (sort==='recent') return d.hn.last_year || 0;
    const affinity=Math.min(3,d.categories.reduce((n,c)=>n+(profile.get(c.id)||0),0));
    return Math.log1p(d.score)*0.7 + affinity*.35 + hash(seed+d.vid)*2.8;
  }
  rows.sort((a,b)=> {
    if (library && sort==='mix') return state[page].indexOf(b.vid)-state[page].indexOf(a.vid);
    return rank(b)-rank(a) || b.score-a.score || a.vid.localeCompare(b.vid);
  });
  return rows;
}
export function duration(s) {
  if (!Number.isFinite(s) || s <= 0) return '';
  return s>=3600 ? `${Math.floor(s/3600)}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}` : `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}
