# Xogta Crypto 24/7 · Tallaabada 3

Website-ka xogta FED-ka iyo crypto, af-Soomaali. Aasaasaha: **Booskapro**.

## Waxa Tallaabada 1 ku jira
- **Bogga hore:** go'aannada FED (kii hore, kii u dambeeyay iyo kan xiga), tirinta waqtiga go'aanka xiga, xogtii u dambeysay iyo midda soo socota, iyo crypto live (ilbiriqsi kasta)
- **Fahanka FED:** koorso 8 cashar ah, silsiladda, Adag/Jilicsan iyo qaamuus
- **Ku saabsan:** Aasaasaha Booskapro iyo baraha bulshada
- **Midabka website-ka:** 5 midab, Mugdi/Iftiin/Auto iyo cabbirka qoraalka. Doorashada qof kasta waa la xasuustaa
- Bogagga **Wararka**, **Taariikhda FED** iyo **Bulshada** waa diyaar, waxaana la buuxin doonaa tallaabooyinka xiga

## Waxa Tallaabada 3 ku daray
- **`api/live.js`**: xogta degdegga ah, daqiiqad kasta
  - **Federal Reserve RSS:** bayaannada, siyaasadda lacagta iyo hadallada
  - **Bayaanka FOMC:** go'aanka dulsaarka waxaa laga akhriyaa bayaanka rasmiga ah isla daqiiqadda la daabaco (FRED wuxuu qaataa 1 maalin)
  - **Kalshi:** fursadaha go'aanka FED ee xiga (suuq saadaal oo sharci ah)
- **Warbixinta tooska ah (bogga hore + Wararka):** qoraallo af-Soomaali ah oo si toos ah u soo baxa marka xog cusub timaado: go'aanka FOMC, fursadaha, CPI, shaqada iyo bonds-ka. Tirooyinka oo dhan waxay ka yimaadaan isha, agent-kuna kaliya qoraalka ayuu diyaariyaa
- **Filashada:** cabbirka Adag/Jilicsan iyo fursadaha go'aanka xiga
- **Wararka:** bayaannada Federal Reserve oo la kala shaandhayn karo
- Boggu wuxuu is cusbooneysiiyaa daqiiqad kasta, adigoon refresh samayn

## Waxa Tallaabada 2 ku daray
- **Xogta FED oo toos ah:** `api/fed.js` waa server yar oo Vercel ku shaqaysiiyo. Wuxuu xogta ka soo qaadaa FRED (bilaash, key la'aan), waxaana la cusbooneysiiyaa 15-kii daqiiqo
- **Bogga hore:** dulsaarka hadda, go'aannada (kii hore, kii u dambeeyay iyo kan xiga) iyo xogtii u dambeysay (CPI, shaqo la'aan, NFP, 10Y, 2Y), dhammaantood si toos ah isu cusbooneysiiya
- **Taariikhda FED:** sannadaha 1954 ilaa maanta → taabo sannad → bilaha (kor u qaadis, dhimis, hayn) → soo koobid, chart iyo shax. Link toos ah ayaa sannad kasta loo diri karaa: `/taariikhda#2010` ama `/taariikhda#2022-06`
- `data/fed.js`: jadwalka shirarka FOMC (2022–2027) iyo xogta soo socota. **Sannad kasta, ku dar shirarka cusub** ee FED-ku daabaco

## Faylasha
| Fayl / gal | Shaqadiisa |
|---|---|
| `index.html` | Bogga hore |
| `fahanka-fed.html` | Koorsada FED |
| `ku-saabsan.html` | Ku saabsan + Aasaasaha |
| `wararka.html`, `taariikhda.html` | Wararka iyo Taariikhda FED |
| `css/style.css` | Naqshadda iyo midabada |
| `js/config.js` | **Macluumaadkaaga**: magaca, sawirka, baraha bulshada, email |
| `js/layout.js` | Header, footer iyo beddelka midabka |
| `js/home.js` | Xogta FED iyo crypto live |
| `js/fed-core.js` | Qalabka xogta FED |
| `js/taariikhda.js` | Bogga Taariikhda FED |
| `api/fed.js` | Server-ka xogta FED (FRED) |
| `api/live.js` | Server-ka xogta live (Fed RSS, FOMC, Kalshi) |
| `js/live.js` | AI Agent, Filashada iyo Wararka |
| `data/fed.js` | Jadwalka shirarka FOMC iyo xogta soo socota |
| `vercel.json` | Habaynta Vercel |

## Sida aad ugu darto baraha bulshada
Fur `js/config.js`, kadibna link-gaaga ku qor meesha ku habboon:
```
social: {
  x: "https://x.com/MAGACAAGA",
  telegram: "https://t.me/MAGACAAGA",
  ...
}
```
Link-ga madhan si toos ah ayuu u qarsoomayaa.

## Sida internet-ka loo geliyo
1. **GitHub** → **New repository** → magac: `xogta-crypto-247` → **Create repository**
2. Riix **uploading an existing file**, kadibna ku jiid **dhammaan faylasha iyo galalka** ku jira galkan (ha ku jiidin galka laftiisa) → **Commit changes**
3. **Vercel** → **Add New → Project** → dooro `xogta-crypto-247` → **Deploy**
4. 1 daqiiqo kadib: `xogta-crypto-247.vercel.app` 🎉

Mar kasta oo aad fayl ku beddesho GitHub, Vercel si toos ah ayuu website-ka u cusbooneysiinayaa.

## Ilaha xogta (dhammaan bilaash)
Binance · CoinGecko · Alternative.me · FRED (Federal Reserve Bank of St. Louis) · Federal Reserve · BLS · Kalshi

---
Tani ma aha talo maaliyadeed.
