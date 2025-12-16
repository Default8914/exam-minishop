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

export function renderGrid(gridEl, products, onAdd, onOpenProduct) {
  gridEl.innerHTML = "";
  for (const p of products) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card__top">
        <button class="link-title" type="button" data-open>${p.title}</button>
        <span class="tag">${p.category}</span>
      </div>
      <p class="muted">Теги: ${p.tags.join(", ")}</p>
      <div class="card__bottom">
        <div>
          <div class="price">${money(p.price)}</div>
          <div class="muted">★ ${p.rating}</div>
        </div>
        <button class="btn btn-small" type="button" data-add>В корзину</button>
      </div>
    `;
    card.querySelector("[data-add]").addEventListener("click", () => onAdd(p.id));
    card.querySelector("[data-open]").addEventListener("click", () => onOpenProduct(p.id));
    gridEl.appendChild(card);
  }
}

export function viewCatalog({ products, filters, onAdd, onOpenProduct, onBindFilters }) {
  const section = document.createElement("section");

  section.innerHTML = `
    <section class="panel">
      <div class="panel__row">
        <label class="field">
          <span class="field__label">Поиск</span>
          <input id="search" class="input" type="search" placeholder="Например: наушники..." />
        </label>

        <label class="field">
          <span class="field__label">Категория</span>
          <select id="category" class="input">
            <option value="all">Все</option>
          </select>
        </label>

        <label class="field">
          <span class="field__label">Сортировка</span>
          <select id="sort" class="input">
            <option value="popular">Популярные</option>
            <option value="price-asc">Цена ↑</option>
            <option value="price-desc">Цена ↓</option>
            <option value="rating-desc">Рейтинг ↓</option>
          </select>
        </label>
      </div>

      <div class="panel__row panel__row--2">
        <label class="field">
          <span class="field__label">Цена (до)</span>
          <input id="maxPrice" class="input" type="range" min="0" max="200" value="200" />
          <span class="muted" id="maxPriceLabel"></span>
        </label>

        <button class="btn btn-ghost" id="resetFilters" type="button">Сбросить фильтры</button>
      </div>
    </section>

    <section class="meta">
      <p class="muted">Найдено товаров: <strong id="foundCount">0</strong></p>
    </section>

    <section class="grid" id="grid" aria-label="Каталог товаров"></section>
  `;

  const search = section.querySelector("#search");
  const category = section.querySelector("#category");
  const sort = section.querySelector("#sort");
  const maxPrice = section.querySelector("#maxPrice");
  const maxPriceLabel = section.querySelector("#maxPriceLabel");
  const reset = section.querySelector("#resetFilters");
  const grid = section.querySelector("#grid");
  const found = section.querySelector("#foundCount");

  renderCategories(category, products);

  search.value = filters.q;
  category.value = filters.category;
  sort.value = filters.sort;
  maxPrice.value = String(filters.maxPrice);
  maxPriceLabel.textContent = `до ${filters.maxPrice} ₽`;

  renderGrid(grid, products, onAdd, onOpenProduct);
  found.textContent = String(products.length);

  onBindFilters({ search, category, sort, maxPrice, reset, maxPriceLabel, found, grid });

  return section;
}

export function viewProduct({ product, onAdd, onBack }) {
  const section = document.createElement("section");
  section.className = "page";

  section.innerHTML = `
    <div class="page-head">
      <button class="btn btn-ghost" type="button" data-back>← Назад</button>
      <span class="tag">${product.category}</span>
    </div>

    <div class="product">
      <div class="product__img" aria-hidden="true">🛍️</div>
      <div class="product__info">
        <h2 class="product__title">${product.title}</h2>
        <p class="muted">${product.desc || "Описание отсутствует."}</p>
        <p class="muted">Теги: ${product.tags.join(", ")}</p>

        <div class="product__buy">
          <div>
            <div class="price price--big">${money(product.price)}</div>
            <div class="muted">★ ${product.rating}</div>
          </div>
          <button class="btn" type="button" data-add>Добавить в корзину</button>
        </div>
      </div>
    </div>
  `;

  section.querySelector("[data-back]").addEventListener("click", onBack);
  section.querySelector("[data-add]").addEventListener("click", () => onAdd(product.id));

  return section;
}

export function viewOrders({ orders }) {
  const section = document.createElement("section");
  section.className = "page";

  section.innerHTML = `
    <div class="page-head">
      <h2>История заказов</h2>
      <p class="muted">Заказы сохраняются в localStorage (демо).</p>
    </div>
    <div class="orders" id="orders"></div>
  `;

  const wrap = section.querySelector("#orders");

  if (!orders.length) {
    wrap.innerHTML = `<p class="muted">Пока нет заказов. Оформи заказ в корзине 🙂</p>`;
    return section;
  }

  wrap.innerHTML = "";
  for (const o of orders.slice().reverse()) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card__top">
        <h3 class="card__title">Заказ #${o.id}</h3>
        <span class="tag">${new Date(o.createdAt).toLocaleString()}</span>
      </div>
      <p class="muted">Покупатель: ${o.customer.name} • ${o.customer.phone}</p>
      <p class="muted">Адрес: ${o.customer.address}</p>
      <div class="summary">
        <div class="summary__row"><span>Итого</span><strong>${money(o.total)}</strong></div>
      </div>
    `;
    wrap.appendChild(card);
  }

  return section;
}

export function renderCart(listEl, cart, products, onInc, onDec, onDel) {
  if (cart.items.length === 0) {
    listEl.innerHTML = `<p class="muted">Корзина пуста. Добавь товары из каталога 🙂</p>`;
    return;
  }

  listEl.innerHTML = "";
  for (const it of cart.items) {
    const p = products.find((x) => x.id === it.id);
    if (!p) continue;

    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div>
        <div class="cart-title">${p.title}</div>
        <div class="muted">${money(p.price)} • ${p.category}</div>
      </div>

      <div class="cart-controls">
        <button class="icon-btn" data-dec type="button">−</button>
        <span class="qty">${it.qty}</span>
        <button class="icon-btn" data-inc type="button">+</button>
        <button class="icon-btn" data-del type="button">✕</button>
      </div>
    `;

    row.querySelector("[data-inc]").addEventListener("click", () => onInc(p.id));
    row.querySelector("[data-dec]").addEventListener("click", () => onDec(p.id));
    row.querySelector("[data-del]").addEventListener("click", () => onDel(p.id));

    listEl.appendChild(row);
  }
}