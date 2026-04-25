const knowledgeBase = {
  platforms: {
    ea888: {
      label: "VW/Audi EA888 Gen 3",
      vehicle: "2018 Golf R",
      ecu: "Bosch MG1/Simos family",
      injector: "DI turbo gasoline",
      commonMods: ["IS38 turbo", "downpipe", "intercooler", "HPFP", "ethanol blend"],
      watch: ["knock retard above 3 deg", "rail pressure drop", "boost overshoot", "IAT heat soak"],
      conservativeBoost: 23,
      sparkLimit: 8.5,
      afrTarget: 12.0
    },
    ej: {
      label: "Subaru EJ/FA Turbo",
      vehicle: "WRX/STI",
      ecu: "Denso",
      injector: "Port injection turbo gasoline",
      commonMods: ["intake", "downpipe", "boost controller", "TMIC/FMIC", "fuel pump"],
      watch: ["DAM/IAM drop", "feedback knock", "boost creep", "lean spool"],
      conservativeBoost: 18,
      sparkLimit: 6.5,
      afrTarget: 11.3
    },
    ls: {
      label: "GM LS/LT",
      vehicle: "Camaro/Corvette/Truck",
      ecu: "GM E38/E67/E92 family",
      injector: "NA or boosted gasoline",
      commonMods: ["camshaft", "headers", "intake", "blower", "flex fuel"],
      watch: ["fuel trim split", "spark knock", "VE/MAF mismatch", "torque model error"],
      conservativeBoost: 8,
      sparkLimit: 12.0,
      afrTarget: 12.6
    },
    ecoboost: {
      label: "Ford EcoBoost",
      vehicle: "Focus ST/F-150/Mustang",
      ecu: "Bosch/Continental family",
      injector: "DI turbo gasoline",
      commonMods: ["intercooler", "downpipe", "HPFP", "wastegate", "ethanol blend"],
      watch: ["LSPI risk", "tip-in knock", "charge temp", "throttle closure"],
      conservativeBoost: 22,
      sparkLimit: 7.5,
      afrTarget: 11.8
    },
    kseries: {
      label: "Honda K-Series",
      vehicle: "Civic/Integra/Swap",
      ecu: "Honda/aftermarket",
      injector: "NA or boosted gasoline",
      commonMods: ["intake", "header", "cams", "turbo kit", "injectors"],
      watch: ["VTEC crossover", "fuel pressure", "cam angle", "knock noise"],
      conservativeBoost: 10,
      sparkLimit: 10.5,
      afrTarget: 12.4
    },
    cummins: {
      label: "Cummins Diesel",
      vehicle: "Ram diesel",
      ecu: "Cummins controller",
      injector: "common-rail diesel",
      commonMods: ["turbo", "injectors", "lift pump", "exhaust", "trans tuning"],
      watch: ["EGT", "rail pressure", "smoke opacity", "torque management"],
      conservativeBoost: 34,
      sparkLimit: 0,
      afrTarget: 18.0
    }
  },
  articles: [
    {
      topic: "Knock retard",
      system: "Ignition",
      level: "critical",
      summary: "Timing is being pulled because the cylinder pressure, heat, fuel quality, or spark request is outside the safe margin.",
      fix: "Lower high-load timing, improve fuel octane, reduce IAT, inspect plugs/coils, then re-log the same pull."
    },
    {
      topic: "Lean AFR / lambda drift",
      system: "Fuel",
      level: "critical",
      summary: "Measured mixture is leaner than commanded during load. That raises exhaust temperature and knock risk.",
      fix: "Add enrichment in the affected cells, verify pump and injector capacity, and check wideband calibration."
    },
    {
      topic: "Boost overshoot",
      system: "Boost",
      level: "warning",
      summary: "Actual boost rises above target during spool or transient throttle.",
      fix: "Reduce wastegate duty ramp, soften PID response, and verify wastegate preload or boost control plumbing."
    },
    {
      topic: "Fuel trim split",
      system: "Air/Fuel",
      level: "warning",
      summary: "Bank-to-bank or long-term trim spread points to air metering, injector, exhaust leak, or sensor error.",
      fix: "Smoke test intake/exhaust, compare MAF/MAP readings, and correct MAF/VE only after mechanical faults are fixed."
    },
    {
      topic: "Torque model mismatch",
      system: "Torque",
      level: "warning",
      summary: "Requested torque, modeled torque, and airflow no longer agree after hardware or boost changes.",
      fix: "Rescale driver demand, torque limits, airflow, and throttle closure tables as one system."
    },
    {
      topic: "High IAT",
      system: "Thermal",
      level: "warning",
      summary: "Charge air temperature is high enough to reduce timing margin and repeatability.",
      fix: "Improve intercooling, lower boost in heat-soaked zones, and add temperature-based timing/boost compensation."
    }
  ],
  sampleLog: `rpm,boost,targetBoost,afr,targetAfr,knock,iat,fuelPressure,throttle
2800,16.2,15.0,12.1,11.8,0.4,92,1820,100
3400,24.6,21.0,12.7,11.8,2.6,104,1760,100
4100,25.1,22.5,12.9,11.8,3.8,116,1685,100
4800,23.8,23.0,12.3,11.8,2.9,124,1640,96
5600,22.4,22.0,11.9,11.8,1.6,128,1710,100
6400,20.8,21.0,11.7,11.8,0.8,132,1795,100`
};

const roleProfiles = {
  mechanic: {
    title: "Priority faults",
    explain: (issue) => issue.mechanic || issue.body
  },
  tuner: {
    title: "Calibration deltas",
    explain: (issue) => issue.tuner || issue.body
  },
  enthusiast: {
    title: "Performance review",
    explain: (issue) => issue.enthusiast || issue.body
  },
  daily: {
    title: "Reliability notes",
    explain: (issue) => issue.daily || issue.body
  }
};

const mapProfiles = {
  fuel: { hueStart: 155, hueEnd: 28, lightBase: 25 },
  spark: { hueStart: 190, hueEnd: 44, lightBase: 27 },
  boost: { hueStart: 145, hueEnd: 8, lightBase: 24 }
};

const state = {
  activeRole: "mechanic",
  activeMap: "fuel",
  activePlatform: "ea888",
  selectedMods: new Set(["intercooler", "downpipe"]),
  analysis: null,
  selectedArticle: "All"
};

const dom = {
  platformSelect: document.querySelector("#platformSelect"),
  modList: document.querySelector("#modList"),
  platformMeta: document.querySelector("#platformMeta"),
  platformWatch: document.querySelector("#platformWatch"),
  findingList: document.querySelector("#findingList"),
  scoreLabel: document.querySelector("#scoreLabel"),
  gaugeFill: document.querySelector("#gaugeFill"),
  fixTitle: document.querySelector("#fixTitle"),
  criticalBadge: document.querySelector("#criticalBadge"),
  statusBadge: document.querySelector("#statusBadge"),
  metrics: [
    document.querySelector("#knockMetric"),
    document.querySelector("#afrMetric"),
    document.querySelector("#boostMetric")
  ],
  heatmap: document.querySelector("#heatmap"),
  fileName: document.querySelector("#fileName"),
  fileMeta: document.querySelector("#fileMeta"),
  tuneUpload: document.querySelector("#tuneUpload"),
  dropZone: document.querySelector("#dropZone"),
  boostTarget: document.querySelector("#boostTarget"),
  fuelTarget: document.querySelector("#fuelTarget"),
  boostOutput: document.querySelector("#boostOutput"),
  fuelOutput: document.querySelector("#fuelOutput"),
  simResult: document.querySelector("#simResult"),
  logInput: document.querySelector("#logInput"),
  logSummary: document.querySelector("#logSummary"),
  knowledgeFilters: document.querySelector("#knowledgeFilters"),
  knowledgeList: document.querySelector("#knowledgeList"),
  revisionPlan: document.querySelector("#revisionPlan")
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function severityWeight(severity) {
  if (severity === "critical") return 18;
  if (severity === "warning") return 10;
  return -4;
}

function parseNumber(value) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCsv(text) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) return [];

  const headers = rows[0].split(",").map((header) => header.trim());
  return rows.slice(1).map((row) => {
    const values = row.split(",");
    return headers.reduce((record, header, index) => {
      record[header] = parseNumber(values[index]);
      return record;
    }, {});
  });
}

function maxOf(rows, field) {
  const values = rows.map((row) => row[field]).filter((value) => Number.isFinite(value));
  return values.length ? Math.max(...values) : 0;
}

function avgOf(rows, field) {
  const values = rows.map((row) => row[field]).filter((value) => Number.isFinite(value));
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function analyzeRows(rows) {
  const platform = knowledgeBase.platforms[state.activePlatform];
  const maxKnock = maxOf(rows, "knock");
  const maxIat = maxOf(rows, "iat");
  const minFuelPressure = Math.min(...rows.map((row) => row.fuelPressure).filter(Number.isFinite));
  const avgBoostError = avgOf(rows, "boost") - avgOf(rows, "targetBoost");
  const avgAfrDelta = avgOf(rows, "afr") - avgOf(rows, "targetAfr");
  const maxBoost = maxOf(rows, "boost");
  const issues = [];

  if (maxKnock >= 3) {
    issues.push({
      severity: "critical",
      title: "Knock correction above threshold",
      body: `Peak knock retard reached ${maxKnock.toFixed(1)} deg during the pull.`,
      mechanic: "Check fuel quality, plug gap, coil health, heat range, and carbon buildup before increasing load.",
      tuner: "Reduce high-load spark in the affected RPM band and add IAT-based timing compensation.",
      enthusiast: "The car is protecting itself by pulling timing. Do not add more boost until this is fixed.",
      daily: "Use the safer revision and inspect ignition parts before flashing a stronger file.",
      plan: "Pull 1.5-2.5 deg timing from high-load cells where knock exceeds 3 deg."
    });
  }

  if (avgAfrDelta > 0.45) {
    issues.push({
      severity: "critical",
      title: "Lean mixture under load",
      body: `Average AFR is ${avgAfrDelta.toFixed(1)} leaner than target.`,
      mechanic: "Verify fuel pressure, injector scaling, wideband accuracy, and intake leaks.",
      tuner: "Add enrichment and check injector/HPFP capacity before raising requested torque.",
      enthusiast: "The engine is running leaner than requested, which increases heat and knock risk.",
      daily: "Prioritize fuel-system inspection before performance changes.",
      plan: "Add 3-5 percent enrichment in the load/RPM region where lambda drift appears."
    });
  }

  if (avgBoostError > 1.5 || maxBoost > platform.conservativeBoost + 2) {
    issues.push({
      severity: "warning",
      title: "Boost control overshoot",
      body: `Boost averages ${avgBoostError.toFixed(1)} psi over target with a ${maxBoost.toFixed(1)} psi peak.`,
      mechanic: "Pressure-test charge pipes and confirm wastegate actuator behavior.",
      tuner: "Lower wastegate duty ramp and smooth proportional response around spool.",
      enthusiast: "The car may feel fast in the midrange but inconsistent and hotter than needed.",
      daily: "Lower the target boost to improve repeatability and part life.",
      plan: "Reduce spool-region wastegate duty by 4-8 percent and cap boost target near the platform safe preset."
    });
  }

  if (maxIat >= 120) {
    issues.push({
      severity: "warning",
      title: "Charge temperature is high",
      body: `IAT reached ${maxIat.toFixed(0)} F in the sample.`,
      mechanic: "Inspect intercooler airflow, heat shielding, and sensor plausibility.",
      tuner: "Add IAT timing reduction and consider boost taper above the heat threshold.",
      enthusiast: "Repeated pulls will make less power until the intake air temperature is controlled.",
      daily: "Use the lower-heat file in traffic or hot weather.",
      plan: "Add heat compensation above 115 F and taper boost 1-2 psi at high IAT."
    });
  }

  if (Number.isFinite(minFuelPressure) && minFuelPressure < 1700 && platform.injector.includes("DI")) {
    issues.push({
      severity: "warning",
      title: "Fuel pressure margin is thin",
      body: `Minimum logged fuel pressure was ${minFuelPressure.toFixed(0)} psi.`,
      mechanic: "Check pump health, fuel filter condition, and ethanol content.",
      tuner: "Lower torque request until rail pressure recovers, then revisit pump/injector limits.",
      enthusiast: "Fuel supply is close to the edge for the requested power.",
      daily: "Run the conservative file until fuel pressure is stable.",
      plan: "Lower torque request 5 percent in the affected range and flag fuel hardware for review."
    });
  }

  if (!issues.length) {
    issues.push({
      severity: "good",
      title: "No major log faults found",
      body: "The pasted log stays inside the current rule thresholds.",
      plan: "Keep current revision and collect another log in hotter conditions before increasing output."
    });
  }

  const baseRisk = 34 + issues.reduce((total, issue) => total + severityWeight(issue.severity), 0);
  const hardwareRisk = state.selectedMods.has("stock fuel system") ? 10 : 0;
  const risk = clamp(Math.round(baseRisk + hardwareRisk + Math.max(avgBoostError, 0) * 3), 12, 96);

  return {
    rows,
    risk,
    issues,
    metrics: {
      knock: maxKnock,
      afrDelta: avgAfrDelta,
      boostError: avgBoostError,
      maxIat,
      minFuelPressure: Number.isFinite(minFuelPressure) ? minFuelPressure : 0
    }
  };
}

function fallbackAnalysis() {
  return analyzeRows(parseCsv(knowledgeBase.sampleLog));
}

function renderPlatform() {
  const platform = knowledgeBase.platforms[state.activePlatform];
  document.querySelector(".vehicle-meta strong").textContent = platform.vehicle;
  document.querySelector(".vehicle-meta span").textContent = `${platform.label} - ${platform.ecu}`;
  dom.platformMeta.textContent = `${platform.ecu} - ${platform.injector}`;
  dom.platformWatch.innerHTML = "";

  platform.watch.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = item;
    dom.platformWatch.appendChild(chip);
  });

  dom.modList.innerHTML = "";
  const modOptions = [...new Set([...platform.commonMods, "stock fuel system", "upgraded fuel system", "street tires"])];
  modOptions.forEach((mod) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mod-chip ${state.selectedMods.has(mod) ? "active" : ""}`;
    button.textContent = mod;
    button.addEventListener("click", () => {
      if (state.selectedMods.has(mod)) {
        state.selectedMods.delete(mod);
      } else {
        state.selectedMods.add(mod);
      }
      renderPlatform();
      renderAnalysis();
    });
    dom.modList.appendChild(button);
  });
}

function renderAnalysis() {
  const analysis = state.analysis || fallbackAnalysis();
  const profile = roleProfiles[state.activeRole];
  const criticalCount = analysis.issues.filter((issue) => issue.severity === "critical").length;
  const warningCount = analysis.issues.filter((issue) => issue.severity === "warning").length;

  dom.fixTitle.textContent = profile.title;
  dom.scoreLabel.textContent = analysis.risk;
  dom.gaugeFill.style.width = `${analysis.risk}%`;
  dom.metrics[0].textContent = `${analysis.metrics.knock.toFixed(1)} deg`;
  dom.metrics[1].textContent = `${analysis.metrics.afrDelta >= 0 ? "+" : ""}${analysis.metrics.afrDelta.toFixed(1)}`;
  dom.metrics[2].textContent = `${analysis.metrics.boostError >= 0 ? "+" : ""}${analysis.metrics.boostError.toFixed(1)} psi`;
  dom.criticalBadge.textContent = criticalCount ? `${criticalCount} critical` : `${warningCount} warnings`;
  dom.criticalBadge.className = `status-badge ${criticalCount ? "hot" : warningCount ? "caution" : "ok"}`;
  dom.statusBadge.textContent = analysis.risk > 72 ? "Needs revision" : analysis.risk > 48 ? "Review advised" : "Stable";
  dom.statusBadge.className = `status-badge ${analysis.risk > 72 ? "caution" : analysis.risk > 48 ? "live" : "ok"}`;

  dom.findingList.innerHTML = "";
  analysis.issues.forEach((issue) => {
    const item = document.createElement("div");
    item.className = `finding ${issue.severity === "critical" ? "critical" : issue.severity === "good" ? "good" : ""}`;
    item.innerHTML = `<strong>${issue.title}</strong><p>${profile.explain(issue)}</p>`;
    dom.findingList.appendChild(item);
  });

  dom.revisionPlan.innerHTML = "";
  analysis.issues.slice(0, 5).forEach((issue) => {
    const item = document.createElement("li");
    item.textContent = issue.plan || issue.body;
    dom.revisionPlan.appendChild(item);
  });

  dom.logSummary.textContent = `${analysis.rows.length} rows analyzed - peak IAT ${analysis.metrics.maxIat.toFixed(0)} F - risk ${analysis.risk}/100`;
}

function renderHeatmap(profileName) {
  const profile = mapProfiles[profileName];
  const analysis = state.analysis || fallbackAnalysis();
  dom.heatmap.innerHTML = "";

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 12; col += 1) {
      const load = row / 7;
      const rpm = col / 11;
      const issueHeat = analysis.risk / 180;
      const curve = Math.pow(load, 1.3) * 0.54 + Math.sin(rpm * Math.PI) * 0.22 + rpm * 0.15 + issueHeat;
      const hue = profile.hueStart + (profile.hueEnd - profile.hueStart) * Math.min(curve, 1);
      const light = profile.lightBase + Math.min(curve * 28, 30);
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.type = "button";
      cell.style.setProperty("--hue", hue.toFixed(0));
      cell.style.setProperty("--light", `${light.toFixed(0)}%`);
      cell.setAttribute("aria-label", `${profileName} cell ${row + 1}, ${col + 1}`);
      cell.addEventListener("click", () => {
        document.querySelectorAll(".cell.active").forEach((node) => node.classList.remove("active"));
        cell.classList.add("active");
      });
      dom.heatmap.appendChild(cell);
    }
  }
}

function renderKnowledge() {
  const systems = ["All", ...new Set(knowledgeBase.articles.map((article) => article.system))];
  dom.knowledgeFilters.innerHTML = "";

  systems.forEach((system) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip ${state.selectedArticle === system ? "active" : ""}`;
    button.textContent = system;
    button.addEventListener("click", () => {
      state.selectedArticle = system;
      renderKnowledge();
    });
    dom.knowledgeFilters.appendChild(button);
  });

  dom.knowledgeList.innerHTML = "";
  knowledgeBase.articles
    .filter((article) => state.selectedArticle === "All" || article.system === state.selectedArticle)
    .forEach((article) => {
      const item = document.createElement("div");
      item.className = `knowledge-item ${article.level}`;
      item.innerHTML = `<strong>${article.topic}</strong><span>${article.system}</span><p>${article.summary}</p><small>${article.fix}</small>`;
      dom.knowledgeList.appendChild(item);
    });
}

function updateFile(file) {
  if (!file) return;
  dom.fileName.textContent = file.name.replace(/\.[^/.]+$/, "") || file.name;
  const kb = Math.max(1, Math.round(file.size / 1024));
  dom.fileMeta.textContent = `${kb} KB - queued for map detection - checksum pending`;

  if (/\.csv$|\.txt$/i.test(file.name)) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      dom.logInput.value = String(reader.result || "");
      runLogAnalysis();
    });
    reader.readAsText(file);
  }
}

function runLogAnalysis() {
  const rows = parseCsv(dom.logInput.value);
  if (!rows.length) {
    dom.logSummary.textContent = "Paste a CSV log with rpm, boost, targetBoost, afr, targetAfr, knock, iat, and fuelPressure columns.";
    return;
  }

  state.analysis = analyzeRows(rows);
  renderAnalysis();
  renderHeatmap(state.activeMap);
}

function updateOutputs() {
  dom.boostOutput.textContent = `${dom.boostTarget.value} psi`;
  dom.fuelOutput.textContent = `${dom.fuelTarget.value}/10`;
}

function selectRole(role) {
  state.activeRole = role;
  document.querySelector(".role-pill.active").classList.remove("active");
  document.querySelector(`[data-role="${role}"]`).classList.add("active");
  renderAnalysis();
}

Object.entries(knowledgeBase.platforms).forEach(([key, platform]) => {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = platform.label;
  dom.platformSelect.appendChild(option);
});

document.querySelectorAll(".role-pill").forEach((button) => {
  button.addEventListener("click", () => selectRole(button.dataset.role));
});

document.querySelectorAll(".segmented button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".segmented button.active").classList.remove("active");
    button.classList.add("active");
    state.activeMap = button.dataset.map;
    renderHeatmap(state.activeMap);
  });
});

dom.platformSelect.addEventListener("change", () => {
  state.activePlatform = dom.platformSelect.value;
  state.analysis = null;
  renderPlatform();
  renderAnalysis();
  renderHeatmap(state.activeMap);
});

dom.tuneUpload.addEventListener("change", (event) => {
  updateFile(event.target.files[0]);
});

["dragenter", "dragover"].forEach((eventName) => {
  dom.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dom.dropZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dom.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dom.dropZone.classList.remove("dragover");
  });
});

dom.dropZone.addEventListener("drop", (event) => {
  updateFile(event.dataTransfer.files[0]);
});

document.querySelector("#loadSample").addEventListener("click", () => {
  dom.fileName.textContent = "Stage 2 sample log";
  dom.fileMeta.textContent = "6 rows - diagnostic sample loaded - checksum valid";
  dom.logInput.value = knowledgeBase.sampleLog;
  selectRole("daily");
  runLogAnalysis();
});

document.querySelector("#sampleLogButton").addEventListener("click", () => {
  dom.logInput.value = knowledgeBase.sampleLog;
  runLogAnalysis();
});

document.querySelector("#analyzeLogButton").addEventListener("click", runLogAnalysis);
dom.boostTarget.addEventListener("input", updateOutputs);
dom.fuelTarget.addEventListener("input", updateOutputs);

document.querySelector("#simulateButton").addEventListener("click", () => {
  const boost = Number(dom.boostTarget.value);
  const fuel = Number(dom.fuelTarget.value);
  const platform = knowledgeBase.platforms[state.activePlatform];
  const riskPenalty = (state.analysis || fallbackAnalysis()).risk > 72 ? 8 : 0;
  const whp = Math.round(boost * 1.8 + fuel * 2.1 - 30 - riskPenalty);
  const torque = Math.round(boost * 2.3 + fuel * 1.4 - 32 - riskPenalty);
  const heat = boost > platform.conservativeBoost && fuel < 8 ? "thermal margin thin" : "thermal margin ok";
  dom.simResult.textContent = `+${whp} whp - +${torque} lb-ft - ${heat}`;
});

document.querySelector("#generateButton").addEventListener("click", () => {
  const platform = knowledgeBase.platforms[state.activePlatform];
  const analysis = state.analysis || fallbackAnalysis();
  const role = state.activeRole === "daily" ? "daily-safe" : state.activeRole;
  dom.fileName.textContent = `Revision B ${role}`;
  dom.fileMeta.textContent = `${dom.boostTarget.value} psi - fuel safety ${dom.fuelTarget.value}/10 - ${platform.label} - risk ${analysis.risk}/100`;
});

document.querySelector("#exportButton").addEventListener("click", () => {
  const analysis = state.analysis || fallbackAnalysis();
  const platform = knowledgeBase.platforms[state.activePlatform];
  const payload = {
    app: "ApexTune Calibration Lab",
    vehicle: platform.vehicle,
    platform: platform.label,
    revision: "B",
    boostPsi: Number(dom.boostTarget.value),
    fuelSafety: Number(dom.fuelTarget.value),
    role: state.activeRole,
    map: state.activeMap,
    selectedMods: [...state.selectedMods],
    risk: analysis.risk,
    issues: analysis.issues.map((issue) => ({
      severity: issue.severity,
      title: issue.title,
      recommendation: issue.plan
    })),
    generatedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "apextune-revision-b.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

dom.logInput.value = knowledgeBase.sampleLog;
dom.platformSelect.value = state.activePlatform;
state.analysis = fallbackAnalysis();
renderPlatform();
renderAnalysis();
renderHeatmap(state.activeMap);
renderKnowledge();
updateOutputs();
