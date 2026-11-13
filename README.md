# Perekonna teekonnad 1799–2001

Interaktiivne kaart Weissi ja Maikowski liini, Veimrete ja Luhasalude ning Tulpide liikumistest: Kaliszist ja Schwarzburg-Sondershausenist (Tüüringi) Alavere, Jäneda ja Lehtse kõrtside kaudu Tallinnasse, Klooga ja Keila valla taludesse, Arnold Veimre teekond Sevurallagi laagrisse ning 1949. aasta küüditamine Krasnojarski kraisse ja Hakassiasse.

Kaart on tavaline staatiline veebileht (Leaflet), mis loeb andmed kaustast `data/`.

## Avaldamine GitHub Pagesis

1. Loo GitHubis uus repo, nt `sugupuu-kaart`.
2. Laadi üles kõik selle kausta failid (`index.html`, `kaart.css`, `kaart.js`, `README.md`, kaust `data/`).
3. Repo seadetes: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, haru `main`, kaust `/ (root)`.
4. Mõne minuti pärast on kaart aadressil `https://<kasutajanimi>.github.io/sugupuu-kaart/`.

**Privaatsus.** GitHub Pagesi leht on avalik ka siis, kui repo on privaatne (privaatsest repost avaldamiseks on vaja tasulist kontot). Kaardil on küüditamise, arreteerimise ja surma andmed. Elavate inimeste andmeid andmestikus ei ole.

## Vaatamine oma arvutis

Brauser ei luba `data/*.geojson` faile otse kettalt (`file://`) laadida. Käivita kaustas kohalik server:

```
python -m http.server
```

ja ava `http://localhost:8000`.

## Andmed

Kõik andmed on kolmes GeoJSON-failis (WGS84). Neid saab muuta tekstiredaktoris või QGIS-is.

| Fail | Sisu | Väljad |
|---|---|---|
| `data/kohad.geojson` | 18 kohta (punktid) | `id`, `nimi`, `tapsus` (`aadress`, `asula`, `rajoon`, `riik`), `markus` |
| `data/teekonnad.geojson` | 25 liikumist (jooned lähtekohast sihtkohta) | `id`, `grupp` (`weiss`, `veimre`, `tulp`), `liikumine` (`kolimine`, `valjaranne`, `teenistus`, `opingud`, `arreteerimine`, `kuuditamine`, `sundumberpaigutus`, `abiellumine`, `vabastamine`, `tagasitulek`), `isik`, `aeg` (kuvatav aeg), `aasta` (arv ajajoone jaoks), `kindlus` (`toendatud`, `osaliselt`, `oletus`), `tekst`, `allikas`, `lahtekoht`, `sihtkoht` |
| `data/sundmused.geojson` | 50 sündmust (sünd, abielu, surm jm); `geometry: null` = koht teadmata | `koht`, `aasta`, `kuupaev`, `grupp`, `isik`, `tekst`, `allikas` |

Teekonna kaar arvutatakse brauseris lähte- ja sihtkoha põhjal, joone kujul ei ole tähendust. Kui muudad koha koordinaate failis `kohad.geojson`, muuda samad koordinaadid ka `teekonnad.geojson` joonte otstes (kaart ise kasutab `kohad.geojson` koordinaate).

### Täpsus

- **rajoon**: teada on ainult piirkond. Polevoje küla, Saralinski rajooni asula „п. ЦЗЗ“, Šarõgino laagriosakond ja Keila valla talud ei ole tuvastatud; punkt on rajooni keskuses või üldkoordinaadil ja selle ümber on punktiirring.
- **Priiskovõi** koordinaat on ligikaudne (Priiskovoje küla Hakassias, u 3 km Glavstanist).
- **Schwarzburg-Sondershausen** on vürstiriik; punkt on pealinnas Sondershausenis. Sünnikoht on MyHeritage'i puust, Eesti allikatega kinnitamata.

### Kuupäevad

1918. aastani on kirikuraamatute kuupäevad vana kalendri (vkj) järgi, kui ei ole märgitud teisiti.

## Allikad

Iga teekonna ja sündmuse juures on viide (Rahvusarhiiv, Tallinna Linnaarhiiv, memoriaal.ee, MyHeritage). Peamised: ERAF.8SM.1.2729 (Heli Veimre asumistoimik), ERA.5078.1.10585 (Marie Weissi pärimistoimik), ERAF.130SM.1.323-1 (Arnold Veimre uurimistoimik), ERAF.3-N.1.1809 (Tulpide küüditamistoimik), TLA.1359.2.21 (Kaarli koguduse personaalraamat).

Aluskaart: Esri World Dark Gray Canvas (© Esri, HERE, Garmin, © OpenStreetMap); varuvariant tume OpenStreetMap.
