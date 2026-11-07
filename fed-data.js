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
   "name": "Shaqooyinka (NFP) · Oktoobar",
   "name_en": "Jobs report (NFP) · October",
   "time": "2026-11-06T08:30:00-05:00",
   "period": "2026-10",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Sicir-bararka (CPI) · Oktoobar",
   "name_en": "Inflation (CPI) · October",
   "time": "2026-11-10T08:30:00-05:00",
   "period": "2026-10",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Shaqooyinka (NFP) · Nofembar",
   "name_en": "Jobs report (NFP) · November",
   "time": "2026-12-04T08:30:00-05:00",
   "period": "2026-11",
   "impact": "Sare",
   "impact_en": "High"
  },
  {
   "name": "Sicir-bararka (CPI) · Nofembar",
   "name_en": "Inflation (CPI) · November",
   "time": "2026-12-10T08:30:00-05:00",
   "period": "2026-11",
   "impact": "Sare",
   "impact_en": "High"
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
