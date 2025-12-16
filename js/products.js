export async function loadProducts() {
  const res = await fetch("./assets/products.json");
  if (!res.ok) throw new Error("Не удалось загрузить товары (products.json)");
  return await res.json();
}