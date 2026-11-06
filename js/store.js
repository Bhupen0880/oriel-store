const CART_KEY = "oriel.cart.v1";
const LETTER_KEY = "oriel.letter.v1";
const ORDER_KEY = "oriel.order.v1";
const MAX = 8;
const FREE_AT = 150;
const FLAT_SHIP = 12;

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const scrollBehavior = reduceMotion ? "auto" : "smooth";

const articles = [...document.querySelectorAll("[data-product]")];
const products = articles.map((article) => {
  const img = article.querySelector("img");
  const alt = img.alt;
  img.alt = "";
  return {
    id: article.dataset.product,
    name: article.dataset.name,
    price: Number(article.dataset.price),
    category: article.dataset.category,
    catlabel: article.dataset.catlabel,
    image: img.getAttribute("src"),
    alt,
    benefit: article.querySelector(".benefit").textContent.trim(),
    more: article.querySelector(".more").innerHTML,
    article,
  };
});
const byId = new Map(products.map((p) => [p.id, p]));

const known = new Set(["all", "light", "sleep", "heat", "cold", "recovery", "wear"]);
let activeFilter = "all";
let cart = loadCart();
let activeId = null;
let qty = 1;
let closingProduct = false;
let toastTimer = 0;

const shop = document.getElementById("shop");
const checkout = document.getElementById("checkout");
const checkoutInner = document.getElementById("checkout-inner");
const productDialog = document.getElementById("product-dialog");
const cartDialog = document.getElementById("cart-dialog");
const cartBody = document.getElementById("cart-body");
const cartFoot = document.getElementById("cart-foot");
const bagCount = document.getElementById("bag-count");
const openCartBtn = document.getElementById("open-cart");
const filters = document.querySelector(".filters");
const resultCount = document.getElementById("result-count");
const toastEl = document.getElementById("toast");
const header = document.querySelector(".site-header");

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((row) => row && byId.has(row.id) && Number.isInteger(row.qty))
      .map((row) => ({ id: row.id, qty: Math.min(MAX, Math.max(1, row.qty)) }));
  } catch {
    return [];
  }
}

function persistCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* private mode or a full disk — the bag still works for this visit */
  }
}

function money(n) {
  return usd.format(n);
}

function lineCount() {
  return cart.reduce((sum, row) => sum + row.qty, 0);
}

function totalsOf(items) {
  const sub = items.reduce((sum, row) => {
    const product = byId.get(row.id);
    return product ? sum + product.price * row.qty : sum;
  }, 0);
  const ship = sub === 0 || sub >= FREE_AT ? 0 : FLAT_SHIP;
  return { sub, ship, total: sub + ship };
}

function updateBagCount() {
  const count = lineCount();
  bagCount.textContent = String(count);
  bagCount.classList.remove("bump");
  void bagCount.offsetWidth;
  bagCount.classList.add("bump");
  openCartBtn.setAttribute(
    "aria-label",
    count === 0 ? "Open bag, empty" : `Open bag, ${count} ${count === 1 ? "item" : "items"}`,
  );
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove("show"), 2600);
}

function setFilter(cat) {
  if (!known.has(cat)) cat = "all";
  activeFilter = cat;
  let shown = 0;
  products.forEach((product) => {
    const on = cat === "all" || product.category === cat;
    product.article.hidden = !on;
    if (on) shown += 1;
  });
  filters.querySelectorAll("[data-filter]").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.filter === cat ? "true" : "false");
  });
  const label = filters.querySelector(`[data-filter="${cat}"] .fname`)?.textContent || "All";
  resultCount.textContent = cat === "all" ? "Twelve objects" : `${shown} in ${label}`;
}

function relatedTo(product) {
  const same = products.filter((item) => item.category === product.category && item.id !== product.id);
  const rest = products.filter((item) => item.category !== product.category);
  return [...same, ...rest].slice(0, 2);
}

function fillProduct(product) {
  activeId = product.id;
  qty = 1;
  const image = document.getElementById("product-image");
  image.src = product.image;
  image.alt = product.alt;
  document.getElementById("product-cat").textContent = product.catlabel;
  document.getElementById("product-title").textContent = product.name;
  document.getElementById("product-price").textContent = money(product.price);
  document.getElementById("product-benefit").textContent = product.benefit;
  document.getElementById("product-more").innerHTML = product.more;
  document.getElementById("qty-val").textContent = "1";
  syncQtyButtons();
  const inBag = cart.find((row) => row.id === product.id);
  const fine = document.getElementById("product-fine");
  fine.textContent = inBag
    ? `${inBag.qty} already in the bag. Eight is the most of any one object.`
    : "Eight is the most of any one object. Shipping is free over $150.";

  const related = document.getElementById("product-related");
  related.replaceChildren();
  relatedTo(product).forEach((item) => {
    const link = document.createElement("a");
    link.href = `#product/${item.id}`;
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = "";
    img.width = 52;
    img.height = 68;
    const text = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = item.name;
    const price = document.createElement("span");
    price.textContent = money(item.price);
    text.append(name, price);
    link.append(img, text);
    related.append(link);
  });
}

function syncQtyButtons() {
  document.getElementById("qty-dec").disabled = qty <= 1;
  document.getElementById("qty-inc").disabled = qty >= MAX;
  document.getElementById("qty-val").textContent = String(qty);
}

function openProduct(id) {
  const product = byId.get(id);
  if (!product) return false;
  fillProduct(product);
  if (!productDialog.open) productDialog.showModal();
  return true;
}

function closeProduct() {
  if (!productDialog.open) return;
  closingProduct = true;
  productDialog.close();
  closingProduct = false;
}

function renderCart() {
  cartBody.replaceChildren();
  if (cart.length === 0) {
    cartFoot.hidden = true;
    const empty = document.createElement("div");
    empty.className = "cart-empty";
    const p = document.createElement("p");
    p.textContent = "Your bag is empty.";
    const link = document.createElement("a");
    link.href = "#edit";
    link.textContent = "Browse the edit";
    link.addEventListener("click", () => {
      if (cartDialog.open) cartDialog.close();
    });
    empty.append(p, link);
    cartBody.append(empty);
    return;
  }

  cartFoot.hidden = false;
  cart.forEach((row) => {
    const product = byId.get(row.id);
    const item = document.createElement("article");
    item.className = "cart-row";

    const img = document.createElement("img");
    img.src = product.image;
    img.alt = "";
    img.width = 64;
    img.height = 84;

    const copy = document.createElement("div");
    const name = document.createElement("p");
    name.className = "line-name";
    name.textContent = product.name;
    const meta = document.createElement("p");
    meta.className = "line-meta";
    meta.textContent = money(product.price);

    const actions = document.createElement("div");
    actions.className = "row-actions";
    const qtyGroup = document.createElement("div");
    qtyGroup.className = "qty";
    qtyGroup.setAttribute("role", "group");
    qtyGroup.setAttribute("aria-label", `Quantity for ${product.name}`);

    const dec = document.createElement("button");
    dec.type = "button";
    dec.dataset.act = "dec";
    dec.dataset.id = product.id;
    dec.setAttribute("aria-label", `Decrease quantity of ${product.name}`);
    dec.textContent = "−";
    dec.disabled = row.qty <= 1;

    const val = document.createElement("span");
    val.textContent = String(row.qty);

    const inc = document.createElement("button");
    inc.type = "button";
    inc.dataset.act = "inc";
    inc.dataset.id = product.id;
    inc.setAttribute("aria-label", `Increase quantity of ${product.name}`);
    inc.textContent = "+";
    inc.disabled = row.qty >= MAX;

    qtyGroup.append(dec, val, inc);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.dataset.act = "remove";
    remove.dataset.id = product.id;
    remove.textContent = "Remove";

    const line = document.createElement("p");
    line.className = "line-meta";
    line.textContent = money(product.price * row.qty);

    actions.append(qtyGroup, remove);
    copy.append(name, meta, actions, line);
    item.append(img, copy);
    cartBody.append(item);
  });

  const totals = totalsOf(cart);
  const box = document.getElementById("cart-totals");
  box.replaceChildren();
  [
    ["Subtotal", money(totals.sub)],
    ["Shipping", totals.ship === 0 ? "Free" : money(totals.ship)],
    ["Total", money(totals.total)],
  ].forEach(([label, value], index) => {
    const row = document.createElement("div");
    if (index === 2) row.className = "grand";
    const a = document.createElement("span");
    a.textContent = label;
    const b = document.createElement("span");
    b.textContent = value;
    row.append(a, b);
    box.append(row);
  });

  const note = document.getElementById("ship-note");
  if (totals.sub >= FREE_AT) note.textContent = "Shipping is on us.";
  else note.textContent = `Add ${money(FREE_AT - totals.sub)} for complimentary shipping.`;
}

function addToCart(id, amount) {
  const product = byId.get(id);
  if (!product) return;
  const row = cart.find((item) => item.id === id);
  const have = row ? row.qty : 0;
  const room = MAX - have;
  if (room <= 0) {
    toast(`You already have ${MAX} of ${product.name}.`);
    return;
  }
  const add = Math.min(amount, room);
  if (row) row.qty += add;
  else cart.push({ id, qty: add });
  persistCart();
  updateBagCount();
  if (cartDialog.open) renderCart();
  if (productDialog.open && activeId === id) {
    document.getElementById("product-fine").textContent =
      `${(row ? row.qty : add)} in the bag. Eight is the most of any one object.`;
  }
  toast(add < amount ? `Added ${add}. The bag holds ${MAX} of each.` : `Added ${product.name}.`);
}

function placeOrder() {
  const order = {
    code: `OR-${Math.floor(1000 + Math.random() * 9000)}`,
    items: cart.map((row) => ({ id: row.id, qty: row.qty })),
    created: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    toast("Checkout couldn’t open in this browser.");
    return false;
  }
  cart = [];
  persistCart();
  updateBagCount();
  return true;
}

function renderTotals(target, totals) {
  [
    ["Subtotal", money(totals.sub)],
    ["Shipping", totals.ship === 0 ? "Free" : money(totals.ship)],
    ["Total", money(totals.total)],
  ].forEach(([label, value], index) => {
    const row = document.createElement("div");
    if (index === 2) row.className = "grand";
    const a = document.createElement("span");
    a.textContent = label;
    const b = document.createElement("span");
    b.textContent = value;
    row.append(a, b);
    target.append(row);
  });
}

function renderEmptyCheckout() {
  checkoutInner.replaceChildren();
  const kicker = document.createElement("p");
  kicker.className = "kicker";
  kicker.textContent = "Checkout";
  const title = document.createElement("h2");
  title.id = "checkout-heading";
  title.textContent = "Your bag is empty.";
  const copy = document.createElement("p");
  copy.className = "dek";
  copy.textContent = "Add an object from the edit, then come back. This demo never asks for a card.";
  const link = document.createElement("a");
  link.className = "btn";
  link.href = "#edit";
  link.textContent = "Back to the edit";
  checkoutInner.append(kicker, title, copy, link);
}

function renderOrder(order) {
  const items = (order.items || []).filter((row) => byId.has(row.id) && row.qty > 0);
  if (!items.length) {
    renderEmptyCheckout();
    return;
  }
  checkoutInner.replaceChildren();
  const kicker = document.createElement("p");
  kicker.className = "kicker";
  kicker.textContent = `Order ${order.code}`;
  const title = document.createElement("h2");
  title.id = "checkout-heading";
  title.textContent = "Noted. Nothing was charged.";
  const copy = document.createElement("p");
  copy.className = "dek";
  copy.textContent =
    "This is a demo store. Nothing will ship, and no payment was taken. The list below is what a live checkout would have sent.";
  const when = document.createElement("p");
  when.className = "fine";
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(order.created));
  when.textContent = date;

  const list = document.createElement("ul");
  list.className = "order-list";
  items.forEach((row) => {
    const product = byId.get(row.id);
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.src = product.image;
    img.alt = "";
    const text = document.createElement("div");
    const name = document.createElement("p");
    name.className = "line-name";
    name.textContent = product.name;
    const meta = document.createElement("p");
    meta.className = "line-meta";
    meta.textContent = `${row.qty} × ${money(product.price)}`;
    text.append(name, meta);
    const line = document.createElement("p");
    line.textContent = money(product.price * row.qty);
    li.append(img, text, line);
    list.append(li);
  });

  const totals = document.createElement("div");
  totals.className = "totals";
  renderTotals(totals, totalsOf(items));

  const back = document.createElement("a");
  back.className = "btn";
  back.href = "#edit";
  back.textContent = "Back to the edit";

  checkoutInner.append(kicker, title, copy, when, list, totals, back);
}

function showCheckout() {
  toastEl.classList.remove("show");
  shop.hidden = true;
  checkout.hidden = false;
  let order = null;
  try {
    order = JSON.parse(sessionStorage.getItem(ORDER_KEY) || "null");
  } catch {
    order = null;
  }
  if (!order) renderEmptyCheckout();
  else renderOrder(order);
  window.scrollTo({ top: 0, behavior: scrollBehavior });
}

function hideCheckout() {
  checkout.hidden = true;
  shop.hidden = false;
}

function parseRoute() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (!raw || raw === "top") return { name: "home" };
  if (raw === "checkout") return { name: "checkout" };
  if (raw === "edit") return { name: "edit", cat: "all" };
  if (raw.startsWith("edit/")) return { name: "edit", cat: raw.split("/")[1] || "all" };
  if (raw.startsWith("product/")) return { name: "product", id: raw.split("/")[1] || "" };
  if (raw === "ritual" || raw === "care" || raw === "letter") return { name: "section", id: raw };
  return { name: "home" };
}

let booted = false;
function applyRoute() {
  const route = parseRoute();
  if (route.name === "checkout") {
    closeProduct();
    if (cartDialog.open) cartDialog.close();
    showCheckout();
    booted = true;
    return;
  }
  hideCheckout();
  if (route.name === "product") {
    if (!openProduct(route.id)) {
      history.replaceState(null, "", "#edit");
      setFilter("all");
    }
    booted = true;
    return;
  }
  closeProduct();
  if (route.name === "edit") {
    setFilter(route.cat);
    if (!booted) document.getElementById("edit").scrollIntoView();
  }
  booted = true;
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  const cat = button.dataset.filter;
  setFilter(cat);
  const hash = cat === "all" ? "#edit" : `#edit/${cat}`;
  history.replaceState(null, "", hash);
});

document.querySelector(".products").addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  addToCart(button.dataset.add, 1);
});

document.getElementById("qty-dec").addEventListener("click", () => {
  qty = Math.max(1, qty - 1);
  syncQtyButtons();
});
document.getElementById("qty-inc").addEventListener("click", () => {
  qty = Math.min(MAX, qty + 1);
  syncQtyButtons();
});
document.getElementById("product-add").addEventListener("click", () => {
  if (activeId) addToCart(activeId, qty);
});

productDialog.addEventListener("click", (event) => {
  if (event.target === productDialog) productDialog.close();
});
productDialog.addEventListener("close", () => {
  if (closingProduct) return;
  if (location.hash.startsWith("#product/")) {
    const next = activeFilter === "all" ? "#edit" : `#edit/${activeFilter}`;
    history.replaceState(null, "", next);
  }
});
document.querySelector("[data-close='product']").addEventListener("click", () => {
  productDialog.close();
});

openCartBtn.addEventListener("click", () => {
  renderCart();
  cartDialog.showModal();
});
cartDialog.addEventListener("click", (event) => {
  if (event.target === cartDialog) cartDialog.close();
});
document.querySelector("[data-close='cart']").addEventListener("click", () => cartDialog.close());

cartBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-act]");
  if (!button) return;
  const row = cart.find((item) => item.id === button.dataset.id);
  if (!row) return;
  if (button.dataset.act === "inc") row.qty = Math.min(MAX, row.qty + 1);
  if (button.dataset.act === "dec") row.qty = Math.max(1, row.qty - 1);
  if (button.dataset.act === "remove") cart = cart.filter((item) => item.id !== row.id);
  persistCart();
  updateBagCount();
  renderCart();
});

document.getElementById("checkout-btn").addEventListener("click", () => {
  if (!cart.length) return;
  if (!placeOrder()) return;
  if (cartDialog.open) cartDialog.close();
  location.hash = "checkout";
});

document.querySelector(".brand").addEventListener("click", () => {
  if (location.hash === "#top" || location.hash === "") {
    hideCheckout();
    closeProduct();
    window.scrollTo({ top: 0, behavior: scrollBehavior });
  }
});

const letterForm = document.getElementById("letter-form");
const letterSuccess = document.getElementById("letter-success");
const letterError = document.getElementById("letter-error");
const emailInput = document.getElementById("email");

function showJoined() {
  letterForm.hidden = true;
  letterSuccess.hidden = false;
}

try {
  if (localStorage.getItem(LETTER_KEY)) showJoined();
} catch {
  /* ignore */
}

letterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = emailInput.value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!valid) {
    letterError.textContent = "Enter an email address like name@domain.com.";
    emailInput.setAttribute("aria-invalid", "true");
    emailInput.focus();
    return;
  }
  letterError.textContent = "";
  emailInput.removeAttribute("aria-invalid");
  try {
    localStorage.setItem(LETTER_KEY, JSON.stringify({ email, at: Date.now() }));
  } catch {
    /* still show success — nothing is sent to a server */
  }
  showJoined();
});

function onScroll() {
  header.classList.toggle("scrolled", window.scrollY > 8);
}
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("hashchange", applyRoute);

updateBagCount();
setFilter("all");
applyRoute();
