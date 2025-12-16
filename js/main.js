import { loadProducts } from "./products.js";
import { loadState, saveState } from "./store.js";
import { debounce, clamp, money } from "./utils.js";
import { parseRoute } from "./router.js";
import { addToCart, changeQty, clearCart, applyPromo, calcTotals } from "./cart.js";
import { viewCatalog, viewProduct, viewOrders, renderGrid, renderCart } from "./ui.js";

const els = {
  view: document.getElementById("view"),

  openCart: document.getElementById("openCart"),
  cartModal: document.getElementById("cartModal"),
  cartList: document.getElementById("cartList"),
  cartCount: document.getElementById("cartCount"),
  sum: document.getElementById("sum"),
  discount: document.getElementById("discount"),
  total: document.getElementById("total"),

  promoInput: document.getElementById("promoInput"),
  applyPromoBtn: document.getElementById("applyPromo"),
  promoError: document.getElementById("promoError"),

  clearCartBtn: document.getElementById("clearCart"),
  checkoutBtn: document.getElementById("checkout"),

  checkoutModal: document.getElementById("checkoutModal"),
  orderForm: document.getElementById("orderForm"),
  orderHint: document.getElementById("orderHint"),
};

let products = [];

let state = {
  filters: { q: "", category: "all", sort: "popular", maxPrice: 200 },
  cart: { items: [], promo: null },
  orders: []
};

function persist() { saveState(state); }

function openModal(modal) { modal.hidden = false; document.body.classList.add("no-scroll"); }
function closeModal(modal) { modal.hidden = true; document.body.classList.remove("no-scroll"); }

function syncCartUI() {
  const count = state.cart.items.reduce((s, i) => s + i.qty, 0);
  els.cartCount.textContent = String(count);

  renderCart(
    els.cartList,
    state.cart,
    products,
    (id) => { changeQty(state.cart, id, +1); persist(); renderRoute(); },
    (id) => { changeQty(state.cart, id, -1); persist(); renderRoute(); },
    (id) => { changeQty(state.cart, id, -999); persist(); renderRoute(); }
  );

  const { sum, discount, total } = calcTotals(state.cart, products);
  els.sum.textContent = money(sum);
  els.discount.textContent = `− ${money(discount)}`;
  els.total.textContent = money(total);

  els.promoInput.value = state.cart.promo ?? "";
}

function applyFilters(list) {
  const { q, category, maxPrice, sort } = state.filters;

  let res = list.filter(p => p.price <= maxPrice);

  if (category !== "all") res = res.filter(p => p.category === category);

  const qq = q.trim().toLowerCase();
  if (qq) {
    res = res.filter(p =>
      p.title.toLowerCase().includes(qq) ||
      p.tags.join(" ").toLowerCase().includes(qq)
    );
  }

  if (sort === "price-asc") res.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") res.sort((a, b) => b.price - a.price);
  if (sort === "rating-desc") res.sort((a, b) => b.rating - a.rating);

  return res;
}

function hydrateFromStorage() {
  const saved = loadState();
  if (saved?.filters) state.filters = { ...state.filters, ...saved.filters };
  if (saved?.cart) state.cart = { ...state.cart, ...saved.cart };
  if (saved?.orders) state.orders = saved.orders;

  state.filters.maxPrice = clamp(state.filters.maxPrice, 0, 200);
}

function bindModalsAndCart() {
  els.openCart.addEventListener("click", () => openModal(els.cartModal));

  els.cartModal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) closeModal(els.cartModal);
  });

  els.applyPromoBtn.addEventListener("click", () => {
    const res = applyPromo(state.cart, els.promoInput.value);
    els.promoError.textContent = res.ok ? "" : res.error;
    persist();
    renderRoute();
  });

  els.clearCartBtn.addEventListener("click", () => {
    clearCart(state.cart);
    els.promoError.textContent = "";
    persist();
    renderRoute();
  });

  els.checkoutBtn.addEventListener("click", () => {
    if (state.cart.items.length === 0) return;
    closeModal(els.cartModal);
    openModal(els.checkoutModal);
  });

  els.checkoutModal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close-checkout]")) closeModal(els.checkoutModal);
  });

  els.orderForm.addEventListener("submit", (e) => {
    e.preventDefault();
    els.orderHint.textContent = "";

    const fd = new FormData(els.orderForm);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const address = String(fd.get("address") || "").trim();

    const setErr = (k, msg) => {
      const el = document.querySelector(`[data-err="${k}"]`);
      if (el) el.textContent = msg || "";
    };
    setErr("name", ""); setErr("phone", ""); setErr("address", "");

    let ok = true;
    if (name.length < 2) { setErr("name", "Минимум 2 символа"); ok = false; }
    if (!/^\+?\d[\d\s()-]{8,}$/.test(phone)) { setErr("phone", "Некорректный телефон"); ok = false; }
    if (address.length < 6) { setErr("address", "Минимум 6 символов"); ok = false; }
    if (!ok) return;

    const totals = calcTotals(state.cart, products);

    state.orders.push({
      id: Date.now(),
      createdAt: Date.now(),
      customer: { name, phone, address },
      total: totals.total
    });

    els.orderHint.textContent = "Заказ оформлен ✅ (демо без сервера)";
    clearCart(state.cart);
    persist();
    syncCartUI();

    setTimeout(() => {
      closeModal(els.checkoutModal);
      els.orderForm.reset();
      els.orderHint.textContent = "";
      location.hash = "#/orders";
    }, 600);
  });
}

function renderRoute() {
  const route = parseRoute();
  els.view.innerHTML = "";
  syncCartUI();

  if (route.name === "catalog") {
    const filtered = applyFilters([...products]);

    const page = viewCatalog({
      products: filtered,
      filters: state.filters,
      onAdd: (id) => { addToCart(state.cart, id); persist(); renderRoute(); },
      onOpenProduct: (id) => { location.hash = `#/product/${id}`; },
      onBindFilters: ({ search, category, sort, maxPrice, reset, maxPriceLabel, found, grid }) => {
        const update = () => {
          const list = applyFilters([...products]);
          found.textContent = String(list.length);
          maxPriceLabel.textContent = `до ${state.filters.maxPrice} ₽`;

          renderGrid(
            grid,
            list,
            (id) => { addToCart(state.cart, id); persist(); renderRoute(); },
            (id) => { location.hash = `#/product/${id}`; }
          );
        };

        found.textContent = String(filtered.length);

        search.addEventListener("input", debounce(() => {
          state.filters.q = search.value;
          persist();
          update();
        }, 200));

        category.addEventListener("change", () => {
          state.filters.category = category.value;
          persist();
          update();
        });

        sort.addEventListener("change", () => {
          state.filters.sort = sort.value;
          persist();
          update();
        });

        maxPrice.addEventListener("input", () => {
          state.filters.maxPrice = Number(maxPrice.value);
          persist();
          update();
        });

        reset.addEventListener("click", () => {
          state.filters = { q: "", category: "all", sort: "popular", maxPrice: 200 };
          search.value = "";
          category.value = "all";
          sort.value = "popular";
          maxPrice.value = "200";
          persist();
          update();
        });
      }
    });

    els.view.appendChild(page);
    return;
  }

  if (route.name === "product") {
    const product = products.find(p => p.id === route.id);
    if (!product) {
      els.view.innerHTML = `<p class="error">Товар не найден</p>`;
      return;
    }

    const page = viewProduct({
      product,
      onAdd: (id) => {
        addToCart(state.cart, id);
        persist();
        syncCartUI();
        openModal(els.cartModal);
      },
      onBack: () => (location.hash = "#/")
    });

    els.view.appendChild(page);
    return;
  }

  if (route.name === "orders") {
    els.view.appendChild(viewOrders({ orders: state.orders }));
    return;
  }
}

async function init() {
  products = await loadProducts();
  hydrateFromStorage();
  bindModalsAndCart();

  window.addEventListener("hashchange", renderRoute);
  if (!location.hash) location.hash = "#/";
  renderRoute();
}

init().catch((err) => {
  els.view.innerHTML = `<p class="error">Ошибка: ${err.message}</p>`;
});