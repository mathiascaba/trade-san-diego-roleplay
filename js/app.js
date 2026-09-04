(() => {
  const IMG_EXTS = ["webp", "png", "jpg", "jpeg", "avif", "gif"];

  const state = {
    query: "",
    category: "all",   // all | civil | robux
    type: "all",
    rarity: "all",
    sort: "default",
  };

  const types = [...new Set(VEHICLES.map(v => v.type))].sort();
  const rarities = ["Común", "Raro", "Épico", "Legendario"];

  const els = {
    grid: document.getElementById("grid"),
    count: document.getElementById("count"),
    search: document.getElementById("search"),
    categoryBtns: document.querySelectorAll("[data-cat]"),
    typeSel: document.getElementById("typeSel"),
    raritySel: document.getElementById("raritySel"),
    sortSel: document.getElementById("sortSel"),
    empty: document.getElementById("empty"),
  };

  function loadImage(v, imgEl, phEl) {
    let idx = 0;
    function tryNext() {
      if (idx >= IMG_EXTS.length) {
        imgEl.style.display = "none";
        phEl.style.display = "flex";
        return;
      }
      const ext = IMG_EXTS[idx++];
      const url = `img/${v.slug}.${ext}`;
      const test = new Image();
      test.onload = () => {
        imgEl.src = url;
        imgEl.style.display = "block";
        phEl.style.display = "none";
      };
      test.onerror = tryNext;
      test.src = url;
    }
    tryNext();
  }

  function money(n) {
    if (n === 0) return "Gratis";
    return "$" + n.toLocaleString("en-US");
  }

  function render() {
    let list = VEHICLES.filter(v => {
      if (state.category !== "all" && v.category !== state.category) return false;
      if (state.type !== "all" && v.type !== state.type) return false;
      if (state.rarity !== "all" && v.rarity !== state.rarity) return false;
      if (state.query) {
        const q = state.query.toLowerCase();
        if (!v.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    if (state.sort === "gold-asc") list = [...list].sort((a, b) => a.gold - b.gold);
    else if (state.sort === "gold-desc") list = [...list].sort((a, b) => b.gold - a.gold);
    else if (state.sort === "speed") list = [...list].sort((a, b) => b.topSpeed - a.topSpeed);
    else if (state.sort === "accel")
      list = [...list].sort((a, b) => {
        const ga = parseFloat(a.accel); const gb = parseFloat(b.accel);
        if (isNaN(ga)) return 1; if (isNaN(gb)) return -1;
        return ga - gb;
      });

    els.count.textContent = list.length + " vehículos";

    els.grid.innerHTML = "";
    if (list.length === 0) {
      els.grid.innerHTML = `<div class="empty" id="empty">No se encontraron vehículos con esos filtros.</div>`;
      return;
    }

    const frag = document.createDocumentFragment();
    for (const v of list) {
      const isRobux = v.category === "robux";
      const buyLabel = isRobux ? `Compra: ${v.robux} Robux`
                      : v.priceCash === 0 ? (v.priceLabel || "Gratis")
                      : `Compra: ${money(v.priceCash)}`;
      const rarityColor = RARITY_COLORS[v.rarity] || "#9aa5b1";

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="thumb">
          <span class="rarity-tag" style="color:${rarityColor};border:1px solid ${rarityColor}">${v.rarity}</span>
          <span class="cat-tag ${isRobux ? "robux" : "civil"}">${isRobux ? "Robux" : "Civil"}</span>
          <img alt="${v.name}" style="display:none">
          <div class="ph" style="display:flex">
            <svg viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
            <span>Sin foto aún —<br>añade <b>img/${v.slug}.jpg</b></span>
          </div>
        </div>
        <div class="body">
          <div>
            <div class="name">${v.name}</div>
            <div class="type">${v.type} · ${v.topSpeed} mph</div>
          </div>
          <div class="gold-price">
            <span class="gicon">🪙</span>
            <span class="label">Precio trading</span>
            <span class="value">${v.gold.toLocaleString("en-US")}</span>
          </div>
          <div class="stats">
            <div class="stat-box"><div class="k">Vel. máx</div><div class="v">${v.topSpeed} mph</div></div>
            <div class="stat-box"><div class="k">0–60</div><div class="v">${v.accel}</div></div>
          </div>
          <div class="buy-price">${buyLabel}</div>
        </div>`;

      loadImage(v, card.querySelector("img"), card.querySelector(".ph"));
      frag.appendChild(card);
    }
    els.grid.appendChild(frag);
  }

  // Eventos
  els.search.addEventListener("input", e => { state.query = e.target.value.trim(); render(); });

  els.categoryBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      els.categoryBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.category = btn.dataset.cat;
      render();
    });
  });

  els.typeSel.addEventListener("change", e => { state.type = e.target.value; render(); });
  els.raritySel.addEventListener("change", e => { state.rarity = e.target.value; render(); });
  els.sortSel.addEventListener("change", e => { state.sort = e.target.value; render(); });

  // Llenar selects
  els.typeSel.innerHTML = '<option value="all">Todos los tipos</option>' +
    types.map(t => `<option value="${t}">${t}</option>`).join("");
  els.raritySel.innerHTML = '<option value="all">Todas las rarezas</option>' +
    rarities.map(r => `<option value="${r}">${r}</option>`).join("");

  render();
})();
