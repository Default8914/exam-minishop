export function parseRoute() {
  const hash = location.hash || "#/";
  const parts = hash.replace(/^#\//, "").split("/").filter(Boolean);

  // #/ -> catalog
  if (parts.length === 0) return { name: "catalog" };

  // #/product/p1
  if (parts[0] === "product" && parts[1]) return { name: "product", id: parts[1] };

  // #/orders
  if (parts[0] === "orders") return { name: "orders" };

  return { name: "catalog" };
}
