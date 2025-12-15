export async function loadProducts(){
  const res = await fetch("./assets/products.json");
  if(!res.ok) throw new Error("Не удалось загрузить товары");
  return await res.json();
}
