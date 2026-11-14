/* Perekonna teekonnad: Leafleti migratsioonikaart.
   Andmed: data/kohad.geojson, data/teekonnad.geojson, data/sundmused.geojson */
(function () {
  "use strict";

  const GRUPID = {
    weiss:  { nimi: "Weissi ja Maikowski liin", varv: "#f2b84b", k: 0.22 },
    veimre: { nimi: "Veimred ja Luhasalud",     varv: "#ff6f61", k: 0.26 },
    tulp:   { nimi: "Tulbid",                    varv: "#5ec8f2", k: 0.32 }
  };
  // Liikumise liik: nimi, kuidas öelda sihtkohas ja lähtekohas, sõna kaare sildil
  const LIIK = {
    elukoht:           { nimi: "elukoht",             siia: "elasid siin",              ara: "elasid hiljem",         silt: "elasid" },
    kolimine:          { nimi: "kolimine",            siia: "kolis siia",               ara: "kolis",                 silt: "" },
    valjaranne:        { nimi: "väljaränne",          siia: "saabus siia",              ara: "rändas välja",          silt: "" },
    teenistus:         { nimi: "sõjaväeteenistus",    siia: "tuli siia teenistusse",    ara: "läks teenistusse",      silt: "väeteenistus" },
    opingud:           { nimi: "õpingud",             siia: "tuli siia õppima",         ara: "läks õppima",           silt: "õpingud" },
    pogenemine:        { nimi: "põgenemine läände",   siia: "jõudis siia põgenikuna",   ara: "põgenes",               silt: "põgenes" },
    lopetamine:        { nimi: "õpingute lõpp",       siia: "tuli pärast ülikooli lõpetamist tagasi", ara: "lõpetas ülikooli, tuli tagasi", silt: "lõpetas ülikooli" },
    arreteerimine:     { nimi: "arreteerimine",       siia: "toodi siia arreteerituna", ara: "arreteeriti, viidi",    silt: "arreteeriti" },
    kuuditamine:       { nimi: "küüditamine",         siia: "toodi siia küüditatuna",   ara: "küüditati, viidi",      silt: "küüditati" },
    sundumberpaigutus: { nimi: "sundümberpaigutus asumisel", siia: "paigutati siia ümber", ara: "paigutati ümber", silt: "viidi" },
    abiellumine:       { nimi: "abiellumine",         siia: "abiellus siin",            ara: "abiellus, abielu registreeriti", silt: "abiellusid" },
    vabastamine:       { nimi: "vabastamine asumiselt", siia: "tuli asumiselt tagasi", ara: "vabastati, tuli tagasi", silt: "vabastati" },
    tagasitulek:       { nimi: "tagasitulek asumiselt", siia: "tuli asumiselt tagasi", ara: "tuli tagasi Eestisse",  silt: "tagasi Eestisse" }
  };
  const KINDLUS = { toendatud: "tõendatud", osaliselt: "osaliselt tõendatud", oletus: "oletus" };
  const TAPSUS = { aadress: "täpne koht", asula: "asula", rajoon: "ainult piirkond", riik: "ainult riik" };
  const HALO_M = { rajoon: 45000, riik: 380000 };
  const HALO_ERAND = { keila: 9000, sondershausen: 40000, petseri: 20000 };
  const LUHINIMI = { vankse: "Vankse", kalisz: "Kalisz", sondershausen: "Schwarzburg-Sondershausen", janeda: "Jäneda", lehtse: "Lehtse",
                     alavere: "Alavere", kiivera: "Kiivera (Kõpu)",
                     maidla: "Maidla", kohila: "Kohila", tallinn: "Tallinn", tartu: "Tartu (Soola 33)", agja: "Agja (Klooga)",
                     keila: "Keila vald", turinsk: "Turinsk (Sevurallag)", polevoje: "Polevoje",
                     sarala: "Sarala / Ordžonikidze", priiskovoje: "Priiskovõi", kuusiku: "Kuusiku", petseri: "Pihkva järv, Kolpino saar",
                     debica: "Dębica (Heidelager)", neveklau: "Neveklau", izjum: "Izjum", olsana: "Olšana", sennheim: "Sennheim", sinimaed: "Sinimäed", amsterdam: "Amsterdam", stockholm: "Stockholm", lutheri30: "Lutheri 30", suurtartu41: "Suur-Tartu 41", rummu: "Rummu", emumae: "Emumäe", reid: "„Jaen Teär“ reidil", kadriorg: "Kadrioru rand", helda: "Helda (Neo talu)", mahtra: "Mahtra mõis", nomme: "Nõmme kalmistu", krasnojarsk: "Krasnojarski krai" };
  const lyhi = id => LUHINIMI[id] || id;
  // Millisest suumist alates silt näha on
  const SILDI_SUUM = { vankse: 9, tallinn: 2, polevoje: 2.5, turinsk: 2.5, kalisz: 2.5, sondershausen: 2.5, janeda: 8, lehtse: 7, sarala: 4,
                       tartu: 5, kiivera: 5, alavere: 6, priiskovoje: 4, kuusiku: 7,
                       kohila: 7, maidla: 7, keila: 8, agja: 8, petseri: 5,
                       debica: 3, neveklau: 3.5, izjum: 3, olsana: 3, sennheim: 3, krasnojarsk: 3, sinimaed: 6, amsterdam: 3, stockholm: 3, lutheri30: 12, suurtartu41: 13, rummu: 8, emumae: 7, reid: 9, kadriorg: 10, helda: 8, mahtra: 8, nomme: 9 };
  // Kaare kõverus üksikute teekondade kaupa (muidu grupi oma)
  const K_ERAND = { T11: 0.35, T8: 0.18, T9: 0.22, T5: 0.2, T6: 0.18, T7: 0.25, V7: 0.2, V8: 0.27, T3: 0.33, V10: 0.5, V13: 0.08, W2c: 0.35, W2d: 0.3 };
  // Kaare sildi asukoht (punkti indeks 0–64); vaikimisi keskel
  const SILT_I = { V6: 46, V7: 44, V8: 22, T3: 32, V11: 36, T4: 30, V13: 40 };

  // Riigikorrad: algus, lõpp, pikk nimi (aasta all), lühinimi (ribal), värv.
  // Värvid: Venemaa/NSVL punakad, Saksamaa pruunid, Eesti sinised.
  const AJASTUD = [
    [1700, 1918.15, "Vene keisririik, Eestimaa kubermang", "Vene keisririik", "#5a4652"],
    [1918.15, 1918.86, "Saksa okupatsioon (veebr–nov 1918)", "Saksa okup.", "#8a6a3a"],
    [1918.86, 1920.09, "Eesti Vabariik, Vabadussõda (Tartu rahu 2.02.1920)", "Vabadussõda", "#2f6f9f"],
    [1920.09, 1940.46, "Eesti Vabariik", "Eesti Vabariik", "#3d7fb0"],
    [1940.46, 1941.66, "Nõukogude okupatsioon (juuni 1940 – aug 1941)", "NSVL okup.", "#a33a3a"],
    [1941.66, 1944.72, "Saksa okupatsioon (aug 1941 – sept 1944)", "Saksa okup.", "#8a6a3a"],
    [1944.72, 1991.63, "Nõukogude okupatsioon, Eesti NSV", "NSVL okupatsioon (Eesti NSV)", "#a33a3a"],
    [1991.63, 2100, "Eesti Vabariik (taastatud 20.08.1991)", "Eesti Vabariik", "#3d7fb0"]
  ];
  // Ajaloolised sündmused (taust): aasta, kuupäev, tekst. Joonistatakse ainult ajajoonele, mitte kaardile.
  const AJALUGU = [
    [1816.44, "8.06.1816", "Pärisorjuse kaotamine Eestimaa kubermangus (Liivimaal 1819)"],
    [1834.5, "1834–1835", "Eestimaa talupojad said perekonnanimed (Liivimaal 1822–1826); ka Tulbid Maidlas"],
    [1854.0, "1853–1856", "Krimmi sõda"],
    [1858.42, "2.06.1858", "Mahtra sõda Juuru kihelkonnas"],
    [1863.52, "1863", "Passiseadus: talupojad said vabamalt kolida, ka linna"],
    [1870.7, "1870", "Balti raudtee Paldiski–Tallinn–Peterburi; Tallinn hakkab kiiresti kasvama"],
    [1904.1, "1904–1905", "Vene–Jaapani sõda"],
    [1905.9, "1905", "1905. aasta revolutsioon, mõisapõletamised"],
    [1914.58, "1914–1918", "Esimene maailmasõda"],
    [1918.15, "24.02.1918", "Eesti iseseisvusmanifest"],
    [1919.78, "10.10.1919", "Maaseadus: mõisamaad võõrandati, baltisaksa mõisnike aeg lõppes"],
    [1920.09, "2.02.1920", "Tartu rahu"],
    [1939.64, "23.08.1939", "Molotovi–Ribbentropi pakt ja salaprotokoll"],
    [1939.67, "1.09.1939", "Teine maailmasõda algab"],
    [1939.74, "28.09.1939", "Baaside leping: Nõukogude sõjaväebaasid Eestisse (Klooga, Agja)"],
    [1939.8, "okt 1939", "Baltisakslaste ümberasumine Saksamaale"],
    [1940.46, "17.06.1940", "Punaarmee okupeerib Eesti"],
    [1941.45, "14.06.1941", "Juuniküüditamine"],
    [1941.47, "22.06.1941", "Saksamaa ründab NSV Liitu"],
    [1941.66, "28.08.1941", "Saksa väed jõuavad Tallinna"],
    [1944.72, "22.09.1944", "Punaarmee Tallinnas; suur põgenemine läände"],
    [1945.35, "8.05.1945", "Sõja lõpp Euroopas"],
    [1949.23, "25.03.1949", "Märtsiküüditamine"],
    [1953.18, "5.03.1953", "Stalini surm; hiljem algavad vabastamised asumiselt"],
    [1991.63, "20.08.1991", "Eesti iseseisvuse taastamine"]
  ];
  // Riigikorra menüü tekstid (samas järjekorras kui AJASTUD)
  const MENUU = ["Vene keisririik (kuni 1918)", "Saksa okupatsioon (veebr–nov 1918)", "Vabadussõda (1918–1920)",
    "Eesti Vabariik (1920–1940)", "Nõukogude okupatsioon (1940–1941)", "Saksa okupatsioon (1941–1944)",
    "Nõukogude okupatsioon, Eesti NSV (1944–1991)", "Eesti Vabariik (alates 1991)"];
  // Ajaskaala on mittelineaarne: 1930–1962 saab rohkem ruumi.
  const LOIGUD = [[1795, 1930, 0, 0.3], [1930, 1962, 0.3, 0.86], [1962, 2002, 0.86, 1]];
  const ALGUS = 1795, LOPP = 2002;

  // Põlvkonnad (loetud uurijast: 2 = vanavanemad). Sildil klõpsates kitseneb ajajoon nende aastatele.
  const POLVED = [
    { nr: 6, a0: 1799, a1: 1866, nimi: "Johann Jacob, Wojciech", koik: "Johann Jacob ja Madle Weiss, Wojciech ja Liza Majkowski, Jüri Tulp" },
    { nr: 5, a0: 1836, a1: 1930, nimi: "Johann Christian, Rosalie", koik: "Johann Christian ja Rosalie Weiss, Ado ja Kai Tulp" },
    { nr: 4, a0: 1863, a1: 1959, nimi: "Aleksander-Georg, Marie", koik: "Aleksander-Georg ja Marie Weiss, Jaan ja Liisa Maria Tulp" },
    { nr: 3, a0: 1871, a1: 1988, nimi: "Arnold, Magda, August", koik: "Arnold ja Magda Veimre, Arnoldi õde Hermine, August ja Aliide Tulp; Magda vanemad Hans ja Anna Luhasalu" },
    { nr: 2, a0: 1923, a1: 2002, nimi: "Heli, Harry, Udo", koik: "Heli ja Harry Tulp, Guido Tulp, Udo Veimre" }
  ];
  function aastaAsendiks(a) {
    if (olek.aken) { const [b0, b1] = olek.aken; return Math.max(0, Math.min(1, (a - b0) / (b1 - b0))); }
    a = Math.max(ALGUS, Math.min(LOPP, a));
    for (const [y0, y1, p0, p1] of LOIGUD) if (a <= y1) return p0 + (a - y0) / (y1 - y0) * (p1 - p0);
    return 1;
  }
  function asendAastaks(p) {
    if (olek.aken) { const [b0, b1] = olek.aken; return b0 + p * (b1 - b0); }
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
    siber: L.latLngBounds([53.6, 56], [59.6, 94]),
    rinne: L.latLngBounds([47.3, 6.5], [60, 38.5])  // (vana vaade, nupp asendatud ajaaknaga 1918–1960)
  };

  const olek = { aasta: LOPP, mangib: false, aken: null, polv: null, grupid: { weiss: true, veimre: true, tulp: true } };

  Promise.all(["kohad", "teekonnad", "sundmused"].map(n =>
    fetch("data/" + n + ".geojson", { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(n); return r.json(); })
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
      // Silt piki kaart: kes ja millal
      const si = SILT_I[k.id] || 32;
      const nimi = k.isik.replace(/\s*\(.*?\)/g, "");
      k.silt = L.marker(pts[si], {
        pane: "kaared", interactive: false,
        icon: L.divIcon({ className: "kaar-silt-ikoon", iconSize: [0, 0],
          html: '<div class="kaar-silt" style="color:' + varv + '"><b>' + esc(nimi) + '</b> · ' +
                (LIIK[k.liikumine].silt ? esc(LIIK[k.liikumine].silt) + " " : "") + esc(k.aeg) + '</div>' })
      }).addTo(kiht);
      k.siltI = si;
      pohi.bindPopup(() => teekonnaPopup(k), { maxWidth: 340 });
      // Laiem nähtamatu joon klikkimiseks
      L.polyline(pts, { pane: "kaared", color: "#000", weight: 14, opacity: 0 }).bindPopup(() => teekonnaPopup(k), { maxWidth: 340 }).addTo(kiht);
      k.kiht = kiht;
    });

    function pooraNooled() {
      const nahtavad = [];
      kirjed.forEach(k => {
        if (!k.nool) return;
        const a = kaart.latLngToLayerPoint(k.pts[k.noolI[0]]), b = kaart.latLngToLayerPoint(k.pts[k.noolI[1]]);
        const nurk = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90;
        const el = k.nool.getElement();
        if (el) el.firstChild.style.transform = "rotate(" + nurk + "deg)";
        const se = k.silt && k.silt.getElement();
        if (se) {
          // Silt jääb nähtavale: kui eelistatud koht on vaatest väljas, otsi kaarel lähim nähtav punkt
          const suurus = kaart.getSize(), lai = window.innerWidth > 760;
          const x0 = 20, x1 = suurus.x - (lai ? 380 : 20), y0 = lai ? 130 : 120, y1 = suurus.y - 175;
          const nahtav = j => { const c = kaart.latLngToContainerPoint(k.pts[j]); return c.x > x0 && c.x < x1 && c.y > y0 && c.y < y1; };
          let i = -1;
          for (let d = 0; d <= 60 && i < 0; d++) {
            for (const j of [k.siltI - d, k.siltI + d]) if (j >= 4 && j <= 60 && nahtav(j)) { i = j; break; }
          }
          if (i < 0) { se.firstChild.style.display = "none"; return; }
          const div = se.firstChild;
          // Paigutab sildi kaare punkti j juurde ja pöörab kaare suunas (välisküljele)
          const paiguta = (j, sees) => {
            if (j !== k.siltNyyd) { k.siltNyyd = j; k.silt.setLatLng(k.pts[j]); }
            div.style.fontSize = Math.max(10.5, Math.min(14, 10.5 + (kaart.getZoom() - 4) * 0.7)) + "px";
            const p0 = kaart.latLngToLayerPoint(k.pts[j - 2]), p1 = kaart.latLngToLayerPoint(k.pts[j + 2]);
            let n = Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
            const umber = n > 90 || n < -90;
            if (umber) n += 180;
            const nihe = (umber ? 9 : -9) * (sees ? -1 : 1);
            div.style.transform = "translate(-50%, -50%) rotate(" + n + "deg) translateY(" + nihe + "px)";
            // Sildi geomeetria ekraanil: keskjoone lõik ja kõrgus (pööratud ristküliku asemel)
            const r = n * Math.PI / 180, ux = Math.cos(r), uy = Math.sin(r), c = kaart.latLngToContainerPoint(k.pts[j]);
            const cx = c.x - uy * nihe, cy = c.y + ux * nihe, pw = div.offsetWidth / 2 + 4;
            return { ax: cx - ux * pw, ay: cy - uy * pw, bx: cx + ux * pw, by: cy + uy * pw, h: div.offsetHeight + 2 };
          };
          paiguta(i);
          // Sildi pikkus vs kaare pikkus ekraanil
          const pA = kaart.latLngToLayerPoint(k.pts[0]), pB = kaart.latLngToLayerPoint(k.pts[64]);
          const pikk = Math.hypot(pB.x - pA.x, pB.y - pA.y);
          div.style.display = pikk > Math.max(110, div.textContent.length * 4.6) ? "" : "none";
          if (!div.style.display && kaart.hasLayer(k.kiht) && !k.tuhm) nahtavad.push({ k, div, i, paiguta, nahtav });
        }
      });
      // Kattuvad sildid: kõigepealt proovi silti kaarel nihutada, alles siis peida.
      // Eelistus: tõendatud enne, siis ajajärjekord.
      const jark = { toendatud: 0, osaliselt: 1, oletus: 2 };
      nahtavad.sort((x, y) => jark[x.k.kindlus] - jark[y.k.kindlus] || x.k.aasta - y.k.aasta);
      const voetud = [];
      // Kahe lõigu vähim kaugus; sildid kattuvad, kui see on väiksem kui nende kõrgus
      const pl = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
      const ristub = (a, b) => { const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
        const A = { x: a.ax, y: a.ay }, B = { x: a.bx, y: a.by }, C = { x: b.ax, y: b.ay }, D = { x: b.bx, y: b.by };
        return o(A, B, C) !== o(A, B, D) && o(C, D, A) !== o(C, D, B); };
      const kaugus = (a, b) => ristub(a, b) ? 0 : Math.min(pl(a.ax, a.ay, b.ax, b.ay, b.bx, b.by), pl(a.bx, a.by, b.ax, b.ay, b.bx, b.by), pl(b.ax, b.ay, a.ax, a.ay, a.bx, a.by), pl(b.bx, b.by, a.ax, a.ay, a.bx, a.by));
      const kattub = g => voetud.some(q => kaugus(g, q) < (g.h + q.h) / 2);
      // Kohanimed on takistused, mida kaaresildid ei kata
      const kast = kaart.getContainer().getBoundingClientRect();
      document.querySelectorAll(".leaflet-tooltip.silt").forEach(el => {
        if (el.style.display === "none" || !el.offsetParent) return;
        const r = el.getBoundingClientRect(), y = (r.top + r.bottom) / 2 - kast.top;
        voetud.push({ ax: r.left - kast.left, ay: y, bx: r.right - kast.left, by: y, h: r.height });
      });
      nahtavad.forEach(({ div, i, paiguta, nahtav }) => {
        // Kandidaadid: eelistatud koht, siis nihked mööda kaart; mõlemad kaare küljed
        const kandidaadid = [i];
        for (let d = 4; d <= 44; d += 4) kandidaadid.push(i - d, i + d);
        for (const sees of [false, true]) for (const j of kandidaadid) {
          if (j < 10 || j > 54 || !nahtav(j)) continue;
          const g = paiguta(j, sees);
          if (!kattub(g)) { voetud.push(g); return; }
        }
        paiguta(i);
        div.style.display = "none";
      });
    }
    kaart.on("zoomend viewreset moveend", pooraNooled);

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
        const l = LIIK[k.liikumine];
        const suund = k.sihtkoht === koht.id
          ? esc(l.siia) + (k.liikumine === "elukoht" ? " (varem " + esc(lyhi(k.lahtekoht)) + ")" : "")
                                              : esc(l.ara) + " → " + esc(lyhi(k.sihtkoht));
        return '<li style="border-color:' + varv + '"><span class="kp">' + esc(k.aeg) + '</span> <b>' + esc(k.isik) + '</b>' + suhe(k) + ' ' + suund + (k.pool ? ' (' + esc(k.pool) + ')' : '') + '</li>';
      }
      return '<li style="border-color:' + varv + '"><span class="kp">' + esc(k.kuupaev) + '</span> <b>' + esc(k.isik) + '</b>' + suhe(k) + ' ' + esc(k.tekst) +
             '<div class="pp-allikas">' + esc(k.allikas) + '</div>' + lingid(k) + '</li>';
    }
    // Sugulus Heli või Harry suhtes
    function suhe(k) { return k.suhe ? ' <span class="suhe">(' + esc(k.suhe) + ')</span>' : ""; }
    // Lisalingid (ainult https, avanevad uues aknas)
    function lingid(k) {
      const l = (k.lingid || []).filter(([, u]) => /^https:\/\//.test(u));
      return l.length ? '<div class="pp-lingid">' + l.map(([t, u]) => '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(t) + ' ↗</a>').join("") + '</div>' : "";
    }
    function kohaPopup(koht) {
      const read = koht.seotud.filter(k => olek.grupid[k.grupp]).map(k => kirjeRida(k, koht)).join("");
      return '<div class="pp-pealkiri">' + esc(koht.nimi) + '</div>' +
             '<span class="pp-silt">' + esc(TAPSUS[koht.tapsus]) + '</span>' +
             '<div class="pp-markus">' + esc(koht.markus) + '</div>' +
             '<ul class="pp-sundmused">' + read + '</ul>';
    }
    function teekonnaPopup(k) {
      return '<div class="pp-pealkiri" style="color:' + GRUPID[k.grupp].varv + '">' + esc(k.isik) + '</div>' + (k.suhe ? '<div class="suhe">' + esc(k.suhe) + '</div>' : '') +
             '<div>' + esc(kohad[k.lahtekoht].nimi) + ' → ' + esc(kohad[k.sihtkoht].nimi) + '</div>' +
             '<span class="pp-silt">' + esc(LIIK[k.liikumine].nimi) + '</span>' + (k.pool ? '<span class="pp-silt">' + esc(k.pool) + '</span>' : '') + '<span class="pp-silt">' + esc(k.aeg) + '</span><span class="pp-silt ' + k.kindlus + '">' + esc(KINDLUS[k.kindlus]) + '</span>' +
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
        ? esc(LIIK[k.liikumine].nimi) + (k.pool ? " (" + esc(k.pool) + ")" : "") + ": " + esc(lyhi(k.lahtekoht)) + " → " + esc(lyhi(k.sihtkoht))
        : (k.koht ? esc(lyhi(k.koht)) : "");
      const sisu = k.liik === "teekond" ? "" : " " + esc(k.tekst);
      li.innerHTML = '<span class="kp">' + esc(kp) + '</span><span><span class="isik">' + esc(k.isik) + '</span>' + suhe(k) + sisu +
                     (kus ? '<br><span class="liik">' + kus + '</span>' : '') + '</span>';
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

    const koikPiirid = L.latLngBounds(Object.values(kohad).map(k => k.latlng));
    function polster() {
      return window.innerWidth > 760 ? { paddingTopLeft: [40, 140], paddingBottomRight: [500, 170] }
                                     : { paddingTopLeft: [30, 130], paddingBottomRight: [90, 180] };
    }

    // ---------- Ajajoon ----------
    const tikid = document.getElementById("tikid"), rada = document.getElementById("rada");
    const sildid = document.getElementById("rada-sildid");
    kirjed.forEach(k => {
      const t = document.createElement("div");
      t.className = "tikk"; t.style.background = GRUPID[k.grupp].varv;
      t.title = (k.liik === "teekond" ? k.aeg : k.kuupaev) + " · " + k.isik;
      k.tikk = t; tikid.appendChild(t);
    });
    function joonistaRada() {
      rada.querySelectorAll(".ajastu-riba").forEach(e => e.remove());
      sildid.innerHTML = "";
      kirjed.forEach(k => {
        const p = aastaAsendiks(k.aasta);
        // Ajaaken kitsendab loendit; teiste põlvkondade kirjed jäävad aknas tuhmiks taustaks
        k.aknas = !olek.aken || (k.aasta >= olek.aken[0] && k.aasta <= olek.aken[1]);
        k.omaPolv = !olek.polv || (k.polv || []).includes(olek.polv);
        k.tikk.style.left = (p * 100) + "%";
      });
      const radaLai = rada.getBoundingClientRect().width || 800;
      AJASTUD.forEach(([a0, a1, nimi, luhi, varv]) => {
        const p0 = aastaAsendiks(a0), p1 = aastaAsendiks(a1);
        if (p1 <= p0) return;
        const r = document.createElement("div");
        r.className = "ajastu-riba"; r.style.left = p0 * 100 + "%"; r.style.width = (p1 - p0) * 100 + "%"; r.style.background = varv;
        r.title = nimi + " (" + Math.floor(a0 < ALGUS ? ALGUS : a0) + "–" + (a1 > 2002 ? "" : Math.floor(a1)) + ")";
        r.textContent = luhi;
        if ((p1 - p0) * radaLai < luhi.length * 5.6 + 8) r.classList.add("kitsas");
        rada.appendChild(r);
      });
      // Ajaloosündmuste märgid riba all; klõps näitab teksti
      rada.querySelectorAll(".ajalugu-mark").forEach(e => e.remove());
      // Lähedased sündmused (alla 12 px) koondatakse üheks märgiks, mille tekstis on kõik
      const grupid = [];
      AJALUGU.forEach(([a, kp, tekst]) => {
        if (olek.aken && (a < olek.aken[0] || a > olek.aken[1])) return;
        const x = aastaAsendiks(a) * radaLai, viimane = grupid[grupid.length - 1];
        if (viimane && x - viimane.x0 < 12) viimane.read.push([kp, tekst]);
        else grupid.push({ x0: x, p: aastaAsendiks(a), read: [[kp, tekst]] });
      });
      grupid.forEach(g => {
        const m = document.createElement("button");
        m.className = "ajalugu-mark" + (g.read.length > 1 ? " mitu" : ""); m.style.left = g.p * 100 + "%";
        const t = g.read.map(([kp, tk]) => kp + " " + tk).join("\n");
        m.title = t; m.setAttribute("aria-label", t);
        m.addEventListener("click", e => { e.stopPropagation(); naitaAjalugu(m, g.read); });
        rada.appendChild(m);
      });
      let aastad, suured;
      if (olek.aken) {
        const [b0, b1] = olek.aken, ulatus = b1 - b0, samm = ulatus > 60 ? 20 : ulatus > 15 ? 10 : ulatus > 6 ? 2 : 1;
        aastad = []; for (let y = Math.ceil(b0 / samm) * samm; y <= b1; y += samm) aastad.push(y);
        suured = aastad.filter((y, i) => i % 2 === 0);
      } else {
        aastad = [1800, 1840, 1880, 1918, 1940, 1949, 1956, 1962, 1991]; suured = [1800, 1918, 1949, 1991];
      }
      aastad.forEach(a => {
        const s = document.createElement("span");
        if (!suured.includes(a)) s.className = "vaike";
        s.style.left = aastaAsendiks(a) * 100 + "%"; s.textContent = a; sildid.appendChild(s);
      });
    }
    function naitaAjalugu(m, read) {
      const k = document.getElementById("ajaloo-info");
      k.innerHTML = read.map(([kp, tekst]) => "<div><b>" + esc(kp) + "</b> " + esc(tekst) + "</div>").join("");
      const r = m.getBoundingClientRect();
      k.style.left = Math.max(12, Math.min(window.innerWidth - 332, r.left - 150)) + "px";
      k.hidden = false;
      clearTimeout(k._t); k._t = setTimeout(() => { k.hidden = true; }, 8000);
    }
    document.addEventListener("click", () => { const k = document.getElementById("ajaloo-info"); if (k) k.hidden = true; });
    joonistaRada();
    window.addEventListener("resize", () => joonistaRada());

    // Põlvkondade sildid
    const perioodidEl = document.getElementById("perioodid");
    function piiridAknas() {
      const pts = [];
      kirjed.forEach(k => {
        if (!k.aknas || !k.omaPolv || !olek.grupid[k.grupp]) return;
        if (k.liik === "teekond") { pts.push(kohad[k.lahtekoht].latlng, kohad[k.sihtkoht].latlng); }
        else if (k.koht) pts.push(kohad[k.koht].latlng);
      });
      return pts.length ? L.latLngBounds(pts) : koikPiirid;
    }
    function valiAken(aken, nupp, polvNr) {
      peata();
      olek.polv = polvNr || null;
      perioodidEl.querySelectorAll("button").forEach(b => b.classList.toggle("aktiivne", b === nupp));
      olek.aken = aken;
      joonistaRada();
      maaraAasta(aken ? aken[1] : LOPP);
      const b = aken ? piiridAknas() : koikPiirid;
      kaart.flyToBounds(b, { ...polster(), maxZoom: 7, duration: 1.2 });
    }
    const koikNupp = document.createElement("button");
    koikNupp.className = "aktiivne"; koikNupp.innerHTML = "<b>Kõik</b><span>1799–2001</span>";
    koikNupp.addEventListener("click", () => valiAken(null, koikNupp));
    perioodidEl.appendChild(koikNupp);
    POLVED.forEach(g => {
      const b = document.createElement("button");
      b.title = g.nr + ". põlvkond (2 = vanavanemad): " + g.koik;
      b.innerHTML = "<b>" + esc(g.nimi) + "</b><span>" + g.nr + ". põlvkond · " + g.a0 + "–" + (g.a1 > 2001 ? 2001 : g.a1) + "</span>";
      b.addEventListener("click", () => { const rk = document.getElementById("riigikord"); rk.value = ""; rk.classList.remove("aktiivne"); valiAken([g.a0, g.a1 + 0.99], b, g.nr); });
      perioodidEl.appendChild(b);
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
      const a0 = olek.aken ? olek.aken[0] : -Infinity;
      kirjed.forEach(k => {
        const lubatud = olek.grupid[k.grupp];
        const naha = lubatud && k.aasta <= a;
        k.tuhm = naha && (k.aasta < a0 || !k.omaPolv);
        k.li.classList.toggle("peidus", !lubatud || !k.aknas);
        k.li.classList.toggle("teine-polv", !k.omaPolv);
        k.tikk.classList.toggle("teine-polv", !k.omaPolv);
        k.li.classList.toggle("tulevik", k.aasta > a);
        k.li.classList.toggle("praegu", naha && a - k.aasta < 1);
        k.tikk.style.display = lubatud && k.aknas ? "" : "none";
        if (k.kiht) {
          const kaardil = kaart.hasLayer(k.kiht);
          if (naha && !kaardil) { k.kiht.addTo(kaart); if (animeeri && k.aasta > enne && !k.tuhm) komeet(k); }
          if (!naha && kaardil) kaart.removeLayer(k.kiht);
          // Varasemad teekonnad jäävad kaardile tuhmilt taustaks
          if (naha) k.kiht.eachLayer(l => { const el = l.getElement && l.getElement(); if (el) { el.classList.toggle("tuhm", k.tuhm); el.classList.toggle("teine-polv", k.tuhm && !k.omaPolv); } });
        }
      });
      Object.values(kohad).forEach(koht => {
        // Põlvkonna vaates loevad kohta aktiivseks ainult selle põlvkonna kirjed
        const akt = koht.seotud.filter(k => olek.grupid[k.grupp] && k.aasta <= a && k.omaPolv !== false);
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
        const f = Math.max(0, Math.min(1, (t - t0) / kestus)), i = f * (k.pts.length - 1), i0 = Math.floor(i), i1 = Math.min(i0 + 1, k.pts.length - 1), r = i - i0;
        m.setLatLng(L.latLng(k.pts[i0].lat + (k.pts[i1].lat - k.pts[i0].lat) * r, k.pts[i0].lng + (k.pts[i1].lng - k.pts[i0].lng) * r));
        if (f < 1) requestAnimationFrame(samm); else kaart.removeLayer(m);
      })(t0);
    }

    // Mängimine
    let taimer = null;
    const nupp = document.getElementById("mangi");
    function peata() { olek.mangib = false; nupp.textContent = "▶"; nupp.setAttribute("aria-label", "Mängi"); if (taimer) cancelAnimationFrame(taimer); taimer = null; }
    function mangi() {
      if (aastaAsendiks(olek.aasta) >= 0.999) maaraAasta(asendAastaks(0));
      olek.mangib = true; nupp.textContent = "❚❚"; nupp.setAttribute("aria-label", "Peata");
      let eelmine = performance.now();
      (function samm(t) {
        if (!olek.mangib) return;
        const dt = Math.max(0, t - eelmine); eelmine = t;
        const p = Math.min(1, aastaAsendiks(olek.aasta) + dt / (olek.aken ? 30000 : 40000));
        maaraAasta(asendAastaks(p), true);
        if (p >= 1) { peata(); return; }
        taimer = requestAnimationFrame(samm);
      })(eelmine);
    }
    nupp.addEventListener("click", () => olek.mangib ? peata() : mangi());

    // Vaated
    document.querySelectorAll("#vaated button").forEach(b => b.addEventListener("click", () => {
      document.querySelectorAll("#vaated button").forEach(x => x.classList.toggle("aktiivne", x === b));
      const rk = document.getElementById("riigikord"); rk.value = ""; rk.classList.remove("aktiivne");
      const v = b.dataset.vaade;
      if (b.dataset.aken) {
        // Ajaaken (nt 1918–1960): kitsendab ajajoont, riigikorra ribad venivad laiaks ja saavad nimed
        const [a0, a1] = b.dataset.aken.split("-").map(Number);
        valiAken([a0, a1 + 0.99], null);
        return;
      }
      if (olek.aken && v === "koik") valiAken(null, perioodidEl.querySelector("button"));
      kaart.flyToBounds(v === "koik" ? koikPiirid : VAATED[v], { ...polster(), duration: 1.2 });
    }));

    // Riigikorra valik: kitsendab ajajoone selle perioodi peale (lühikesed perioodid saavad pool aastat varu)
    const rkEl = document.getElementById("riigikord");
    AJASTUD.forEach(([a0, a1, nimi], i) => {
      const o = document.createElement("option");
      o.value = i; o.textContent = MENUU[i];
      rkEl.appendChild(o);
    });
    rkEl.addEventListener("change", () => {
      document.querySelectorAll("#vaated button").forEach(x => x.classList.remove("aktiivne"));
      if (rkEl.value === "") { valiAken(null, perioodidEl.querySelector("button")); rkEl.classList.remove("aktiivne"); return; }
      const [a0, a1] = AJASTUD[+rkEl.value];
      const lyhike = a1 - a0 < 3;
      valiAken([Math.max(ALGUS, lyhike ? a0 - 0.5 : a0), Math.min(LOPP, lyhike ? a1 + 0.5 : a1)], null);
      maaraAasta(Math.min(LOPP, a1 - 0.01));  // liugur perioodi lõppu, et riigikorra nimi oleks õige
      rkEl.classList.add("aktiivne");
    });

    if (window.innerWidth <= 760) document.getElementById("paneel").classList.add("peidetud");
    kaart.fitBounds(koikPiirid, polster());
    maaraAasta(LOPP);
  }
})();
