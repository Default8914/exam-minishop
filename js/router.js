export function parseRoute() {
  const hash = location.hash || "#/";
  const parts = hash.replace(/^#\//, "").split("/").filter(Boolean);

  if (parts.length === 0) return { name: "catalog" };
  if (parts[0] === "product" && parts[1]) return { name: "product", id: parts[1] };
  if (parts[0] === "orders") return { name: "orders" };

  return { name: "catalog" };
}