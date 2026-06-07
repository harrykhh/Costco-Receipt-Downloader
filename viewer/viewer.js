/* Costco Receipt Viewer
 * Standalone client-side viewer for the receipts JSON exported by the
 * Costco Receipt Downloader. No build step or server required — open
 * index.html in a browser, upload the .json, browse and search.
 */
(function () {
  "use strict";

  /** @type {Array<Object>} The parsed receipt records. */
  let receipts = [];

  // --- Element references -------------------------------------------------
  const uploadView = document.getElementById("upload-view");
  const dataView = document.getElementById("data-view");
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const uploadError = document.getElementById("upload-error");

  const searchBox = document.getElementById("search-box");
  const resetBtn = document.getElementById("reset-btn");
  const resultSummary = document.getElementById("result-summary");
  const summaryBar = document.getElementById("summary-bar");
  const receiptsEl = document.getElementById("receipts");
  const emptyState = document.getElementById("empty-state");

  // --- Formatting helpers -------------------------------------------------
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  function formatMoney(value) {
    const n = Number(value);
    return Number.isFinite(n) ? currency.format(n) : "—";
  }

  function formatDate(receipt) {
    const raw = receipt.transactionDateTime || receipt.transactionDate;
    if (!raw) return "Unknown date";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // --- File handling ------------------------------------------------------
  function showError(message) {
    uploadError.textContent = message;
    uploadError.hidden = false;
  }

  function clearError() {
    uploadError.hidden = true;
    uploadError.textContent = "";
  }

  function handleFile(file) {
    clearError();
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
      let data;
      try {
        data = JSON.parse(reader.result);
      } catch (err) {
        showError("Could not parse the file as JSON: " + err.message);
        return;
      }

      // The export is an array of receipts. Be lenient about a wrapper object.
      if (!Array.isArray(data)) {
        if (data && Array.isArray(data.receipts)) {
          data = data.receipts;
        } else {
          showError(
            "Unexpected JSON shape — expected an array of receipt objects."
          );
          return;
        }
      }

      if (data.length === 0) {
        showError("The file parsed correctly but contains no receipts.");
        return;
      }

      receipts = data;
      enterDataView();
    };
    reader.onerror = function () {
      showError("Failed to read the file.");
    };
    reader.readAsText(file);
  }

  // --- View transitions ---------------------------------------------------
  function enterDataView() {
    uploadView.hidden = true;
    dataView.hidden = false;
    searchBox.value = "";
    renderSummary();
    render("");
    searchBox.focus();
  }

  function resetToUpload() {
    receipts = [];
    dataView.hidden = true;
    uploadView.hidden = false;
    fileInput.value = "";
    clearError();
  }

  // --- Search -------------------------------------------------------------
  // Build a lowercase searchable blob per receipt once, lazily cached on the
  // record itself so repeated keystrokes stay cheap.
  function searchableText(receipt) {
    if (receipt.__search) return receipt.__search;
    const parts = [
      receipt.warehouseName,
      receipt.warehouseShortName,
      receipt.warehouseCity,
      receipt.warehouseState,
      receipt.warehousePostalCode,
      receipt.warehouseAddress1,
      receipt.transactionType,
      receipt.transactionDate,
      receipt.transactionDateTime,
      receipt.transactionBarcode,
      receipt.total,
    ];
    (receipt.itemArray || []).forEach(function (item) {
      parts.push(
        item.itemDescription01,
        item.itemDescription02,
        item.itemNumber,
        item.amount
      );
    });
    (receipt.tenderArray || []).forEach(function (t) {
      parts.push(t.tenderDescription, t.displayAccountNumber);
    });
    const blob = parts
      .filter(function (p) {
        return p != null && p !== "";
      })
      .join("  ")
      .toLowerCase();
    Object.defineProperty(receipt, "__search", {
      value: blob,
      enumerable: false,
    });
    return blob;
  }

  function matches(receipt, query) {
    if (!query) return true;
    return searchableText(receipt).includes(query);
  }

  // --- Rendering ----------------------------------------------------------
  function renderSummary() {
    const count = receipts.length;
    const totalSpent = receipts.reduce(function (sum, r) {
      const n = Number(r.total);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    const totalSavings = receipts.reduce(function (sum, r) {
      const n = Number(r.instantSavings);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    const warehouses = new Set(
      receipts.map(function (r) {
        return r.warehouseName;
      })
    );

    const cards = [
      ["Receipts", String(count)],
      ["Net total", formatMoney(totalSpent)],
      ["Instant savings", formatMoney(totalSavings)],
      ["Warehouses visited", String(warehouses.size)],
    ];

    summaryBar.innerHTML = cards
      .map(function (c) {
        return (
          '<div class="stat-card"><div class="stat-label">' +
          escapeHtml(c[0]) +
          '</div><div class="stat-value">' +
          escapeHtml(c[1]) +
          "</div></div>"
        );
      })
      .join("");
  }

  function highlight(text, query) {
    const safe = escapeHtml(text);
    if (!query) return safe;
    const re = new RegExp("(" + escapeRegExp(escapeHtml(query)) + ")", "ig");
    return safe.replace(re, "<mark>$1</mark>");
  }

  function renderItemsTable(receipt, query) {
    const items = receipt.itemArray || [];
    if (items.length === 0) return "<p class='address'>No line items.</p>";

    const rows = items
      .map(function (item) {
        const isDiscount = Number(item.amount) < 0;
        const desc2 = item.itemDescription02
          ? '<span class="item-desc-2">' +
            highlight(item.itemDescription02, query) +
            "</span>"
          : "";
        return (
          '<tr class="' +
          (isDiscount ? "item-discount" : "") +
          '">' +
          "<td>" +
          highlight(item.itemDescription01 || "(no description)", query) +
          desc2 +
          '<span class="item-number">#' +
          highlight(item.itemNumber || "", query) +
          "</span></td>" +
          '<td class="num">' +
          escapeHtml(item.unit) +
          "</td>" +
          '<td class="num">' +
          formatMoney(item.amount) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    return (
      '<table class="items"><thead><tr>' +
      "<th>Item</th><th class='num'>Qty</th><th class='num'>Amount</th>" +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table>"
    );
  }

  function renderReceiptCard(receipt, index, query) {
    const isRefund = String(receipt.transactionType).toLowerCase() === "refund";
    const itemCount = (receipt.itemArray || []).length;

    const tenders = (receipt.tenderArray || [])
      .map(function (t) {
        const acct = t.displayAccountNumber ? " ••" + t.displayAccountNumber : "";
        return escapeHtml(t.tenderDescription || "Payment") + escapeHtml(acct);
      })
      .join(", ");

    const savings = Number(receipt.instantSavings) > 0
      ? '<span class="savings">Saved ' +
        formatMoney(receipt.instantSavings) +
        "</span>"
      : "";

    const addressParts = [
      receipt.warehouseAddress1,
      receipt.warehouseCity,
      receipt.warehouseState,
      receipt.warehousePostalCode,
    ]
      .filter(Boolean)
      .join(", ");

    return (
      '<article class="receipt-card" data-index="' +
      index +
      '">' +
      '<div class="receipt-head">' +
      '<div class="receipt-head-main">' +
      '<span class="receipt-warehouse">' +
      highlight(receipt.warehouseName || "Costco", query) +
      "</span>" +
      '<span class="receipt-meta">' +
      escapeHtml(formatDate(receipt)) +
      " · " +
      itemCount +
      (itemCount === 1 ? " item" : " items") +
      "</span>" +
      "</div>" +
      '<div class="receipt-head-right">' +
      '<span class="type-badge ' +
      (isRefund ? "refund" : "") +
      '">' +
      escapeHtml(receipt.transactionType || "Sales") +
      "</span>" +
      '<span class="receipt-total ' +
      (isRefund ? "refund" : "") +
      '">' +
      formatMoney(receipt.total) +
      "</span>" +
      '<span class="chevron">▶</span>' +
      "</div>" +
      "</div>" +
      '<div class="receipt-body">' +
      '<div class="address">' +
      highlight(addressParts, query) +
      "</div>" +
      renderItemsTable(receipt, query) +
      '<div class="receipt-footer">' +
      "<span>Subtotal: " +
      formatMoney(receipt.subTotal) +
      "</span>" +
      "<span>Tax: " +
      formatMoney(receipt.taxes) +
      "</span>" +
      (tenders ? "<span>Paid via: " + tenders + "</span>" : "") +
      savings +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function render(query) {
    const q = (query || "").trim().toLowerCase();

    const filtered = [];
    receipts.forEach(function (r, i) {
      if (matches(r, q)) filtered.push({ receipt: r, index: i });
    });

    resultSummary.textContent =
      q === ""
        ? receipts.length + " receipts"
        : filtered.length + " of " + receipts.length + " receipts";

    if (filtered.length === 0) {
      receiptsEl.innerHTML = "";
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    // Highlighting needs the original-case query token.
    const rawQuery = (query || "").trim();
    receiptsEl.innerHTML = filtered
      .map(function (f) {
        return renderReceiptCard(f.receipt, f.index, rawQuery);
      })
      .join("");
  }

  // --- Events -------------------------------------------------------------
  dropzone.addEventListener("click", function () {
    fileInput.click();
  });

  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", function () {
    handleFile(fileInput.files[0]);
  });

  ["dragenter", "dragover"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", function (e) {
    const file = e.dataTransfer && e.dataTransfer.files[0];
    handleFile(file);
  });

  // Debounce keystrokes so large files don't re-render on every character.
  let searchTimer = null;
  searchBox.addEventListener("input", function () {
    clearTimeout(searchTimer);
    const value = searchBox.value;
    searchTimer = setTimeout(function () {
      render(value);
    }, 120);
  });

  resetBtn.addEventListener("click", resetToUpload);

  // Expand / collapse cards via event delegation.
  receiptsEl.addEventListener("click", function (e) {
    const head = e.target.closest(".receipt-head");
    if (!head) return;
    head.parentElement.classList.toggle("open");
  });
})();
