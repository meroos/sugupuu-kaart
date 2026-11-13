/* Perekonna teekonnad: Leafleti migratsioonikaart.
   Andmed: data/kohad.geojson, data/teekonnad.geojson, data/sundmused.geojson */
(function () {
  "use strict";

  const GRUPID = {
    weiss:  { nimi: "Weissi ja Maikowski liin", varv: "#f2b84b", k: 0.22 },
    veimre: { nimi: "Veimred ja Luhasalud",     varv: "#ff6f61", k: 0.26 },
    tulp:   { nimi: "Tulbid",                    varv: "#5ec8f2", k: 0.32 }
  };
  const KINDLUS = { toendatud: "tõendatud", osaliselt: "osaliselt tõendatud", oletus: "oletus" };
  const TAPSUS = { aadress: "täpne koht", asula: "asula", rajoon: "ainult piirkond", riik: "ainult riik" };
  const HALO_M = { rajoon: 45000, riik: 380000 };
  const HALO_ERAND = { keila: 9000 };
  const LUHINIMI = { kalisz: "Kalisz", saksamaa: "Saksamaa?", alavere: "Alavere", kiivera: "Kiivera",
                     maidla: "Maidla", kohila: "Kohila", tallinn: "Tallinn", tartu: "Tartu", agja: "Agja (Klooga)",
                     keila: "Keila vald", turinsk: "Turinsk (Sevurallag)", polevoje: "Polevoje",
                     sarala: "Sarala / Ordžonikidze", priiskovoje: "Priiskovõi", kuusiku: "Kuusiku" };
  const lyhi = id => LUHINIMI[id] || id;
  // Millisest suumist alates silt näha on
  const SILDI_SUUM = { tallinn: 2, polevoje: 2.5, turinsk: 2.5, kalisz: 2.5, saksamaa: 2.5, sarala: 4,
                       tartu: 5, kiivera: 5, alavere: 6, priiskovoje: 4, kuusiku: 7,
                       kohila: 7, maidla: 7, keila: 8, agja: 8 };
  // Kaare kõverus üksikute teekondade kaupa (muidu grupi oma)
  const K_ERAND = { V7: 0.2, V8: 0.27, T3: 0.33, V10: 0.5 };

  const AJASTUD = [
    [1700, 1918.15, "Vene keisririik, Eestimaa kubermang", "#3a3f4b"],
    [1918.15, 1918.9, "Saksa okupatsioon, Vabadussõja algus", "#5b4a3a"],
    [1918.9, 1940.46, "Eesti Vabariik", "#3d6b8f"],
    [1940.46, 1941.55, "Nõukogude okupatsioon", "#8f3d3d"],
    [1941.55, 1944.72, "Saksa okupatsioon", "#6b5a3a"],
    [1944.72, 1991.63, "Nõukogude okupatsioon, Eesti NSV", "#8f3d3d"],
    [1991.63, 2100, "Eesti Vabariik", "#3d6b8f"]
  ];
  // Ajaskaala on mittelineaarne: 1930–1962 saab rohkem ruumi.
  const LOIGUD = [[1835, 1930, 0, 0.28], [1930, 1962, 0.28, 0.86], [1962, 2002, 0.86, 1]];
  const ALGUS = 1835, LOPP = 2002;

  function aastaAsendiks(a) {
    a = Math.max(ALGUS, Math.min(LOPP, a));
    for (const [y0, y1, p0, p1] of LOIGUD) if (a <= y1) return p0 + (a - y0) / (y1 - y0) * (p1 - p0);
    return 1;
  }
  function asendAastaks(p) {
    for (const [y0, y1, p0, p1] of LOIGUD) if (p <= p1) return y0 + (p - p0) / (p1 - p0) * (y1 - y0);
    return LOPP;
  }
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- Kaart ----------
  const kaart = L.map("kaart", { zoomControl: false, minZoom: 2, maxZoom: 13, worldCopyJump: false, zoomSnap: 0.25 });
  L.control.zoom({ position: "bottomleft" }).addTo(kaart);
  // Aluskaart: Esri tumehall lõuend (võtmeta). Kui see ei laadi, tume OpenStreetMap.
  const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/";
  const ESRI_ATTR = 'Aluskaart &copy; <a href="https://www.esri.com">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const alus = L.tileLayer(ESRI + "World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", { maxZoom: 16, attribution: ESRI_ATTR }).addTo(kaart);
  kaart.createPane("sildid").style.zIndex = 450;
  const alusSildid = L.tileLayer(ESRI + "World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", { maxZoom: 16, pane: "sildid", opacity: 0.55 }).addTo(kaart);
  let vigu = 0;
  alus.on("tileerror", () => {
    if (++vigu !== 6) return;
    kaart.removeLayer(alus); kaart.removeLayer(alusSildid);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, className: "osm-tume",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(kaart);
  });
  kaart.createPane("kaared").style.zIndex = 460;
  kaart.createPane("halod").style.zIndex = 455;
  kaart.createPane("solmed").style.zIndex = 620;
  kaart.setView([56, 50], 3);

  const VAATED = {
    eesti: L.latLngBounds([57.9, 21.7], [59.7, 27.4]),
    siber: L.latLngBounds([53.6, 56], [59.6, 94])
  };

  const olek = { aasta: LOPP, mangib: false, grupid: { weiss: true, veimre: true, tulp: true } };

  Promise.all(["kohad", "teekonnad", "sundmused"].map(n =>
    fetch("data/" + n + ".geojson").then(r => { if (!r.ok) throw new Error(n); return r.json(); })
  )).then(([kohad, teekonnad, sundmused]) => ehita(kohad, teekonnad, sundmused))
    .catch(err => {
      document.getElementById("loend").innerHTML =
        '<li style="display:block">Andmeid ei saanud laadida (' + esc(err.message) +
        '). Kui avasid faili otse kettalt, käivita kaustas kohalik server, nt <code>python -m http.server</code>, ja ava <code>http://localhost:8000</code>.</li>';
    });

  function ehita(kohadFC, teekFC, sundFC) {
    const kohad = {};
    kohadFC.features.forEach(f => {
      const p = f.properties;
      kohad[p.id] = { ...p, latlng: L.latLng(f.geometry.coordinates[1], f.geometry.coordinates[0]), seotud: [] };
    });

    // Kõik ajajoone kirjed ühes loendis
    const kirjed = [];
    teekFC.features.forEach(f => {
      const p = f.properties;
      kirjed.push({ liik: "teekond", ...p });
    });
    sundFC.features.forEach(f => kirjed.push({ liik: "sundmus", ...f.properties }));
    kirjed.sort((a, b) => a.aasta - b.aasta);
    kirjed.forEach((k, i) => {
      k.nr = i;
      if (k.liik === "teekond") { kohad[k.lahtekoht].seotud.push(k); kohad[k.sihtkoht].seotud.push(k); }
      else if (k.koht) kohad[k.koht].seotud.push(k);
    });

    // ---------- Kaared ----------
    function kaareLatLngid(a, b, k) {
      const z = 4, pa = kaart.project(a, z), pb = kaart.project(b, z);
      const dx = pb.x - pa.x, dy = pb.y - pa.y, len = Math.hypot(dx, dy) || 1;
      const nx = dy / len, ny = -dx / len; // ida poole minnes kaar põhja
      const c = L.point((pa.x + pb.x) / 2 + nx * k * len, (pa.y + pb.y) / 2 + ny * k * len);
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const t = i / 64, u = 1 - t;
        pts.push(kaart.unproject(L.point(u * u * pa.x + 2 * u * t * c.x + t * t * pb.x,
                                         u * u * pa.y + 2 * u * t * c.y + t * t * pb.y), z));
      }
      return pts;
    }

    kirjed.filter(k => k.liik === "teekond").forEach(k => {
      const g = GRUPID[k.grupp], varv = g.varv;
      const pts = kaareLatLngid(kohad[k.lahtekoht].latlng, kohad[k.sihtkoht].latlng, K_ERAND[k.id] ?? g.k);
      k.pts = pts;
      const kiht = L.layerGroup();
      const opa = k.kindlus === "oletus" ? 0.55 : 0.9;
      L.polyline(pts, { pane: "kaared", color: varv, weight: 7, opacity: 0.14, className: "kaar-halo", interactive: false }).addTo(kiht);
      const pohi = L.polyline(pts, {
        pane: "kaared", color: varv, weight: 2.2, opacity: opa,
        dashArray: k.kindlus === "osaliselt" ? "7 5" : k.kindlus === "oletus" ? "1 6" : null, lineCap: "round"
      }).addTo(kiht);
      if (k.kindlus !== "oletus") {
        L.polyline(pts, { pane: "kaared", color: "#fff", weight: 2, opacity: 0.55, dashArray: "2 24",
                          lineCap: "round", className: "kaar-voog", interactive: false }).addTo(kiht);
      }
      // Nool
      const i1 = 54, i0 = 52;
      const nool = L.marker(pts[i1], {
        pane: "kaared", interactive: false,
        icon: L.divIcon({ className: "nool", html: '<div style="color:' + varv + '"></div>', iconSize: [0, 0] })
      }).addTo(kiht);
      k.nool = nool; k.noolI = [i0, i1];
      pohi.bindPopup(() => teekonnaPopup(k), { maxWidth: 340 });
      // Laiem nähtamatu joon klikkimiseks
      L.polyline(pts, { pane: "kaared", color: "#000", weight: 14, opacity: 0 }).bindPopup(() => teekonnaPopup(k), { maxWidth: 340 }).addTo(kiht);
      k.kiht = kiht;
    });

    function pooraNooled() {
      kirjed.forEach(k => {
        if (!k.nool) return;
        const a = kaart.latLngToLayerPoint(k.pts[k.noolI[0]]), b = kaart.latLngToLayerPoint(k.pts[k.noolI[1]]);
        const nurk = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90;
        const el = k.nool.getElement();
        if (el) el.firstChild.style.transform = "rotate(" + nurk + "deg)";
      });
    }
    kaart.on("zoomend viewreset", pooraNooled);

    // ---------- Sõlmed ----------
    Object.values(kohad).forEach(koht => {
      if (HALO_M[koht.tapsus]) {
        koht.halo = L.circle(koht.latlng, {
          pane: "halod", radius: HALO_ERAND[koht.id] || HALO_M[koht.tapsus], color: "#e7e3da", weight: 1, opacity: 0.35,
          dashArray: "2 4", fillColor: "#e7e3da", fillOpacity: 0.05, interactive: false
        }).addTo(kaart);
      }
      koht.marker = L.circleMarker(koht.latlng, { pane: "solmed", radius: 4, weight: 2, color: "#e7e3da", fillColor: "#0e1117", fillOpacity: 1 })
        .bindPopup(() => kohaPopup(koht), { maxWidth: 360 })
        .bindTooltip(esc(lyhi(koht.id)), { permanent: true, direction: koht.id === "sarala" ? "left" : "right", offset: [koht.id === "sarala" ? -7 : 7, 0], className: "silt" })
        .addTo(kaart);
    });

    function uuendaSildid() {
      const z = kaart.getZoom();
      Object.values(kohad).forEach(koht => {
        const naita = z >= (SILDI_SUUM[koht.id] || 5) && koht.aktiivne;
        if (naita) koht.marker.openTooltip(); else koht.marker.closeTooltip();
      });
    }
    kaart.on("zoomend", uuendaSildid);

    // ---------- Popupid ----------
    function kirjeRida(k, koht) {
      const varv = GRUPID[k.grupp].varv;
      if (k.liik === "teekond") {
        const suund = k.sihtkoht === koht.id ? "saabus siia, lähtekoht " + esc(lyhi(k.lahtekoht))
                                              : "lahkus, sihtkoht " + esc(lyhi(k.sihtkoht));
        return '<li style="border-color:' + varv + '"><span class="kp">' + esc(k.aeg) + '</span> <b>' + esc(k.isik) + '</b> ' + suund + '</li>';
      }
      return '<li style="border-color:' + varv + '"><span class="kp">' + esc(k.kuupaev) + '</span> <b>' + esc(k.isik) + '</b> ' + esc(k.tekst) +
             '<div class="pp-allikas">' + esc(k.allikas) + '</div></li>';
    }
    function kohaPopup(koht) {
      const read = koht.seotud.filter(k => olek.grupid[k.grupp]).map(k => kirjeRida(k, koht)).join("");
      return '<div class="pp-pealkiri">' + esc(koht.nimi) + '</div>' +
             '<span class="pp-silt">' + esc(TAPSUS[koht.tapsus]) + '</span>' +
             '<div class="pp-markus">' + esc(koht.markus) + '</div>' +
             '<ul class="pp-sundmused">' + read + '</ul>';
    }
    function teekonnaPopup(k) {
      return '<div class="pp-pealkiri" style="color:' + GRUPID[k.grupp].varv + '">' + esc(k.isik) + '</div>' +
             '<div>' + esc(kohad[k.lahtekoht].nimi) + ' → ' + esc(kohad[k.sihtkoht].nimi) + '</div>' +
             '<span class="pp-silt">' + esc(k.aeg) + '</span><span class="pp-silt ' + k.kindlus + '">' + esc(KINDLUS[k.kindlus]) + '</span>' +
             '<div>' + esc(k.tekst) + '</div><div class="pp-allikas">Allikas: ' + esc(k.allikas) + '</div>';
    }

    // ---------- Paneel ----------
    const gruppideEl = document.getElementById("grupid");
    Object.entries(GRUPID).forEach(([id, g]) => {
      const arv = kirjed.filter(k => k.grupp === id).length;
      const lbl = document.createElement("label");
      lbl.className = "grupp"; lbl.style.color = g.varv;
      lbl.innerHTML = '<input type="checkbox" checked><span class="mark"></span><span class="nimi">' + esc(g.nimi) + '</span><span class="arv">' + arv + '</span>';
      lbl.querySelector("input").addEventListener("change", e => {
        olek.grupid[id] = e.target.checked; lbl.classList.toggle("valjas", !e.target.checked); uuenda(false);
      });
      gruppideEl.appendChild(lbl);
    });

    const loendEl = document.getElementById("loend");
    kirjed.forEach(k => {
      const li = document.createElement("li");
      li.dataset.grupp = k.grupp;
      const kp = k.liik === "teekond" ? k.aeg : k.kuupaev;
      const kus = k.liik === "teekond"
        ? esc(lyhi(k.lahtekoht)) + " → " + esc(lyhi(k.sihtkoht))
        : (k.koht ? esc(lyhi(k.koht)) : "koht teadmata");
      const sisu = k.liik === "teekond" ? "" : " " + esc(k.tekst);
      li.innerHTML = '<span class="kp">' + esc(kp) + '</span><span><span class="isik">' + esc(k.isik) + '</span>' + sisu +
                     '<br><span class="liik">' + kus + '</span></span>';
      li.addEventListener("click", () => {
        if (olek.aasta < k.aasta) maaraAasta(k.aasta + 0.01);
        peata();
        if (k.liik === "teekond") {
          kaart.flyToBounds(L.latLngBounds(k.pts), { ...polster(), maxZoom: 9, duration: 1.2 });
          setTimeout(() => L.popup({ maxWidth: 340 }).setLatLng(k.pts[32]).setContent(teekonnaPopup(k)).openOn(kaart), 1300);
        } else if (k.koht) {
          const koht = kohad[k.koht];
          kaart.flyTo(koht.latlng, Math.max(kaart.getZoom(), koht.tapsus === "riik" ? 4 : 7), { duration: 1.2 });
          setTimeout(() => koht.marker.openPopup(), 1300);
        }
      });
      k.li = li;
      loendEl.appendChild(li);
    });

    document.getElementById("paneel-lyliti").addEventListener("click", e => {
      const p = document.getElementById("paneel");
      p.classList.toggle("peidetud");
      e.currentTarget.setAttribute("aria-expanded", String(!p.classList.contains("peidetud")));
    });

    // ---------- Ajajoon ----------
    const tikid = document.getElementById("tikid"), rada = document.getElementById("rada");
    kirjed.forEach(k => {
      const t = document.createElement("div");
      t.className = "tikk"; t.style.left = (aastaAsendiks(k.aasta) * 100) + "%"; t.style.background = GRUPID[k.grupp].varv;
      t.title = (k.liik === "teekond" ? k.aeg : k.kuupaev) + " · " + k.isik;
      k.tikk = t; tikid.appendChild(t);
    });
    AJASTUD.forEach(([a0, a1, , varv]) => {
      const p0 = aastaAsendiks(a0), p1 = aastaAsendiks(a1);
      if (p1 <= p0) return;
      const r = document.createElement("div");
      r.className = "ajastu-riba"; r.style.left = p0 * 100 + "%"; r.style.width = (p1 - p0) * 100 + "%"; r.style.background = varv;
      rada.appendChild(r);
    });
    const sildid = document.getElementById("rada-sildid");
    [1840, 1880, 1918, 1930, 1940, 1949, 1956, 1962, 1991].forEach(a => {
      const s = document.createElement("span");
      if (![1840, 1918, 1949, 1991].includes(a)) s.className = "vaike"; s.style.left = aastaAsendiks(a) * 100 + "%"; s.textContent = a; sildid.appendChild(s);
    });

    const liugur = document.getElementById("liugur");
    liugur.addEventListener("input", () => { peata(); maaraAasta(asendAastaks(liugur.value / 1000), true); });

    function maaraAasta(a, animeeri) {
      const enne = olek.aasta;
      olek.aasta = a;
      liugur.value = Math.round(aastaAsendiks(a) * 1000);
      uuenda(animeeri && a > enne, enne);
    }

    function ajastu(a) { const r = AJASTUD.find(([a0, a1]) => a >= a0 && a < a1); return r ? r[2] : ""; }

    function uuenda(animeeri, enne) {
      const a = olek.aasta;
      document.getElementById("aasta").textContent = Math.floor(a >= LOPP - 0.01 ? 2001 : a);
      document.getElementById("ajastu").textContent = ajastu(a);
      kirjed.forEach(k => {
        const lubatud = olek.grupid[k.grupp];
        const naha = lubatud && k.aasta <= a;
        k.li.classList.toggle("peidus", !lubatud);
        k.li.classList.toggle("tulevik", k.aasta > a);
        k.li.classList.toggle("praegu", naha && a - k.aasta < 1);
        k.tikk.style.display = lubatud ? "" : "none";
        if (k.kiht) {
          const kaardil = kaart.hasLayer(k.kiht);
          if (naha && !kaardil) { k.kiht.addTo(kaart); if (animeeri && k.aasta > enne) komeet(k); }
          if (!naha && kaardil) kaart.removeLayer(k.kiht);
        }
      });
      Object.values(kohad).forEach(koht => {
        const akt = koht.seotud.filter(k => olek.grupid[k.grupp] && k.aasta <= a);
        koht.aktiivne = akt.length > 0;
        const viimane = akt[akt.length - 1];
        koht.marker.setStyle(koht.aktiivne
          ? { radius: 3.5 + Math.sqrt(akt.length) * 1.6, color: GRUPID[viimane.grupp].varv, opacity: 1, fillOpacity: 1, fillColor: "#0e1117" }
          : { radius: 3, color: "#e7e3da", opacity: 0.18, fillOpacity: 0.2 });
        if (koht.halo) koht.halo.setStyle({ opacity: koht.aktiivne ? 0.35 : 0.08, fillOpacity: koht.aktiivne ? 0.05 : 0.01 });
      });
      uuendaSildid();
      pooraNooled();
      if (olek.mangib) {
        const praegu = kirjed.filter(k => olek.grupid[k.grupp] && k.aasta <= a).pop();
        if (praegu && praegu !== olek.viimaneLi) { olek.viimaneLi = praegu; praegu.li.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
      }
    }

    function komeet(k) {
      const m = L.circleMarker(k.pts[0], { pane: "solmed", radius: 4.5, color: "#fff", weight: 1, fillColor: GRUPID[k.grupp].varv, fillOpacity: 1, interactive: false }).addTo(kaart);
      const kestus = 1400, t0 = performance.now();
      (function samm(t) {
        const f = Math.min(1, (t - t0) / kestus), i = f * (k.pts.length - 1), i0 = Math.floor(i), i1 = Math.min(i0 + 1, k.pts.length - 1), r = i - i0;
        m.setLatLng(L.latLng(k.pts[i0].lat + (k.pts[i1].lat - k.pts[i0].lat) * r, k.pts[i0].lng + (k.pts[i1].lng - k.pts[i0].lng) * r));
        if (f < 1) requestAnimationFrame(samm); else kaart.removeLayer(m);
      })(t0);
    }

    // Mängimine
    let taimer = null;
    const nupp = document.getElementById("mangi");
    function peata() { olek.mangib = false; nupp.textContent = "▶"; nupp.setAttribute("aria-label", "Mängi"); if (taimer) cancelAnimationFrame(taimer); taimer = null; }
    function mangi() {
      if (aastaAsendiks(olek.aasta) >= 0.999) maaraAasta(ALGUS);
      olek.mangib = true; nupp.textContent = "❚❚"; nupp.setAttribute("aria-label", "Peata");
      let eelmine = performance.now();
      (function samm(t) {
        if (!olek.mangib) return;
        const dt = t - eelmine; eelmine = t;
        const p = Math.min(1, aastaAsendiks(olek.aasta) + dt / 40000);
        maaraAasta(asendAastaks(p), true);
        if (p >= 1) { peata(); return; }
        taimer = requestAnimationFrame(samm);
      })(eelmine);
    }
    nupp.addEventListener("click", () => olek.mangib ? peata() : mangi());

    // Vaated
    const koikPiirid = L.latLngBounds(Object.values(kohad).map(k => k.latlng));
    function polster() {
      return window.innerWidth > 760 ? { paddingTopLeft: [40, 140], paddingBottomRight: [500, 120] }
                                     : { paddingTopLeft: [30, 130], paddingBottomRight: [90, 130] };
    }
    document.querySelectorAll("#vaated button").forEach(b => b.addEventListener("click", () => {
      document.querySelectorAll("#vaated button").forEach(x => x.classList.toggle("aktiivne", x === b));
      const v = b.dataset.vaade;
      kaart.flyToBounds(v === "koik" ? koikPiirid : VAATED[v], { ...polster(), duration: 1.2 });
    }));

    if (window.innerWidth <= 760) document.getElementById("paneel").classList.add("peidetud");
    kaart.fitBounds(koikPiirid, polster());
    maaraAasta(LOPP);
  }
})();
