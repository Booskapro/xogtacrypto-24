/* =========================================================
   Jadwalka FED (gacan lagu geliyay, laga soo xigtay federalreserve.gov)
   - meetings: shirarka FOMC (taariikhda go'aanka, 14:00 New York)
   - upcoming: xogta muhiimka ah ee soo socota (BLS)
   - fallback: xog la hubiyay oo la muujiyo KALIYA haddii /api/fed la waayo
   Tirooyinka kale oo dhan waxay si toos ah uga imanayaan FRED (/api/fed).
   Sannad kasta, ku dar shirarka cusub ee FED-ku daabaco.
   ========================================================= */
window.FED_CAL = {
 "meetings": [
  {
   "date": "2022-01-26",
   "time": "2022-01-26T14:00:00-05:00",
   "sep": false
  },
  {
   "date": "2022-03-16",
   "time": "2022-03-16T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2022-05-04",
   "time": "2022-05-04T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2022-06-15",
   "time": "2022-06-15T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2022-07-27",
   "time": "2022-07-27T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2022-09-21",
   "time": "2022-09-21T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2022-11-02",
   "time": "2022-11-02T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2022-12-14",
   "time": "2022-12-14T14:00:00-05:00",
   "sep": true
  },
  {
   "date": "2023-02-01",
   "time": "2023-02-01T14:00:00-05:00",
   "sep": false
  },
  {
   "date": "2023-03-22",
   "time": "2023-03-22T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2023-05-03",
   "time": "2023-05-03T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2023-06-14",
   "time": "2023-06-14T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2023-07-26",
   "time": "2023-07-26T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2023-09-20",
   "time": "2023-09-20T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2023-11-01",
   "time": "2023-11-01T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2023-12-13",
   "time": "2023-12-13T14:00:00-05:00",
   "sep": true
  },
  {
   "date": "2024-01-31",
   "time": "2024-01-31T14:00:00-05:00",
   "sep": false
  },
  {
   "date": "2024-03-20",
   "time": "2024-03-20T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2024-05-01",
   "time": "2024-05-01T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2024-06-12",
   "time": "2024-06-12T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2024-07-31",
   "time": "2024-07-31T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2024-09-18",
   "time": "2024-09-18T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2024-11-07",
   "time": "2024-11-07T14:00:00-05:00",
   "sep": false
  },
  {
   "date": "2024-12-18",
   "time": "2024-12-18T14:00:00-05:00",
   "sep": true
  },
  {
   "date": "2025-01-29",
   "time": "2025-01-29T14:00:00-05:00",
   "sep": false
  },
  {
   "date": "2025-03-19",
   "time": "2025-03-19T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2025-05-07",
   "time": "2025-05-07T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2025-06-18",
   "time": "2025-06-18T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2025-07-30",
   "time": "2025-07-30T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2025-09-17",
   "time": "2025-09-17T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2025-10-29",
   "time": "2025-10-29T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2025-12-10",
   "time": "2025-12-10T14:00:00-05:00",
   "sep": true
  },
  {
   "date": "2026-01-28",
   "time": "2026-01-28T14:00:00-05:00",
   "sep": false
  },
  {
   "date": "2026-03-18",
   "time": "2026-03-18T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2026-04-29",
   "time": "2026-04-29T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2026-06-17",
   "time": "2026-06-17T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2026-07-29",
   "time": "2026-07-29T14:00:00-04:00",
   "sep": false,
   "vote": "9–3"
  },
  {
   "date": "2026-09-16",
   "time": "2026-09-16T14:00:00-04:00",
   "sep": true,
   "vote": "12–0"
  },
  {
   "date": "2026-10-28",
   "time": "2026-10-28T14:00:00-04:00",
   "sep": false,
   "vote": "10–2"
  },
  {
   "date": "2026-12-09",
   "time": "2026-12-09T14:00:00-05:00",
   "sep": true
  },
  {
   "date": "2027-01-27",
   "time": "2027-01-27T14:00:00-05:00",
   "sep": false
  },
  {
   "date": "2027-03-17",
   "time": "2027-03-17T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2027-04-28",
   "time": "2027-04-28T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2027-06-09",
   "time": "2027-06-09T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2027-07-28",
   "time": "2027-07-28T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2027-09-15",
   "time": "2027-09-15T14:00:00-04:00",
   "sep": true
  },
  {
   "date": "2027-10-27",
   "time": "2027-10-27T14:00:00-04:00",
   "sep": false
  },
  {
   "date": "2027-12-08",
   "time": "2027-12-08T14:00:00-05:00",
   "sep": true
  }
 ],
 "upcoming": [
  {
   "name": "Shaqooyinka (NFP) · Desember 2025",
   "name_en": "Jobs report (NFP) · December 2025",
   "time": "2026-01-09T08:30:00-05:00",
   "period": "2025-12",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Sicir-bararka (CPI) · Desember 2025",
   "name_en": "Inflation (CPI) · December 2025",
   "time": "2026-01-13T08:30:00-05:00",
   "period": "2025-12",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Qiimaha soo-saarayaasha (PPI) · Nofembar 2025",
   "name_en": "Producer prices (PPI) · November 2025",
   "time": "2026-01-14T08:30:00-05:00",
   "period": "2025-11",
   "kind": "infl",
   "lvl": 2,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/ppi.htm",
   "code": "ppi",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Iibka tafaariiqda (Retail Sales) · Nofembar 2025",
   "name_en": "Retail sales · November 2025",
   "time": "2026-01-14T08:30:00-05:00",
   "period": "2025-11",
   "kind": "growth",
   "lvl": 2,
   "src": "Census",
   "url": "https://census.gov/retail/release_schedule.html",
   "code": "retail",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Qiimaha soo-saarayaasha (PPI) · Desember 2025",
   "name_en": "Producer prices (PPI) · December 2025",
   "time": "2026-01-30T08:30:00-05:00",
   "period": "2025-12",
   "kind": "infl",
   "lvl": 2,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/ppi.htm",
   "code": "ppi",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Iibka tafaariiqda (Retail Sales) · Desember 2025",
   "name_en": "Retail sales · December 2025",
   "time": "2026-02-10T08:30:00-05:00",
   "period": "2025-12",
   "kind": "growth",
   "lvl": 2,
   "src": "Census",
   "url": "https://census.gov/retail/release_schedule.html",
   "code": "retail",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Shaqooyinka (NFP) · Janaayo",
   "name_en": "Jobs report (NFP) · January",
   "time": "2026-02-11T08:30:00-05:00",
   "period": "2026-01",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Sicir-bararka (CPI) · Janaayo",
   "name_en": "Inflation (CPI) · January",
   "time": "2026-02-13T08:30:00-05:00",
   "period": "2026-01",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Shaqooyinka (NFP) · Febraayo",
   "name_en": "Jobs report (NFP) · February",
   "time": "2026-03-06T08:30:00-05:00",
   "period": "2026-02",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Iibka tafaariiqda (Retail Sales) · Janaayo",
   "name_en": "Retail sales · January",
   "time": "2026-03-06T08:30:00-05:00",
   "period": "2026-01",
   "kind": "growth",
   "lvl": 2,
   "src": "Census",
   "url": "https://census.gov/retail/release_schedule.html",
   "code": "retail",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Sicir-bararka (CPI) · Febraayo",
   "name_en": "Inflation (CPI) · February",
   "time": "2026-03-11T08:30:00-04:00",
   "period": "2026-02",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Iibka tafaariiqda (Retail Sales) · Febraayo",
   "name_en": "Retail sales · February",
   "time": "2026-04-01T08:30:00-04:00",
   "period": "2026-02",
   "kind": "growth",
   "lvl": 2,
   "src": "Census",
   "url": "https://census.gov/retail/release_schedule.html",
   "code": "retail",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Shaqooyinka (NFP) · Maarso",
   "name_en": "Jobs report (NFP) · March",
   "time": "2026-04-03T08:30:00-04:00",
   "period": "2026-03",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Sicir-bararka (CPI) · Maarso",
   "name_en": "Inflation (CPI) · March",
   "time": "2026-04-10T08:30:00-04:00",
   "period": "2026-03",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Iibka tafaariiqda (Retail Sales) · Maarso",
   "name_en": "Retail sales · March",
   "time": "2026-04-21T08:30:00-04:00",
   "period": "2026-03",
   "kind": "growth",
   "lvl": 2,
   "src": "Census",
   "url": "https://census.gov/retail/release_schedule.html",
   "code": "retail",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Shaqooyinka (NFP) · Abriil",
   "name_en": "Jobs report (NFP) · April",
   "time": "2026-05-08T08:30:00-04:00",
   "period": "2026-04",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Sicir-bararka (CPI) · Abriil",
   "name_en": "Inflation (CPI) · April",
   "time": "2026-05-12T08:30:00-04:00",
   "period": "2026-04",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Qiimaha soo-saarayaasha (PPI) · Abriil",
   "name_en": "Producer prices (PPI) · April",
   "time": "2026-05-13T08:30:00-04:00",
   "period": "2026-04",
   "kind": "infl",
   "lvl": 2,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/ppi.htm",
   "code": "ppi",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Iibka tafaariiqda (Retail Sales) · Abriil",
   "name_en": "Retail sales · April",
   "time": "2026-05-14T08:30:00-04:00",
   "period": "2026-04",
   "kind": "growth",
   "lvl": 2,
   "src": "Census",
   "url": "https://census.gov/retail/release_schedule.html",
   "code": "retail",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Shaqooyinka (NFP) · Maajo",
   "name_en": "Jobs report (NFP) · May",
   "time": "2026-06-05T08:30:00-04:00",
   "period": "2026-05",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Sicir-bararka (CPI) · Maajo",
   "name_en": "Inflation (CPI) · May",
   "time": "2026-06-10T08:30:00-04:00",
   "period": "2026-05",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Qiimaha soo-saarayaasha (PPI) · Maajo",
   "name_en": "Producer prices (PPI) · May",
   "time": "2026-06-11T08:30:00-04:00",
   "period": "2026-05",
   "kind": "infl",
   "lvl": 2,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/ppi.htm",
   "code": "ppi",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Iibka tafaariiqda (Retail Sales) · Maajo",
   "name_en": "Retail sales · May",
   "time": "2026-06-17T08:30:00-04:00",
   "period": "2026-05",
   "kind": "growth",
   "lvl": 2,
   "src": "Census",
   "url": "https://census.gov/retail/release_schedule.html",
   "code": "retail",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Shaqooyinka (NFP) · Juun",
   "name_en": "Jobs report (NFP) · June",
   "time": "2026-07-02T08:30:00-04:00",
   "period": "2026-06",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Sicir-bararka (CPI) · Juun",
   "name_en": "Inflation (CPI) · June",
   "time": "2026-07-14T08:30:00-04:00",
   "period": "2026-06",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Qiimaha soo-saarayaasha (PPI) · Juun",
   "name_en": "Producer prices (PPI) · June",
   "time": "2026-07-15T08:30:00-04:00",
   "period": "2026-06",
   "kind": "infl",
   "lvl": 2,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/ppi.htm",
   "code": "ppi",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Iibka tafaariiqda (Retail Sales) · Juun",
   "name_en": "Retail sales · June",
   "time": "2026-07-16T08:30:00-04:00",
   "period": "2026-06",
   "kind": "growth",
   "lvl": 2,
   "src": "Census",
   "url": "https://census.gov/retail/release_schedule.html",
   "code": "retail",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Shaqooyinka (NFP) · Luulyo",
   "name_en": "Jobs report (NFP) · July",
   "time": "2026-08-07T08:30:00-04:00",
   "period": "2026-07",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Sicir-bararka (CPI) · Luulyo",
   "name_en": "Inflation (CPI) · July",
   "time": "2026-08-12T08:30:00-04:00",
   "period": "2026-07",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Qiimaha soo-saarayaasha (PPI) · Luulyo",
   "name_en": "Producer prices (PPI) · July",
   "time": "2026-08-13T08:30:00-04:00",
   "period": "2026-07",
   "kind": "infl",
   "lvl": 2,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/ppi.htm",
   "code": "ppi",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Iibka tafaariiqda (Retail Sales) · Luulyo",
   "name_en": "Retail sales · July",
   "time": "2026-08-14T08:30:00-04:00",
   "period": "2026-07",
   "kind": "growth",
   "lvl": 2,
   "src": "Census",
   "url": "https://census.gov/retail/release_schedule.html",
   "code": "retail",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Shaqooyinka (NFP) · Ogosto",
   "name_en": "Jobs report (NFP) · August",
   "time": "2026-09-04T08:30:00-04:00",
   "period": "2026-08",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Qiimaha soo-saarayaasha (PPI) · Ogosto",
   "name_en": "Producer prices (PPI) · August",
   "time": "2026-09-10T08:30:00-04:00",
   "period": "2026-08",
   "kind": "infl",
   "lvl": 2,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/ppi.htm",
   "code": "ppi",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Sicir-bararka (CPI) · Ogosto",
   "name_en": "Inflation (CPI) · August",
   "time": "2026-09-11T08:30:00-04:00",
   "period": "2026-08",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Iibka tafaariiqda (Retail Sales) · Ogosto",
   "name_en": "Retail sales · August",
   "time": "2026-09-16T08:30:00-04:00",
   "period": "2026-08",
   "kind": "growth",
   "lvl": 2,
   "src": "Census",
   "url": "https://census.gov/retail/release_schedule.html",
   "code": "retail",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Shaqooyinka (NFP) · Sebtember",
   "name_en": "Jobs report (NFP) · September",
   "time": "2026-10-02T08:30:00-04:00",
   "period": "2026-09",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Sicir-bararka (CPI) · Sebtember",
   "name_en": "Inflation (CPI) · September",
   "time": "2026-10-14T08:30:00-04:00",
   "period": "2026-09",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi",
   "impact": "Aad u sare",
   "impact_en": "Very high"
  },
  {
   "name": "Qiimaha soo-saarayaasha (PPI) · Sebtember",
   "name_en": "Producer prices (PPI) · September",
   "time": "2026-10-15T08:30:00-04:00",
   "period": "2026-09",
   "kind": "infl",
   "lvl": 2,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/ppi.htm",
   "code": "ppi",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Iibka tafaariiqda (Retail Sales) · Sebtember",
   "name_en": "Retail sales · September",
   "time": "2026-10-15T08:30:00-04:00",
   "period": "2026-09",
   "kind": "growth",
   "lvl": 2,
   "src": "Census",
   "url": "https://census.gov/retail/release_schedule.html",
   "code": "retail",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Shaqooyinka (NFP) · Oktoobar",
   "name_en": "Jobs report (NFP) · October",
   "time": "2026-11-06T08:30:00-05:00",
   "period": "2026-10",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp"
  },
  {
   "name": "Sicir-bararka (CPI) · Oktoobar",
   "name_en": "Inflation (CPI) · October",
   "time": "2026-11-10T08:30:00-05:00",
   "period": "2026-10",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi"
  },
  {
   "name": "Codsiyada shaqo la'aanta (toddobaadle)",
   "name_en": "Initial jobless claims (weekly)",
   "time": "2026-11-12T08:30:00-05:00",
   "kind": "jobs",
   "lvl": 1,
   "src": "U.S. Dept. of Labor",
   "url": "https://www.dol.gov/ui/data.pdf",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "Qiimaha soo-saarayaasha (PPI) · Oktoobar",
   "name_en": "Producer prices (PPI) · October",
   "time": "2026-11-13T08:30:00-05:00",
   "kind": "infl",
   "lvl": 2,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/ppi.htm",
   "impact": "Sare",
   "impact_en": "High",
   "period": "2026-10"
  },
  {
   "name": "Iibka tafaariiqda (Retail Sales) · Oktoobar",
   "name_en": "Retail sales · October",
   "time": "2026-11-17T08:30:00-05:00",
   "kind": "growth",
   "lvl": 2,
   "src": "Census",
   "url": "https://www.census.gov/retail/release_schedule.html",
   "impact": "Sare",
   "impact_en": "High",
   "period": "2026-10"
  },
  {
   "name": "Qoraalka shirka FED (FOMC Minutes) · Oktoobar",
   "name_en": "FOMC minutes · October meeting",
   "time": "2026-11-18T14:00:00-05:00",
   "kind": "fed",
   "lvl": 2,
   "src": "Federal Reserve",
   "url": "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Codsiyada shaqo la'aanta (toddobaadle)",
   "name_en": "Initial jobless claims (weekly)",
   "time": "2026-11-19T08:30:00-05:00",
   "kind": "jobs",
   "lvl": 1,
   "src": "U.S. Dept. of Labor",
   "url": "https://www.dol.gov/ui/data.pdf",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "Kalsoonida macaamiisha (UMich) · Nofembar, kama dambays",
   "name_en": "Consumer sentiment (UMich) · November final",
   "time": "2026-11-20T10:00:00-05:00",
   "kind": "growth",
   "lvl": 1,
   "src": "Univ. of Michigan",
   "url": "https://www.sca.isr.umich.edu/",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "Sicir-bararka PCE · Oktoobar (cabbirka Fed-ka)",
   "name_en": "PCE inflation · October (the Fed's gauge)",
   "time": "2026-11-25T08:30:00-05:00",
   "kind": "infl",
   "lvl": 3,
   "src": "BEA",
   "url": "https://www.bea.gov/news/schedule",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "period": "2026-10"
  },
  {
   "name": "Koboca dhaqaalaha (GDP) · Q3, qiyaasta 2aad",
   "name_en": "GDP · Q3 second estimate",
   "time": "2026-11-25T08:30:00-05:00",
   "kind": "growth",
   "lvl": 2,
   "src": "BEA",
   "url": "https://www.bea.gov/news/schedule",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Beige Book (warbixinta gobollada Fed)",
   "name_en": "Beige Book (Fed regional report)",
   "time": "2026-11-25T14:00:00-05:00",
   "kind": "fed",
   "lvl": 1,
   "src": "Federal Reserve",
   "url": "https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "Shaqooyinka bannaan (JOLTS) · Oktoobar",
   "name_en": "Job openings (JOLTS) · October",
   "time": "2026-12-01T10:00:00-05:00",
   "kind": "jobs",
   "lvl": 2,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/jolts.htm",
   "impact": "Sare",
   "impact_en": "High",
   "period": "2026-10"
  },
  {
   "name": "ISM Warshadaha (PMI) · Nofembar",
   "name_en": "ISM Manufacturing PMI · November",
   "time": "2026-12-01T10:00:00-05:00",
   "kind": "growth",
   "lvl": 2,
   "src": "ISM",
   "url": "https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Codsiyada shaqo la'aanta (toddobaadle)",
   "name_en": "Initial jobless claims (weekly)",
   "time": "2026-12-03T08:30:00-05:00",
   "kind": "jobs",
   "lvl": 1,
   "src": "U.S. Dept. of Labor",
   "url": "https://www.dol.gov/ui/data.pdf",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "ISM Adeegyada (PMI) · Nofembar",
   "name_en": "ISM Services PMI · November",
   "time": "2026-12-03T10:00:00-05:00",
   "kind": "growth",
   "lvl": 2,
   "src": "ISM",
   "url": "https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Shaqooyinka (NFP) · Nofembar",
   "name_en": "Jobs report (NFP) · November",
   "time": "2026-12-04T08:30:00-05:00",
   "period": "2026-11",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp"
  },
  {
   "name": "Kalsoonida macaamiisha (UMich) · Desember, hordhac",
   "name_en": "Consumer sentiment (UMich) · December prelim",
   "time": "2026-12-04T10:00:00-05:00",
   "kind": "growth",
   "lvl": 1,
   "src": "Univ. of Michigan",
   "url": "https://www.sca.isr.umich.edu/",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "Sicir-bararka (CPI) · Nofembar",
   "name_en": "Inflation (CPI) · November",
   "time": "2026-12-10T08:30:00-05:00",
   "period": "2026-11",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi"
  },
  {
   "name": "Codsiyada shaqo la'aanta (toddobaadle)",
   "name_en": "Initial jobless claims (weekly)",
   "time": "2026-12-10T08:30:00-05:00",
   "kind": "jobs",
   "lvl": 1,
   "src": "U.S. Dept. of Labor",
   "url": "https://www.dol.gov/ui/data.pdf",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "Qiimaha soo-saarayaasha (PPI) · Nofembar",
   "name_en": "Producer prices (PPI) · November",
   "time": "2026-12-15T08:30:00-05:00",
   "kind": "infl",
   "lvl": 2,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/ppi.htm",
   "impact": "Sare",
   "impact_en": "High",
   "period": "2026-11"
  },
  {
   "name": "Iibka tafaariiqda (Retail Sales) · Nofembar",
   "name_en": "Retail sales · November",
   "time": "2026-12-16T08:30:00-05:00",
   "kind": "growth",
   "lvl": 2,
   "src": "Census",
   "url": "https://www.census.gov/retail/release_schedule.html",
   "impact": "Sare",
   "impact_en": "High",
   "period": "2026-11"
  },
  {
   "name": "Codsiyada shaqo la'aanta (toddobaadle)",
   "name_en": "Initial jobless claims (weekly)",
   "time": "2026-12-17T08:30:00-05:00",
   "kind": "jobs",
   "lvl": 1,
   "src": "U.S. Dept. of Labor",
   "url": "https://www.dol.gov/ui/data.pdf",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "Kalsoonida macaamiisha (UMich) · Desember, kama dambays",
   "name_en": "Consumer sentiment (UMich) · December final",
   "time": "2026-12-18T10:00:00-05:00",
   "kind": "growth",
   "lvl": 1,
   "src": "Univ. of Michigan",
   "url": "https://www.sca.isr.umich.edu/",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "Sicir-bararka PCE · Nofembar (cabbirka Fed-ka)",
   "name_en": "PCE inflation · November (the Fed's gauge)",
   "time": "2026-12-23T08:30:00-05:00",
   "kind": "infl",
   "lvl": 3,
   "src": "BEA",
   "url": "https://www.bea.gov/news/schedule",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "period": "2026-11"
  },
  {
   "name": "Koboca dhaqaalaha (GDP) · Q3, qiyaasta 3aad",
   "name_en": "GDP · Q3 third estimate",
   "time": "2026-12-23T08:30:00-05:00",
   "kind": "growth",
   "lvl": 2,
   "src": "BEA",
   "url": "https://www.bea.gov/news/schedule",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Qoraalka shirka FED (FOMC Minutes) · Desember",
   "name_en": "FOMC minutes · December meeting",
   "time": "2026-12-30T14:00:00-05:00",
   "kind": "fed",
   "lvl": 2,
   "src": "Federal Reserve",
   "url": "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Codsiyada shaqo la'aanta (toddobaadle)",
   "name_en": "Initial jobless claims (weekly)",
   "time": "2027-01-07T08:30:00-05:00",
   "kind": "jobs",
   "lvl": 1,
   "src": "U.S. Dept. of Labor",
   "url": "https://www.dol.gov/ui/data.pdf",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "Shaqooyinka (NFP) · Desember 2026",
   "name_en": "Jobs report (NFP) · December 2026",
   "time": "2027-01-08T08:30:00-05:00",
   "period": "2026-12",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp"
  },
  {
   "name": "Sicir-bararka (CPI) · Desember 2026",
   "name_en": "Inflation (CPI) · December 2026",
   "time": "2027-01-13T08:30:00-05:00",
   "period": "2026-12",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi"
  },
  {
   "name": "Beige Book (warbixinta gobollada Fed)",
   "name_en": "Beige Book (Fed regional report)",
   "time": "2027-01-13T14:00:00-05:00",
   "kind": "fed",
   "lvl": 1,
   "src": "Federal Reserve",
   "url": "https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "Qiimaha soo-saarayaasha (PPI) · Desember 2026",
   "name_en": "Producer prices (PPI) · December 2026",
   "time": "2027-01-14T08:30:00-05:00",
   "kind": "infl",
   "lvl": 2,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/ppi.htm",
   "impact": "Sare",
   "impact_en": "High",
   "period": "2026-12"
  },
  {
   "name": "Codsiyada shaqo la'aanta (toddobaadle)",
   "name_en": "Initial jobless claims (weekly)",
   "time": "2027-01-14T08:30:00-05:00",
   "kind": "jobs",
   "lvl": 1,
   "src": "U.S. Dept. of Labor",
   "url": "https://www.dol.gov/ui/data.pdf",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "Codsiyada shaqo la'aanta (toddobaadle)",
   "name_en": "Initial jobless claims (weekly)",
   "time": "2027-01-21T08:30:00-05:00",
   "kind": "jobs",
   "lvl": 1,
   "src": "U.S. Dept. of Labor",
   "url": "https://www.dol.gov/ui/data.pdf",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "Codsiyada shaqo la'aanta (toddobaadle)",
   "name_en": "Initial jobless claims (weekly)",
   "time": "2027-01-28T08:30:00-05:00",
   "kind": "jobs",
   "lvl": 1,
   "src": "U.S. Dept. of Labor",
   "url": "https://www.dol.gov/ui/data.pdf",
   "impact": "Dhexdhexaad",
   "impact_en": "Medium"
  },
  {
   "name": "Kharashka shaqaalaha (ECI) · Q4 2026",
   "name_en": "Employment cost index (ECI) · Q4 2026",
   "time": "2027-01-29T08:30:00-05:00",
   "kind": "jobs",
   "lvl": 2,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/eci.htm",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Shaqooyinka (NFP) · Janaayo",
   "name_en": "Jobs report (NFP) · January",
   "time": "2027-02-05T08:30:00-05:00",
   "period": "2027-01",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp"
  },
  {
   "name": "Sicir-bararka (CPI) · Janaayo",
   "name_en": "Inflation (CPI) · January",
   "time": "2027-02-11T08:30:00-05:00",
   "period": "2027-01",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi"
  },
  {
   "name": "Shaqooyinka (NFP) · Febraayo",
   "name_en": "Jobs report (NFP) · February",
   "time": "2027-03-05T08:30:00-05:00",
   "period": "2027-02",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp"
  },
  {
   "name": "Sicir-bararka (CPI) · Febraayo",
   "name_en": "Inflation (CPI) · February",
   "time": "2027-03-10T08:30:00-05:00",
   "period": "2027-02",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi"
  },
  {
   "name": "Shaqooyinka (NFP) · Maarso",
   "name_en": "Jobs report (NFP) · March",
   "time": "2027-04-02T08:30:00-04:00",
   "period": "2027-03",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp"
  },
  {
   "name": "Sicir-bararka (CPI) · Maarso",
   "name_en": "Inflation (CPI) · March",
   "time": "2027-04-13T08:30:00-04:00",
   "period": "2027-03",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi"
  },
  {
   "name": "Shaqooyinka (NFP) · Abriil",
   "name_en": "Jobs report (NFP) · April",
   "time": "2027-05-07T08:30:00-04:00",
   "period": "2027-04",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "jobs",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/empsit.htm",
   "code": "nfp"
  },
  {
   "name": "Sicir-bararka (CPI) · Abriil",
   "name_en": "Inflation (CPI) · April",
   "time": "2027-05-12T08:30:00-04:00",
   "period": "2027-04",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi"
  },
  {
   "name": "Sicir-bararka (CPI) · Maajo",
   "name_en": "Inflation (CPI) · May",
   "time": "2027-06-10T08:30:00-04:00",
   "period": "2027-05",
   "impact": "Aad u sare",
   "impact_en": "Very high",
   "kind": "infl",
   "lvl": 3,
   "src": "BLS",
   "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
   "code": "cpi"
  }
 ],
 "fallback": {
  "checked": "2026-11-06",
  "current_range": "3.75–4.00%",
  "previous": {
   "date": "2026-09-16",
   "action": "hike",
   "change": "+0.25%",
   "from": "3.50–3.75%",
   "to": "3.75–4.00%"
  },
  "last": {
   "date": "2026-10-28",
   "action": "hold",
   "to": "3.75–4.00%"
  },
  "latest": [
   {
    "name": "Shaqooyinka (NFP) · Oktoobar",
    "name_en": "Jobs report (NFP) · October",
    "value": "+165K",
    "detail": "Kii hore: +60K",
    "detail_en": "Previous: +60K",
    "source": "BLS",
    "url": "https://www.bls.gov/news.release/empsit.nr0.htm"
   },
   {
    "name": "Shaqo la'aanta · Oktoobar",
    "name_en": "Unemployment · October",
    "value": "4.1%",
    "detail": "Kii hore: 4.2%",
    "detail_en": "Previous: 4.2%",
    "source": "BLS",
    "url": "https://www.bls.gov/news.release/empsit.nr0.htm"
   },
   {
    "name": "Sicir-bararka (CPI) · Sebtember",
    "name_en": "Inflation (CPI) · September",
    "value": "3.7%",
    "detail": "Kii hore: 3.4%",
    "detail_en": "Previous: 3.4%",
    "source": "BLS",
    "url": "https://www.bls.gov/cpi/"
   }
  ]
 }
};
