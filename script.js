/**
 
 SWIFTTRACK WAYBILLS CORE APPLICATION JAVASCRIPT LOGIC ENGINE
 create-section
 
 */

document.addEventListener("DOMContentLoaded", () => {
  // Structural Storage Key Initializer Matrix Arrays
  if (!localStorage.getItem("swifttrack_ledger")) {
    localStorage.setItem("swifttrack_ledger", JSON.stringify([]));
  }

  initSPAControls();
  initWaybillFormHandler();
  initTrackingModule();
  initAdminTerminal();
});

/* 
   1. GLOBAL STATE MANAGER & VIEW NAVIGATION CONTROLS
   security credential verification 
    */
let isAdminAuthenticated = false;

function initSPAControls() {
  const tabs = document.querySelectorAll(".nav-tab");
  const sections = document.querySelectorAll(".view-panel");
  const triggers = document.querySelectorAll(".action-trigger");

  function switchView(targetSectionId) {
    // Enforce administrative state authentication intercept guard loops
    if (
      targetSectionId === "admin-dashboard-section" &&
      !isAdminAuthenticated
    ) {
      targetSectionId = "admin-auth-section";
    }
    if (targetSectionId === "admin-auth-section" && isAdminAuthenticated) {
      targetSectionId = "admin-dashboard-section";
    }

    sections.forEach((sec) => sec.classList.remove("active"));
    const targetView = document.getElementById(targetSectionId);
    if (targetView) targetView.classList.add("active");

    // Reflect tab highlight updates across active tabs
    tabs.forEach((t) => {
      t.classList.remove("active");
      if (
        t.getAttribute("data-target") === targetSectionId ||
        (t.getAttribute("data-target") === "admin-auth-section" &&
          targetSectionId === "admin-dashboard-section")
      ) {
        t.classList.add("active");
      }
    });

    // Clear tracking card visibility states on structural adjustments
    if (targetSectionId !== "track-section") {
      document.getElementById("tracking-results-root").classList.add("hidden");
      document.getElementById("tracking-search-form").reset();
    }
    // Ensure form and confirmation sheets reset cleanly
    if (targetSectionId === "create-section") {
      document
        .getElementById("waybill-generation-form")
        .classList.remove("hidden");
      document.getElementById("creation-success-card").classList.add("hidden");
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      switchView(tab.getAttribute("data-target"));
    });
  });

  // Wire up context redirect operational triggers
  triggers.forEach((trig) => {
    trig.addEventListener("click", () => {
      switchView(trig.getAttribute("data-target"));
    });
  });

  document.getElementById("logo-link").addEventListener("click", (e) => {
    e.preventDefault();
    switchView("home-section");
  });
}

/* 
   2. LOCALSTORAGE CORE DATA TRANSACTION LEDGER UTILS
    */
function fetchLedger() {
  return JSON.parse(localStorage.getItem("swifttrack_ledger")) || [];
}

function writeLedger(dataArray) {
  localStorage.setItem("swifttrack_ledger", JSON.stringify(dataArray));
  if (isAdminAuthenticated) renderAdminDashboardTable();
}

/* 
   3. WAYBILL CREATION SUB-SYSTEM LOGIC
    */
function initWaybillFormHandler() {
  const form = document.getElementById("waybill-generation-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Compute unique pseudo-random operational 6-digit tracking tag key
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const trackingToken = `WB${randomDigits}`;

    const timestampStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // Encapsulate model structure specifications payload array
    const waybillPayload = {
      id: trackingToken,
      date: timestampStr,
      currentStatus: "Created",
      senderName: document.getElementById("sender-name").value.trim(),
      senderPhone: document.getElementById("sender-phone").value.trim(),
      senderAddress: document.getElementById("sender-address").value.trim(),
      receiverName: document.getElementById("receiver-name").value.trim(),
      receiverPhone: document.getElementById("receiver-phone").value.trim(),
      receiverAddress: document.getElementById("receiver-address").value.trim(),
      itemDescription: document.getElementById("item-desc").value.trim(),
      weight: parseFloat(document.getElementById("item-weight").value),
      statusHistory: [{ status: "Created", timestamp: timestampStr }],
    };

    const currentLedger = fetchLedger();
    currentLedger.unshift(waybillPayload);
    writeLedger(currentLedger);

    // Hide input interface framework, display voucher verification view
    form.classList.add("hidden");
    document.getElementById("generated-wb-token").textContent = trackingToken;
    document.getElementById("creation-success-card").classList.remove("hidden");

    spawnToast(
      `Waybill ${trackingToken} registered into ledger loop.`,
      "success",
    );
    form.reset();
  });
}

/* 
   4. PACKAGE TRACKING TIMELINE EVALUATION ENGINE
    */
function initTrackingModule() {
  const form = document.getElementById("tracking-search-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const searchInput = document
      .getElementById("track-search-input")
      .value.trim()
      .toUpperCase();
    const ledger = fetchLedger();
    const foundItem = ledger.find((wb) => wb.id === searchInput);

    if (!foundItem) {
      spawnToast("Waybill matching identifier key not located.", "danger");
      document.getElementById("tracking-results-root").classList.add("hidden");
      return;
    }

    renderTrackingOutputs(foundItem);
  });
}

function renderTrackingOutputs(record) {
  const root = document.getElementById("tracking-results-root");
  root.classList.remove("hidden");

  // Populate operational mapping identifiers
  document.getElementById("track-disp-wb").textContent = record.id;

  const statusBadge = document.getElementById("track-disp-status");
  statusBadge.textContent = record.currentStatus;
  // Remap structural layout classes to handle badge colors natively
  statusBadge.className = `badge badge-${record.currentStatus.toLowerCase().replace(/\s+/g, "-")}`;

  document.getElementById("track-disp-date").textContent = record.date;
  document.getElementById("track-disp-weight").textContent =
    `${record.weight} KG`;
  document.getElementById("track-disp-desc").textContent =
    record.itemDescription;

  document.getElementById("track-disp-sname").textContent = record.senderName;
  document.getElementById("track-disp-sphone").textContent = record.senderPhone;
  document.getElementById("track-disp-saddr").textContent =
    record.senderAddress;

  document.getElementById("track-disp-rname").textContent = record.receiverName;
  document.getElementById("track-disp-rphone").textContent =
    record.receiverPhone;
  document.getElementById("track-disp-raddr").textContent =
    record.receiverAddress;

  // Evaluate pipeline process status configurations
  const pipelineSequence = [
    "Created",
    "Picked Up",
    "In Transit",
    "Out For Delivery",
    "Delivered",
  ];
  const timelineRoot = document.getElementById("timeline-track-root");
  timelineRoot.innerHTML = "";

  pipelineSequence.forEach((step) => {
    const matchingHistoryIndex = record.statusHistory.findIndex(
      (h) => h.status === step,
    );
    const isPassed = matchingHistoryIndex !== -1;
    const isCurrent = record.currentStatus === step;

    let nodeClass = "timeline-node";
    if (isPassed) nodeClass += " passed";
    if (isCurrent) nodeClass += " current";

    const logTimestamp = isPassed
      ? record.statusHistory[matchingHistoryIndex].timestamp
      : "Pending Pipeline Corridor";

    const nodeElement = document.createElement("div");
    nodeElement.className = nodeClass;
    nodeElement.innerHTML = `
            <div class="node-marker"></div>
            <div class="node-content">
                <h4>${step}</h4>
                <span>${logTimestamp}</span>
            </div>
        `;
    timelineRoot.appendChild(nodeElement);
  });
}

/* 

5. ADMINISTRATIVE SHELL AUTHENTICATION & MANAGEMENT DATA TABLE


   */
function initAdminTerminal() {
  const authForm = document.getElementById("admin-login-form");
  const logoutBtn = document.getElementById("admin-logout-btn");
  const adminNavBtn = document.getElementById("admin-nav-btn");

  authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputPass = document.getElementById("admin-password").value;

    const inputUser = document.getElementById("admin-username").value;
    //  if (inputUser === "James Emmanuel")
    if (inputPass === "Emmy123" && inputUser === "James Emmanuel") {
      isAdminAuthenticated = true;
      spawnToast(
        "Clearance validated. Operational shell access activated.",
        "success",
      );
      authForm.reset();

      // Re-route dynamically into dashboard nodes
      document.getElementById("admin-auth-section").classList.remove("active");
      document
        .getElementById("admin-dashboard-section")
        .classList.add("active");
      adminNavBtn.textContent = "Dashboard";

      renderAdminDashboardTable();
    } else {
      spawnToast(
        "Security credential verification failures. Access denied.",
        "danger",
      );
    }
  });

  logoutBtn.addEventListener("click", () => {
    isAdminAuthenticated = false;
    adminNavBtn.textContent = "Admin";
    spawnToast("Administrative shell detached safely.", "info");

    document
      .getElementById("admin-dashboard-section")
      .classList.remove("active");
    document.getElementById("home-section").classList.add("active");
    document
      .querySelectorAll(".nav-tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelector('[data-target="home-section"]')
      .classList.add("active");
  });
}

function renderAdminDashboardTable() {
  const tbody = document.getElementById("dashboard-tbody");
  if (!tbody) return;

  const ledger = fetchLedger();
  tbody.innerHTML = "";

  if (ledger.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem;">No shipments registered inside the LocalStorage data arrays.</td></tr>`;
    return;
  }

  const optionsSequence = [
    "Created",
    "Picked Up",
    "In Transit",
    "Out For Delivery",
    "Delivered",
  ];

  ledger.forEach((row, index) => {
    const tr = document.createElement("tr");

    // Formulate dropdown markup configurations dynamically
    let optionsMarkup = "";
    optionsSequence.forEach((opt) => {
      const isSelected = row.currentStatus === opt ? "selected" : "";
      optionsMarkup += `<option value="${opt}" ${isSelected}>${opt}</option>`;
    });

    tr.innerHTML = `
            <td><strong>${row.id}</strong></td>
            <td>${row.date}</td>
            <td>
                <div><small>S:</small> ${row.senderName}</div>
                <div><small>R:</small> ${row.receiverName}</div>
            </td>
            <td>${row.itemDescription}</td>
            <td>${row.weight} KG</td>
            <td>
                <select class="select-override status-modifier" data-id="${row.id}">
                    ${optionsMarkup}
                </select>
            </td>
            <td>
                <button class="btn-action-del action-delete-trigger" data-id="${row.id}">Delete Record</button>
            </td>
        `;

    // Attach dynamic reactive operational mutation loops directly onto select parameters
    tr.querySelector(".status-modifier").addEventListener("change", (e) => {
      const targetWbId = e.target.getAttribute("data-id");
      const nextStatusValue = e.target.value;
      modifyWaybillStatusState(targetWbId, nextStatusValue);
    });

    // Attach deletion handling vectors
    tr.querySelector(".action-delete-trigger").addEventListener(
      "click",
      (e) => {
        const targetWbId = e.target.getAttribute("data-id");
        purgeWaybillRecord(targetWbId);
      },
    );

    tbody.appendChild(tr);
  });
}

function modifyWaybillStatusState(wbId, targetStatus) {
  const ledger = fetchLedger();
  const itemIndex = ledger.findIndex((x) => x.id === wbId);

  if (itemIndex === -1) return;

  // Skip redundant updates if requested status matches existing state
  if (ledger[itemIndex].currentStatus === targetStatus) return;

  const currentTimestamp = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Update object parameters arrays
  ledger[itemIndex].currentStatus = targetStatus;

  // Add status history record if not already modified inside past operations
  const historyMatchIndex = ledger[itemIndex].statusHistory.findIndex(
    (h) => h.status === targetStatus,
  );
  if (historyMatchIndex === -1) {
    ledger[itemIndex].statusHistory.push({
      status: targetStatus,
      timestamp: currentTimestamp,
    });
  } else {
    // Update the timestamp for the updated status
    ledger[itemIndex].statusHistory[historyMatchIndex].timestamp =
      currentTimestamp;
  }

  writeLedger(ledger);
  spawnToast(`Waybill ${wbId} status updated to [${targetStatus}]`, "success");
}

function purgeWaybillRecord(wbId) {
  if (!confirm(`Are you sure you want to permanently delete waybill: ${wbId}?`))
    return;

  let ledger = fetchLedger();
  ledger = ledger.filter((item) => item.id !== wbId);
  writeLedger(ledger);
  spawnToast(`Record ${wbId} successfully erased from storage loops.`, "info");
}

/* 
   6. GLOBAL TOAST ENGINE ALERTS METRICS INTERFACES
   dashboard-tbody
   */
function spawnToast(textMsg, variant = "info") {
  const targetBox = document.getElementById("toast-box");
  if (!targetBox) return;

  const toast = document.createElement("div");
  toast.className = `toast-element toast-${variant}`;
  toast.textContent = textMsg;

  targetBox.appendChild(toast);

  // Fade and clear element from active tracking frames automatically
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "scale(0.9) translateX(30px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}
