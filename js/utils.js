export function money(n) {
  return `${Number(n).toFixed(0)} ₽`;
}

export function debounce(fn, ms = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}