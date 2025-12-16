export const PROMOS = {
  SALE10: { type: "percent", value: 10 },
  BONUS50: { type: "fixed", value: 50 }
};

export function addToCart(cart, productId) {
  const item = cart.items.find(i => i.id === productId);
  if (item) item.qty += 1;
  else cart.items.push({ id: productId, qty: 1 });
}

export function changeQty(cart, productId, delta) {
  const item = cart.items.find(i => i.id === productId);
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    cart.items = cart.items.filter(i => i.id !== productId);
  }
}

export function clearCart(cart) {
  cart.items = [];
  cart.promo = null;
}

export function applyPromo(cart, code) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) {
    cart.promo = null;
    return { ok: true };
  }
  if (!PROMOS[c]) return { ok: false, error: "Неизвестный промокод" };
  cart.promo = c;
  return { ok: true };
}

export function calcTotals(cart, products) {
  let sum = 0;

  for (const it of cart.items) {
    const p = products.find(x => x.id === it.id);
    if (p) sum += p.price * it.qty;
  }

  let discount = 0;
  if (cart.promo) {
    const promo = PROMOS[cart.promo];
    if (promo?.type === "percent") discount = sum * (promo.value / 100);
    if (promo?.type === "fixed") discount = promo.value;
  }

  discount = Math.min(discount, sum);
  const total = Math.max(0, sum - discount);

  return { sum, discount, total };
}
