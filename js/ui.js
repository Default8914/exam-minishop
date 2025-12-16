import { money } from "./utils.js";

export function renderCategories(selectEl, products) {
  const cats = Array.from(new Set(products.map((p) => p.category))).sort();
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    selectEl.appendChild(opt);
  }
}

function safeImgHTML(src, alt) {
  const safeSrc = src || "";
  const safeAlt = alt || "Товар";
  // если картинка не загрузится — покажем аккуратную заглушку
  return `
    <img class="card__img"
         src="${safeSrc}"
         alt="${safeAlt}"
         loading="lazy"
         onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,${encodeURIComponent(
           `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
              <rect width="100%" height="100%" fill="rgba(255,255,255,0.06)"/>
              <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                    fill="rgba(255,255,255,0.6)" font-family="Arial" font-size="28">
                No image
             
