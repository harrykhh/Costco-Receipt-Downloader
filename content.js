// content.js — Costco Receipt Downloader (XHR + Full Query, CORS Fixed)
(() => {
  if (window.crd) return; window.crd = true;

  const fmt = d => new Date(d).toLocaleDateString("en-US", {year:"numeric",month:"2-digit",day:"2-digit"});
  const startDate = () => localStorage.crdDate || (d => (d.setFullYear(d.getFullYear()-3), d.toISOString().slice(0,10)))(new Date());

  const inject = () => {
    if (document.getElementById("crd")) return;

    const card = document.querySelector('[automation-id="titleMyOrders"], [data-testid="Orders & Purchases"]')?.closest("a, div")?.closest(".MuiGrid-item, div");
    if (!card) return;

    const panel = document.createElement("div");
    panel.id = "crd";
    panel.innerHTML = `<div style="margin:32px 0;padding:20px;background:#f8f9fa;border:1px solid #ddd;border-radius:12px;font-family:system-ui">
      <h3 style="margin:0 0 12px;font-size:19px">Receipt Downloader</h3>
      <input id="crd-in" type="date" value="${startDate()}" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ccc;border-radius:6px">
      <button id="crd-btn" style="width:100%;padding:12px;background:#0067b8;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer">
        Download as JSON
      </button>
      <div id="crd-stat" style="margin-top:8px;font-size:13px;text-align:center"></div>
    </div>`;

    card.after(panel);

    const input = panel.querySelector("#crd-in");
    input.onchange = () => localStorage.crdDate = input.value;

    const query = `query receipts($startDate: String!, $endDate: String!) { receipts(startDate: $startDate, endDate: $endDate) { warehouseName documentType transactionDateTime transactionDate companyNumber warehouseNumber operatorNumber warehouseShortName registerNumber transactionNumber transactionType transactionBarcode total warehouseAddress1 warehouseAddress2 warehouseCity warehouseState warehouseCountry warehousePostalCode totalItemCount subTotal taxes total itemArray { itemNumber itemDescription01 frenchItemDescription1 itemDescription02 frenchItemDescription2 itemIdentifier unit amount taxFlag merchantID entryMethod } tenderArray { tenderTypeCode tenderDescription amountTender displayAccountNumber sequenceNumber approvalNumber responseCode transactionID merchantID entryMethod } couponArray { upcnumberCoupon voidflagCoupon refundflagCoupon taxflagCoupon amountCoupon } subTaxes { tax1 tax2 tax3 tax4 aTaxPercent aTaxLegend aTaxAmount bTaxPercent bTaxLegend bTaxAmount cTaxPercent cTaxLegend cTaxAmount dTaxAmount } instantSavings membershipNumber } }`.replace(/\s+/g,' ');

    panel.querySelector("#crd-btn").onclick = () => new Promise((resolve, reject) => {
      const btn = panel.querySelector("#crd-btn");
      const stat = panel.querySelector("#crd-stat");
      btn.disabled = true; btn.textContent = "Fetching...";

      const xhr = new XMLHttpRequest();
      xhr.responseType = 'json';
      xhr.open('POST', 'https://ecom-api.costco.com/ebusiness/order/v1/orders/graphql');
      xhr.setRequestHeader('Content-Type', 'application/json-patch+json');
      xhr.setRequestHeader('Costco.Env', 'ecom');
      xhr.setRequestHeader('Costco.Service', 'restOrders');
      xhr.setRequestHeader('Costco-X-Wcs-Clientid', localStorage.clientID || '');
      xhr.setRequestHeader('Client-Identifier', '481b1aec-aa3b-454b-b81b-48187e28f205');
      xhr.setRequestHeader('Costco-X-Authorization', 'Bearer ' + (localStorage.idToken || ''));

      const vars = { startDate: input.value, endDate: fmt(new Date()) };
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = xhr.response.data?.receipts || [];
          const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `costco-receipts-${vars.startDate}_to_${vars.endDate}.json`;
          a.click(); URL.revokeObjectURL(a.href);
          btn.textContent = `Downloaded ${data.length}`; btn.style.background = "#28a745";
          stat.textContent = `${data.length} receipts saved`; setTimeout(() => { btn.textContent = "Download as JSON"; btn.style.background = ""; btn.disabled = false; stat.textContent = ""; }, 3000);
        } else {
          throw new Error(`Status: ${xhr.status}`);
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(JSON.stringify({ query, variables: vars }));
    }).catch(e => {
      const btn = panel.querySelector("#crd-btn");
      const stat = panel.querySelector("#crd-stat");
      btn.textContent = "Error"; btn.style.background = "#d9534f";
      stat.textContent = "Failed — check console"; console.error(e);
      setTimeout(() => { btn.textContent = "Download as JSON"; btn.style.background = ""; btn.disabled = false; stat.textContent = ""; }, 4000);
    });
  };

  inject(); [1e3, 3e3, 6e3].forEach(t => setTimeout(inject, t));
  new MutationObserver((_, o) => { if (location.href !== (o.lastUrl || location.href)) { o.lastUrl = location.href; setTimeout(inject, 800); } }).observe(document.body, {childList:true, subtree:true});
})();