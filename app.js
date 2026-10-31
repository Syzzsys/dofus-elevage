"use strict";

const STORAGE_KEY = "dofus-elevage-montures";
const PLAN_SETTINGS_KEY = "dofus-elevage-plan-settings";
const PLAN_DONE_KEY = "dofus-elevage-plan-fait";
const PLANNED_CROSSINGS_KEY = "dofus-elevage-croisements-planifies";
const OPTIMAKINA_KEY = "dofus-elevage-optimakina";
let MAX_MOUNTS = 500;
const CAPACITIES = ["Amoureuse", "Caméléone", "Endurante", "Précoce", "Reproducteur", "Sage", "Aucune"];
const FERTILITY_STATUSES = ["Féconde", "Pas féconde", "Inconnu"];
const CROSSING_BASE_RATE = 30;
const CROSSING_RATE_PER_LEVEL = 0.15;

let useOptimakina = false;

function calculateCrossingProbability(femaleLevel, maleLevel, optimakina = useOptimakina) {
  if (!Number.isFinite(femaleLevel) || !Number.isFinite(maleLevel)) return null;
  return Math.min(100, CROSSING_BASE_RATE
    + CROSSING_RATE_PER_LEVEL * (femaleLevel + maleLevel)
    + (optimakina ? 20 : 0));
}

function calculateRequiredGenOneCaptures(targetGeneration, meanParentLevel, optimakina) {
  const probability = calculateCrossingProbability(meanParentLevel, meanParentLevel, optimakina);
  if (probability === null || probability <= 0) return null;

  let captures = 1;
  for (let generation = targetGeneration; generation > 1; generation -= 1) {
    captures *= 2 / (probability / 100);
  }
  return Math.ceil(captures);
}

function calculateRequiredLevelSum(targetRate, optimakina = useOptimakina) {
  return Math.max(0, (targetRate - CROSSING_BASE_RATE - (optimakina ? 20 : 0)) / CROSSING_RATE_PER_LEVEL);
}

const form = document.querySelector("#mount-form");
const colorSelect = document.querySelector("#color-select");
const colorFilterSelect = document.querySelector("#color-filter");
const quantityFields = document.querySelector("#quantity-fields");
const femaleCountInput = form.elements.females;
const maleCountInput = form.elements.males;
const colorSelectControl = document.querySelector("#color-select-control");
const colorFilterControl = document.querySelector("#color-filter-control");
const mountList = document.querySelector("#mount-list");
const emptyState = document.querySelector("#empty-state");
const mountCount = document.querySelector("#mount-count");
const submitButton = document.querySelector("#submit-button");
const storageError = document.querySelector("#storage-error");
const colorMessage = document.querySelector("#color-message");
const colorLoadError = document.querySelector("#color-load-error");
const capacityCount = document.querySelector("#capacity-count");
const capacityProgress = document.querySelector("#capacity-progress");
const capacityDonut = document.querySelector("#capacity-donut");
const capacityPercent = document.querySelector("#capacity-percent");
const summaryFemales = document.querySelector("#summary-females");
const summaryMales = document.querySelector("#summary-males");
const summaryFertile = document.querySelector("#summary-fertile");
const summaryOwnedColors = document.querySelector("#summary-owned-colors");
const summaryColorsProgress = document.querySelector("#summary-colors-progress");
const summaryBalanceTrack = document.querySelector("#summary-balance-track");
const summaryBalanceFemales = document.querySelector("#summary-balance-females");
const summaryBalanceMales = document.querySelector("#summary-balance-males");
const summaryBalanceFemaleValue = document.querySelector("#summary-balance-female-value");
const summaryBalanceMaleValue = document.querySelector("#summary-balance-male-value");
const summaryBalanceFemalePercent = document.querySelector("#summary-balance-female-percent");
const summaryBalanceMalePercent = document.querySelector("#summary-balance-male-percent");
const summaryAbsentCount = document.querySelector("#summary-absent-count");
const summaryAbsentColors = document.querySelector("#summary-absent-colors");
const summaryAbsentSearch = document.querySelector("#summary-absent-search");
const summaryAbsentFilterCount = document.querySelector("#summary-absent-filter-count");
const summaryAbsentOpen = document.querySelector("#summary-absent-open");
const summaryAbsentOpenLabel = summaryAbsentOpen.querySelector("span");
const summaryMissingColorsDialog = document.querySelector("#summary-missing-colors-dialog");
const summaryMissingColorsClose = document.querySelector("#summary-missing-colors-close");
const summaryEmptyState = document.querySelector("#summary-empty-state");
const transferMessage = document.querySelector("#transfer-message");
const importFile = document.querySelector("#import-file");
const quantityMessage = document.querySelector("#quantity-message");
const capacityFilter = document.querySelector("#capacity-filter");
const mountSearch = document.querySelector("#mount-search");
const mountFiltersToggle = document.querySelector("#mount-filters-toggle");
const mountFiltersPanel = document.querySelector("#mount-filters-panel");
const mountFilterCount = document.querySelector("#mount-filter-count");
const activeMountFilters = document.querySelector("#active-mount-filters");
const clearMountFilters = document.querySelector("#clear-mount-filters");
const generationFilter = document.querySelector("#generation-filter");
const sexFilter = document.querySelector("#sex-filter");
const unnamedFilter = document.querySelector("#unnamed-filter");
const mountSort = document.querySelector("#mount-sort");
const mountFertileOnly = document.querySelector("#mount-fertile-only");
const bulkAddToggle = document.querySelector("#bulk-add-toggle");
const bulkAddForm = document.querySelector("#bulk-add-form");
const bulkColorSelect = document.querySelector("#bulk-color");
const bulkSexSelect = document.querySelector("#bulk-sex");
const bulkQuantityInput = document.querySelector("#bulk-quantity");
const capacityLegend = document.querySelector("#capacity-legend");
const capacityEditForm = document.querySelector("#capacity-edit-form");
const capacityEditSelect = capacityEditForm.elements.capacity;
const capacityLoadError = document.querySelector("#capacity-load-error");
const cancelCapacityEdit = document.querySelector("#cancel-capacity-edit");
const generationTarget = document.querySelector("#generation-target");
const crossingThreshold = document.querySelector("#crossing-threshold");
const crossingThresholdValue = document.querySelector("#crossing-threshold-value");
const crossingRequiredSum = document.querySelector("#crossing-required-sum");
const crossingWeakestLevel = document.querySelector("#crossing-weakest-level");
const crossingSort = document.querySelector("#crossing-sort");
const optimakinaToggle = document.querySelector("#optimakina-toggle");
const crossingAverageParentLevel = document.querySelector("#crossing-average-parent-level");
const crossingCaptureRateWithout = document.querySelector("#crossing-capture-rate-without");
const crossingCaptureRateWith = document.querySelector("#crossing-capture-rate-with");
const crossingCapturesWithout = document.querySelector("#crossing-captures-without");
const crossingCapturesWith = document.querySelector("#crossing-captures-with");
const crossingCapturesSaved = document.querySelector("#crossing-captures-saved");
const crossingCaptureValidation = document.querySelector("#crossing-capture-validation");
const crossingStatusFilter = document.querySelector("#crossing-status-filter");
const crossingFertileOnly = document.querySelector("#crossing-fertile-only");
const crossingGeneration = document.querySelector("#crossing-generation");
const crossingResults = document.querySelector("#crossing-results");
const crossingResultSummary = document.querySelector("#crossing-result-summary");
const balanceSexCounts = document.querySelector("#balance-sex-counts");
const balanceColorGrid = document.querySelector("#balance-color-grid");
const balanceShowAbsent = document.querySelector("#balance-show-absent");
const balanceColorSummary = document.querySelector("#balance-color-summary");
const balanceColorSearch = document.querySelector("#balance-color-search");
const balanceColorSort = document.querySelector("#balance-color-sort");
const captureImportFile = document.querySelector("#capture-import-file");
const captureImportButton = document.querySelector("#capture-import-button");
const captureReviewDialog = document.querySelector("#capture-review-dialog");
const captureProgress = document.querySelector("#capture-progress");
const captureProgressMessage = document.querySelector("#capture-progress-message");
const captureProgressBar = document.querySelector("#capture-progress-bar");
const captureError = document.querySelector("#capture-error");
const captureReviewRows = document.querySelector("#capture-review-rows");
const captureNoResults = document.querySelector("#capture-no-results");
const capturePreviewName = document.querySelector("#capture-preview-name");
const capturePreviewImage = document.querySelector("#capture-preview-image");
const captureImportSelected = document.querySelector("#capture-import-selected");
const captureReviewCancel = document.querySelector("#capture-review-cancel");
const balanceSexProgress = document.querySelector("#balance-sex-progress");
const balanceColorToolbar = document.querySelector(".balance-color-toolbar");
const overviewEmptyState = document.querySelector("#overview-empty-state");
const overviewCapacityCount = document.querySelector("#overview-capacity-count");
const overviewCapacityProgress = document.querySelector("#overview-capacity-progress");
const overviewCapacityLimit = document.querySelector("#overview-capacity-limit");
const overviewCoupleCount = document.querySelector("#overview-couple-count");
const overviewGenerations = document.querySelector("#overview-generations");
const overviewLevelReady = document.querySelector("#overview-level-ready");
const obtainableSummary = document.querySelector("#obtainable-summary");
const obtainableGenerationTabs = document.querySelector("#obtainable-generation-tabs");
const obtainableCrossingsList = document.querySelector("#obtainable-crossings-list");
const obtainableFeasibleOnly = document.querySelector("#obtainable-feasible-only");
const themeToggle = document.querySelector("#theme-toggle");
const settingsThemeToggle = document.querySelector("#settings-theme-toggle");
const dashboardReserveValue = document.querySelector("#dashboard-reserve-value");
const dashboardReserveCapacity = document.querySelector("#dashboard-reserve-capacity");
const dashboardReserveProgress = document.querySelector("#dashboard-reserve-progress");
const dashboardCoupleValue = document.querySelector("#dashboard-couples-value");
const dashboardFemales = document.querySelector("#dashboard-females");
const dashboardMales = document.querySelector("#dashboard-males");
const dashboardSexTrack = document.querySelector("#dashboard-sex-track");
const dashboardTargetGeneration = document.querySelector("#dashboard-target-generation");
const dashboardGenerationStepper = document.querySelector("#dashboard-generation-stepper");
const dashboardTodoList = document.querySelector("#dashboard-todo-list");
const recommendationTitle = document.querySelector("#recommendation-title");
const recommendationAction = document.querySelector("#recommendation-action");
const globalSearch = document.querySelector("#global-search");
const saveStatus = document.querySelector("#save-status");
const saveStatusFooter = document.querySelector("#save-status-footer");
const breadcrumbCurrent = document.querySelector("#breadcrumb-current");
const sidebarCollapse = document.querySelector("#sidebar-collapse");
const helpDrawer = document.querySelector("#help-drawer");
const onboardingDialog = document.querySelector("#onboarding-dialog");
const planTargetGenerationValue = document.querySelector("#plan-target-generation-value");
const planTargetColorCount = document.querySelector("#plan-target-color-count");
const planTargetCaptureCount = document.querySelector("#plan-target-capture-count");
const planNextAction = document.querySelector("#plan-next-action");
const planStatusMessage = document.querySelector("#plan-status-message");
const planGenerationTimeline = document.querySelector("#plan-generation-timeline");
const planBalance = document.querySelector("#plan-balance");
const planBalanceSummary = document.querySelector("#plan-balance-summary");
const planBalanceFilters = document.querySelector("#plan-balance-filters");
const planAllActions = document.querySelector("#plan-all-actions");
const planActionsToggle = document.querySelector("#plan-actions-toggle");
const planCaptureActions = document.querySelector("#plan-capture-actions");
const planCrossActions = document.querySelector("#plan-cross-actions");
const planCloneActions = document.querySelector("#plan-clone-actions");
const planReleaseActions = document.querySelector("#plan-release-actions");
const planError = document.querySelector("#plan-error");
const planCloneExtractNote = document.querySelector("#plan-clone-extract-note");
const planSettingsForm = document.querySelector("#plan-settings-form");
const safetyMarginInput = document.querySelector("#safety-margin");

let mounts = [];
let colors = [];
let capacityDescriptions = {};
let colorsLoaded = false;
let storageAvailable = true;
let editingMountIndex = null;
let desiredCapacityCounts = { females: {}, males: {} };
let planConfig = null;
let safetyMargin = 0;
let completedPlanActions = new Set();
let plannedCrossings = new Set();
let planNotice = "";
let planBalanceFilter = "all";
let showAbsentColors = false;
let balanceColorOpenGenerations = new Set(["1"]);
let mountSortDirection = 1;
let obtainableGenerationTab = 2;
let obtainableFilterInitialized = false;
let captureCandidates = [];
let capturePreviewUrls = [];
let selectedCapturePreview = 0;
let captureOcrRunning = false;
let captureRunId = 0;
let transferMessageTimeout = 0;
let lastUndoMounts = null;
let lastUndoExpires = 0;
let dashboardPlanActions = [];

const editableCapacities = CAPACITIES.filter((capacity) => capacity !== "Aucune");
const ICON_SHAPES = {
  moon: [["path", { d: "M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7Z" }]],
  sun: [
    ["circle", { cx: "12", cy: "12", r: "4" }],
    ["path", { d: "M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" }],
  ],
  check: [["path", { d: "m5 12 4 4L19 6" }]],
  minus: [["path", { d: "M5 12h14" }]],
  star: [["path", { d: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" }]],
  search: [
    ["circle", { cx: "11", cy: "11", r: "7" }],
    ["path", { d: "m20 20-4-4" }],
  ],
  sprout: [
    ["path", { d: "M12 20v-8" }],
    ["path", { d: "M12 13c-4 0-6-2-6-5.5 4 0 6 2 6 5.5Z" }],
    ["path", { d: "M12 10c0-3.5 2-5.5 6-5.5 0 3.5-2 5.5-6 5.5Z" }],
  ],
};

function createIcon(name, className = "icon") {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", className);
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.8");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  for (const [tag, attributes] of ICON_SHAPES[name] || []) {
    const shape = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [attribute, value] of Object.entries(attributes)) shape.setAttribute(attribute, value);
    icon.append(shape);
  }
  return icon;
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.replaceChildren(createIcon(isDark ? "sun" : "moon"));
  const label = isDark ? "Activer le thème clair" : "Activer le thème sombre";
  themeToggle.setAttribute("aria-label", label);
  themeToggle.title = label;
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#1b211a" : "#f6f3eb";
}

function initializeTheme() {
  let theme;
  try {
    theme = localStorage.getItem("dofus-elevage-theme");
  } catch {
    theme = null;
  }

  if (theme !== "dark" && theme !== "light") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  applyTheme(theme);

  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
      localStorage.setItem("dofus-elevage-theme", nextTheme);
    } catch {
      showTransferMessage("Le thème a été changé, mais sa préférence n’a pas pu être mémorisée.", true);
    }
  });
}

function isBaseMount(value) {
  return value !== null
    && typeof value === "object"
    && typeof value.color === "string"
    && value.color.trim().length > 0
    && (value.sex === "Femelle" || value.sex === "Mâle" || value.sex === "F" || value.sex === "M")
    && (value.level === undefined || value.level === null
      || (typeof value.level === "number" && Number.isFinite(value.level)));
}

function isGeneration(value) {
  return Number.isInteger(value) && value >= 1 && value <= 10;
}

function showStorageError(message) {
  storageError.textContent = message;
  storageError.hidden = false;
  storageAvailable = false;
  updateFormAvailability();
}

function showTransferMessage(message, isError = false, allowUndo = true) {
  clearTimeout(transferMessageTimeout);
  transferMessage.replaceChildren();
  const messageText = document.createElement("span");
  messageText.textContent = message;
  transferMessage.append(messageText);
  const canUndo = !isError && allowUndo && lastUndoMounts && Date.now() < lastUndoExpires;
  if (canUndo) {
    const undoButton = document.createElement("button");
    undoButton.type = "button";
    undoButton.className = "toast-undo";
    undoButton.textContent = "Annuler";
    undoButton.addEventListener("click", () => {
      const previousMounts = lastUndoMounts;
      lastUndoMounts = null;
      lastUndoExpires = 0;
      clearTimeout(transferMessageTimeout);
      if (saveMounts(previousMounts, "L’annulation n’a pas pu être sauvegardée.", false)) {
        showTransferMessage("Modification annulée.", false, false);
      }
    });
    transferMessage.append(undoButton);
  }
  transferMessage.className = isError ? "message error" : "message info toast";
  transferMessage.hidden = false;
  if (!isError) {
    transferMessageTimeout = window.setTimeout(() => {
      transferMessage.hidden = true;
      transferMessage.classList.remove("toast");
    }, 5000);
  }
}

function updateSaveStatus(message = "Enregistré") {
  for (const indicator of [saveStatus, saveStatusFooter]) {
    if (indicator) indicator.textContent = message;
  }
  if (saveStatus) {
    saveStatus.classList.toggle("is-saving", message !== "Enregistré");
  }
}

function isFemale(sex) {
  return sex === "Femelle" || sex === "F";
}

function isMale(sex) {
  return sex === "Mâle" || sex === "M";
}

function getFertilityStatus(mount) {
  return FERTILITY_STATUSES.includes(mount.fertility) ? mount.fertility : "Inconnu";
}

function isFertile(mount) {
  return getFertilityStatus(mount) === "Féconde";
}

function getRemainingReproductions(mount) {
  return Number.isInteger(mount.remainingReproductions) && mount.remainingReproductions >= 0
    ? mount.remainingReproductions
    : null;
}

function countFertileMounts(color, sexPredicate) {
  return mounts.filter((mount) => mount.color === color && sexPredicate(mount.sex) && isFertile(mount)).length;
}

function getMountName(mount) {
  return typeof mount.name === "string" ? mount.name.trim() : "";
}

function getMountGeneration(mount) {
  if (isGeneration(mount.generation)) return mount.generation;
  return colors.find((color) => color.nom === mount.color)?.generation ?? null;
}

function formatColorName(colorName) {
  return colorName.replace(/\s+et\s+/gi, " & ");
}

function getMountDescription(mount) {
  const generation = getMountGeneration(mount);
  const sexSymbol = isFemale(mount.sex) ? "♀" : "♂";
  return `${formatColorName(mount.color)} · Gén. ${generation ?? "?"} · ${sexSymbol}`;
}

function getMountDisplayName(mount) {
  const name = getMountName(mount);
  return name ? `${name} · ${getMountDescription(mount)}` : getMountDescription(mount);
}

function normalizeSearch(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

function getCountsForColor(color) {
  return mounts.reduce((counts, mount) => {
    if (mount.color === color) {
      if (isFemale(mount.sex)) counts.females += 1;
      else if (isMale(mount.sex)) counts.males += 1;
    }
    return counts;
  }, { females: 0, males: 0 });
}

function updateFormAvailability() {
  submitButton.disabled = !storageAvailable
    || !colorsLoaded
    || colors.length === 0
    || !colorSelect.value;
}

function getColorImagePaths(colorName) {
  const slugify = (name) => name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
  const parts = colorName.split(/\s+et\s+/i);
  const primarySlug = parts.length === 2
    ? parts.map((part) => slugify(part.trim())).join("-")
    : slugify(colorName);
  const paths = [`images/montures/${primarySlug}.png`];
  if (parts.length === 2) {
    paths.push(`images/montures/${slugify(parts[1])}-${slugify(parts[0])}.png`);
  }
  return [...new Set(paths)];
}

function createColorVisual(colorName, size = 32, className = "") {
  const visual = document.createElement("span");
  visual.className = `color-visual${className ? ` ${className}` : ""}`;
  visual.title = colorName;
  const image = document.createElement("img");
  const imagePaths = getColorImagePaths(colorName);
  let imagePathIndex = 0;
  image.alt = colorName;
  image.width = size;
  image.height = size;
  image.loading = "lazy";
  image.addEventListener("load", () => {
    image.classList.add("is-loaded");
  });
  image.addEventListener("error", () => {
    imagePathIndex += 1;
    if (imagePathIndex < imagePaths.length) {
      image.src = imagePaths[imagePathIndex];
      return;
    }

    const fallback = document.createElement("span");
    fallback.className = "color-image-fallback";
    fallback.textContent = colorName;
    visual.classList.add("is-fallback");
    visual.replaceChildren(fallback);
  });
  image.src = imagePaths[imagePathIndex];
  visual.append(image);
  return visual;
}

function createCustomColorSelect(selectElement, control, options = {}) {
  const {
    triggerId,
    valueId,
    popoverId,
    searchId,
    optionsId,
    emptyId,
    allowAll = false,
  } = options;
  const trigger = control.querySelector(`#${triggerId}`);
  const selectedValue = control.querySelector(`#${valueId}`);
  const popover = control.querySelector(`#${popoverId}`);
  const search = control.querySelector(`#${searchId}`);
  const optionsContainer = control.querySelector(`#${optionsId}`);
  const emptyMessage = control.querySelector(`#${emptyId}`);
  const optionIdPrefix = selectElement.id;
  let colorOptions = [];
  let filteredOptions = [];
  let activeIndex = -1;

  function renderSelectedValue() {
    selectedValue.classList.remove("skeleton", "color-select-loading");
    selectedValue.replaceChildren();
    const selected = colorOptions.find((color) => color.nom === selectElement.value);
    if (allowAll && !selectElement.value) {
      trigger.setAttribute("aria-label", "Toutes les couleurs");
      const label = document.createElement("span");
      label.className = "color-select-placeholder";
      label.textContent = "Toutes les couleurs";
      selectedValue.append(label);
      return;
    }
    if (!selected) {
      trigger.setAttribute("aria-label", "Choisir une couleur");
      const placeholder = document.createElement("span");
      placeholder.className = "color-select-placeholder";
      placeholder.textContent = colorOptions.length ? "Sélectionner une couleur" : "Chargement des couleurs…";
      selectedValue.append(placeholder);
      return;
    }

    selectedValue.append(createColorVisual(selected.nom, 32, "color-select-thumbnail"));
    const name = document.createElement("span");
    name.className = "color-select-name";
    name.textContent = selected.nom;
    const generation = document.createElement("span");
    generation.className = "color-select-generation";
    generation.textContent = `Gén ${selected.generation}`;
    selectedValue.append(name, generation);
    trigger.setAttribute("aria-label", `Couleur sélectionnée : ${selected.nom}, Génération ${selected.generation}. Choisir une autre couleur.`);
  }

  function setActiveOption(nextIndex) {
    if (filteredOptions.length === 0) {
      activeIndex = -1;
      search.removeAttribute("aria-activedescendant");
      return;
    }
    activeIndex = (nextIndex + filteredOptions.length) % filteredOptions.length;
    search.setAttribute("aria-activedescendant", filteredOptions[activeIndex].element.id);
    for (const [index, option] of filteredOptions.entries()) {
      option.element.classList.toggle("is-active", index === activeIndex);
    }
    filteredOptions[activeIndex].element.scrollIntoView({ block: "nearest" });
  }

  function chooseOption(color) {
    selectElement.value = color.nom;
    selectElement.dispatchEvent(new Event("change", { bubbles: true }));
    close(false);
    trigger.focus();
  }

  function renderOptions() {
    optionsContainer.replaceChildren();
    const query = normalizeSearch(search.value.trim());
    filteredOptions = [];
    let activeColorIndex = -1;
    const generations = [...new Set(colorOptions.map((color) => color.generation))].sort((a, b) => a - b);
    const matchingAll = allowAll && (!query || normalizeSearch("Toutes les couleurs").includes(query));
    if (allowAll && matchingAll) {
      const option = document.createElement("button");
      option.id = `${optionIdPrefix}-option-${filteredOptions.length}`;
      option.type = "button";
      option.className = "color-select-option color-select-all-option";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(!selectElement.value));
      option.tabIndex = -1;
      const label = document.createElement("span");
      label.className = "color-select-name";
      label.textContent = "Toutes les couleurs";
      option.append(label);
      option.addEventListener("pointerdown", (event) => event.preventDefault());
      option.addEventListener("click", () => chooseOption({ nom: "" }));
      optionsContainer.append(option);
      filteredOptions.push({ color: { nom: "" }, element: option });
      if (!selectElement.value) activeColorIndex = 0;
    }

    for (const generation of generations) {
      const generationOptions = colorOptions.filter((color) => color.generation === generation
        && normalizeSearch(color.nom).includes(query));
      if (generationOptions.length === 0) continue;

      const group = document.createElement("div");
      group.className = "color-select-group";
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", `Génération ${generation}`);
      const heading = document.createElement("div");
      heading.className = "color-select-group-heading";
      heading.textContent = `Génération ${generation}`;
      group.append(heading);

      for (const color of generationOptions) {
        const option = document.createElement("button");
        option.id = `${optionIdPrefix}-option-${filteredOptions.length}`;
        option.type = "button";
        option.className = "color-select-option";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", String(selectElement.value === color.nom));
        option.tabIndex = -1;
        option.append(createColorVisual(color.nom, 32, "color-select-thumbnail"));
        const name = document.createElement("span");
        name.className = "color-select-name";
        name.textContent = color.nom;
        const optionGeneration = document.createElement("span");
        optionGeneration.className = "color-select-generation";
        optionGeneration.textContent = `Gén ${color.generation}`;
        option.append(name, optionGeneration);
        option.addEventListener("pointerdown", (event) => event.preventDefault());
        option.addEventListener("click", () => chooseOption(color));
        group.append(option);
        filteredOptions.push({ color, element: option });
        if (color.nom === selectElement.value) activeColorIndex = filteredOptions.length - 1;
      }
      optionsContainer.append(group);
    }

    emptyMessage.hidden = filteredOptions.length > 0;
    if (popover.hidden) return;
    setActiveOption(activeColorIndex >= 0 ? activeColorIndex : 0);
  }

  function open() {
    if (trigger.disabled) return;
    popover.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    search.value = "";
    renderOptions();
    search.focus();
  }

  function close(returnFocus) {
    popover.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    search.removeAttribute("aria-activedescendant");
    activeIndex = -1;
    if (returnFocus) trigger.focus();
  }

  trigger.addEventListener("click", () => {
    if (popover.hidden) open();
    else close(false);
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    } else if (event.key === "Escape" && !popover.hidden) {
      event.preventDefault();
      close(false);
    }
  });
  search.addEventListener("input", renderOptions);
  search.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveOption(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveOption(activeIndex - 1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      chooseOption(filteredOptions[activeIndex].color);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Enter") {
      event.preventDefault();
    }
  });
  selectElement.addEventListener("change", renderSelectedValue);
  control.addEventListener("focusout", (event) => {
    if (!control.contains(event.relatedTarget) && !popover.hidden) close(false);
  });
  document.addEventListener("pointerdown", (event) => {
    if (!control.contains(event.target) && !popover.hidden) close(false);
  });

  return {
    update(options, enabled) {
      const selected = selectElement.value;
      colorOptions = options;
      selectElement.replaceChildren();
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = allowAll ? "Toutes les couleurs" : "Sélectionner une couleur";
      selectElement.append(placeholder);
      for (const color of options) {
        const option = document.createElement("option");
        option.value = color.nom;
        option.textContent = `${color.nom} (Gén ${color.generation})`;
        selectElement.append(option);
      }
      selectElement.value = options.some((color) => color.nom === selected) ? selected : "";
      trigger.disabled = !enabled || options.length === 0;
      renderSelectedValue();
      renderOptions();
    },
  };
}

const customColorSelect = createCustomColorSelect(colorSelect, colorSelectControl, {
  triggerId: "color-select-trigger",
  valueId: "color-select-value",
  popoverId: "color-select-popover",
  searchId: "color-select-search",
  optionsId: "color-select-options",
  emptyId: "color-select-empty",
});
const customColorFilter = createCustomColorSelect(colorFilterSelect, colorFilterControl, {
  triggerId: "color-filter-trigger",
  valueId: "color-filter-value",
  popoverId: "color-filter-popover",
  searchId: "color-filter-search",
  optionsId: "color-filter-options",
  emptyId: "color-filter-empty",
  allowAll: true,
});

function renderOverview() {
  const countsByColor = new Map();
  const sexTotals = { females: 0, males: 0 };

  for (const mount of mounts) {
    const counts = countsByColor.get(mount.color) || { females: 0, males: 0 };
    if (isFemale(mount.sex)) {
      counts.females += 1;
      sexTotals.females += 1;
    } else if (isMale(mount.sex)) {
      counts.males += 1;
      sexTotals.males += 1;
    }
    countsByColor.set(mount.color, counts);
  }

  renderMissingColorChips(countsByColor);
  renderBalanceColorGrid(countsByColor);
  renderSexTotals(balanceSexCounts, sexTotals);

  mountCount.textContent = `${mounts.length} montures enregistrées sur ${MAX_MOUNTS}`;
  capacityCount.textContent = `${mounts.length} / ${MAX_MOUNTS}`;
  capacityProgress.value = mounts.length;
  const capacityRatio = Math.min(1, mounts.length / MAX_MOUNTS);
  const capacityPercentage = Math.round(capacityRatio * 100);
  capacityDonut.style.setProperty("--capacity-fill", `${capacityPercentage}%`);
  capacityDonut.setAttribute("aria-label", `${mounts.length} monture(s) sur ${MAX_MOUNTS}`);
  capacityPercent.textContent = `${capacityPercentage} %`;
  summaryFemales.textContent = String(sexTotals.females);
  summaryFemales.classList.toggle("is-positive", sexTotals.females > 0);
  summaryMales.textContent = String(sexTotals.males);
  const sexTotal = sexTotals.females + sexTotals.males;
  const fertileCount = mounts.filter(isFertile).length;
  summaryFertile.textContent = String(fertileCount);
  summaryFertile.classList.toggle("is-positive", fertileCount > 0);
  const ownedColorCount = colors.filter((color) => {
    const counts = countsByColor.get(color.nom);
    return counts && counts.females + counts.males > 0;
  }).length;
  summaryOwnedColors.textContent = `${ownedColorCount} / ${colors.length}`;
  summaryOwnedColors.classList.toggle("is-positive", ownedColorCount > 0);
  summaryColorsProgress.max = colors.length;
  summaryColorsProgress.value = ownedColorCount;
  const femaleRatio = sexTotal ? sexTotals.females / sexTotal : 0;
  const maleRatio = sexTotal ? sexTotals.males / sexTotal : 0;
  summaryBalanceTrack.classList.toggle("is-empty", sexTotal === 0);
  summaryBalanceFemaleValue.textContent = String(sexTotals.females);
  summaryBalanceMaleValue.textContent = String(sexTotals.males);
  summaryBalanceFemalePercent.textContent = `${Math.round(femaleRatio * 100)} %`;
  summaryBalanceMalePercent.textContent = `${Math.round(maleRatio * 100)} %`;
  summaryBalanceFemales.style.width = `${femaleRatio * 100}%`;
  summaryBalanceMales.style.width = `${maleRatio * 100}%`;
  summaryBalanceTrack.setAttribute("aria-label", `${sexTotals.females} femelle(s), ${sexTotals.males} mâle(s)`);
  updateOverviewCapacity(sexTotals);
  renderOptimizationPlan();
  renderCrossingCalculator();
}

function setProgressTone(progress, value, max) {
  const ratio = max > 0 ? value / max : 0;
  progress.classList.toggle("is-warning", ratio >= 0.7 && ratio <= 0.9);
  progress.classList.toggle("is-danger", ratio > 0.9);
  progress.classList.toggle("is-positive", ratio < 0.7);
}

function renderDashboardStepper() {
  const target = Number(generationTarget.value) || 1;
  dashboardTargetGeneration.textContent = String(target);
  dashboardGenerationStepper.replaceChildren();
  for (let generation = 1; generation <= target; generation += 1) {
    const item = document.createElement("li");
    const accessible = generation === 1
      ? mounts.some((mount) => getMountGeneration(mount) === 1 && isFertile(mount))
      : getTargetCrossingPairs(generation).some((pair) => isFertile(pair.female) && isFertile(pair.male));
    item.className = `generation-step${generation < target && accessible ? " is-complete" : ""}${generation === target ? " is-current" : ""}${generation > 1 && !accessible ? " is-locked" : ""}`;
    item.setAttribute("aria-current", generation === target ? "step" : "false");
    const marker = document.createElement("span");
    marker.className = "generation-step-marker";
    marker.textContent = String(generation);
    const label = document.createElement("span");
    label.textContent = `G${generation}`;
    const missing = dashboardPlanActions
      .filter((action) => action.generation === generation)
      .reduce((total, action) => total + (action.missingCount || action.count || 0), 0);
    const missingLabel = document.createElement("small");
    missingLabel.textContent = `${missing} monture${missing === 1 ? "" : "s"} manquante${missing === 1 ? "" : "s"}`;
    item.append(marker, label, missingLabel);
    item.title = `G${generation} : ${missingLabel.textContent}`;
    dashboardGenerationStepper.append(item);
  }
}

function renderDashboardGuidance() {
  if (!dashboardTodoList) return;
  dashboardTodoList.replaceChildren();
  const remainingActions = dashboardPlanActions.filter((action) => !completedPlanActions.has(action.id));
  const remainingCaptures = remainingActions.filter((action) => action.id.startsWith("capture:"));
  const femaleCount = remainingCaptures
    .filter((action) => action.sex === "Femelle")
    .reduce((total, action) => total + action.count, 0);
  const maleCount = remainingCaptures
    .filter((action) => action.sex === "Mâle")
    .reduce((total, action) => total + action.count, 0);
  renderDashboardStepper();
  if (remainingActions.length === 0) {
    const empty = document.createElement("li");
    empty.className = "dashboard-todo-empty";
    empty.textContent = mounts.length === 0
      ? "Ajoute tes premières montures pour obtenir des recommandations adaptées."
      : "Aucune action restante dans le plan actuel.";
    dashboardTodoList.append(empty);
    recommendationTitle.textContent = mounts.length === 0 ? "Commence par ajouter tes montures" : "Ton plan est à jour";
    recommendationAction.textContent = mounts.length === 0 ? "Ajouter une monture" : "Consulter le plan";
    recommendationAction.dataset.destination = mounts.length === 0 ? "elevage" : "bilan";
    return;
  }

  const nextAction = remainingActions[0];
  const hasCaptures = femaleCount + maleCount > 0;
  if (hasCaptures) {
    const captureParts = [];
    if (femaleCount > 0) captureParts.push(`${femaleCount} femelles`);
    if (maleCount > 0) captureParts.push(`${maleCount} mâles`);
    recommendationTitle.textContent = `Capturer ${captureParts.join(" et ")} (G1)`;
  } else if (nextAction.id.startsWith("cross:")) {
    recommendationTitle.textContent = `Obtenir ${nextAction.missingCount} monture${nextAction.missingCount === 1 ? "" : "s"} en G${nextAction.generation}`;
  } else {
    recommendationTitle.textContent = nextAction.text;
  }
  recommendationAction.textContent = hasCaptures ? "Ajouter une monture" : "Consulter le plan";
  recommendationAction.dataset.destination = hasCaptures ? "elevage" : "bilan";

  const captureGroups = ["Femelle", "Mâle"].map((sex) => {
    const actions = remainingCaptures.filter((action) => action.sex === sex);
    return actions.length === 0 ? null : {
      id: `capture-group:${sex}`,
      ids: actions.map((action) => action.id),
      text: `Capturer ${actions.reduce((total, action) => total + action.count, 0)} ${sex === "Femelle" ? "femelles" : "mâles"} (G1)`,
    };
  }).filter(Boolean);
  const todoActions = [
    ...captureGroups,
    ...remainingActions.filter((action) => !action.id.startsWith("capture:")),
  ].slice(0, 5);

  for (const action of todoActions) {
    const item = document.createElement("li");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute("aria-label", `Marquer comme terminée : ${action.text}`);
    const actionIds = action.ids || [action.id];
    checkbox.checked = actionIds.every((id) => completedPlanActions.has(id));
    checkbox.addEventListener("change", () => {
      const checked = checkbox.checked;
      for (const id of actionIds) {
        if (checked) completedPlanActions.add(id);
        else completedPlanActions.delete(id);
      }
      try {
        localStorage.setItem(PLAN_DONE_KEY, JSON.stringify([...completedPlanActions]));
      } catch {
        for (const id of actionIds) {
          if (checked) completedPlanActions.delete(id);
          else completedPlanActions.add(id);
        }
        planNotice = "Impossible d’enregistrer l’avancement des recommandations dans le navigateur.";
        checkbox.checked = !checked;
        if (planError) {
          planError.textContent = planNotice;
          planError.hidden = false;
        }
        return;
      }
      updateSaveStatus();
      renderOptimizationPlan();
    });
    const copy = document.createElement("div");
    copy.className = "dashboard-todo-copy";
    if (action.id.startsWith("cross:")) {
      const recipe = document.createElement("div");
      recipe.className = "dashboard-todo-recipe";
      for (const [index, colorName] of action.parentColors.entries()) {
        if (index > 0) {
          const plus = document.createElement("span");
          plus.className = "dashboard-todo-operator";
          plus.textContent = "+";
          recipe.append(plus);
        }
        recipe.append(createDashboardColorChip(colorName));
      }
      const arrow = document.createElement("span");
      arrow.className = "dashboard-todo-operator";
      arrow.textContent = "→";
      recipe.append(arrow, createDashboardColorChip(action.resultColor));
      copy.append(recipe);
      if (!action.parentsAvailable) {
        const note = document.createElement("small");
        note.textContent = "Aucun couple en stock";
        copy.append(note);
      }
    } else {
      const text = document.createElement("span");
      text.textContent = action.text;
      copy.append(text);
    }
    item.append(checkbox, copy);
    dashboardTodoList.append(item);
  }
}

function createDashboardColorChip(colorName) {
  const chip = document.createElement("span");
  chip.className = "dashboard-todo-color";
  chip.append(createColorVisual(colorName, 20, "dashboard-todo-color-visual"));
  const label = document.createElement("span");
  label.textContent = colorName;
  chip.append(label);
  return chip;
}

function renderBalanceColorGrid(countsByColor) {
  const colorEntries = colors.map((color) => ({
    color: color.nom,
    generation: color.generation,
    counts: countsByColor.get(color.nom) || { females: 0, males: 0 },
  }));
  for (const [colorName, counts] of countsByColor) {
    if (colors.some((color) => color.nom === colorName)) continue;
    const mount = mounts.find((entry) => entry.color === colorName);
    colorEntries.push({
      color: colorName,
      generation: getMountGeneration(mount) || "—",
      counts,
    });
  }

  const visibleColors = colorEntries.filter(({ color, counts }) => (
    (showAbsentColors || counts.females + counts.males > 0)
      && normalizeSearch(color).includes(normalizeSearch(balanceColorSearch.value.trim()))
  ));
  const groupedColors = new Map();
  for (const entry of visibleColors) {
    const group = groupedColors.get(entry.generation) || [];
    group.push(entry);
    groupedColors.set(entry.generation, group);
  }

  balanceColorGrid.replaceChildren();
  const knownColorNames = new Set(colors.map((color) => color.nom));
  const ownedColorCount = colorEntries.filter(({ color, counts }) => (
    knownColorNames.has(color) && counts.females + counts.males > 0
  )).length;
  balanceColorSummary.textContent = `${ownedColorCount} couleur(s) possédée(s) sur ${colors.length}`;
  overviewEmptyState.hidden = mounts.length > 0;
  balanceColorToolbar.hidden = mounts.length === 0;
  balanceColorGrid.hidden = mounts.length === 0;
  const generations = [...groupedColors.keys()].sort((first, second) => Number(first) - Number(second));
  for (const generation of generations) {
    const group = document.createElement("details");
    group.className = "balance-color-generation";
    group.dataset.generation = String(generation);
    group.open = balanceColorOpenGenerations.has(String(generation));
    group.addEventListener("toggle", () => {
      if (group.open) balanceColorOpenGenerations.add(String(generation));
      else balanceColorOpenGenerations.delete(String(generation));
    });
    const summary = document.createElement("summary");
    summary.textContent = `Génération ${generation} · ${groupedColors.get(generation).length} couleur(s)`;
    const grid = document.createElement("ul");
    grid.className = "balance-color-items";
    const sortMode = balanceColorSort.value;
    const sortedEntries = groupedColors.get(generation).sort((first, second) => {
      if (sortMode === "quantity") {
        return (second.counts.females + second.counts.males) - (first.counts.females + first.counts.males)
          || first.color.localeCompare(second.color, "fr", { sensitivity: "base" });
      }
      if (sortMode === "alphabetical") return first.color.localeCompare(second.color, "fr", { sensitivity: "base" });
      return first.color.localeCompare(second.color, "fr", { sensitivity: "base" });
    });
    for (const entry of sortedEntries) {
      const item = document.createElement("li");
      item.className = "balance-color-item";
      const isUnbalanced = (entry.counts.females === 0 && entry.counts.males > 0)
        || (entry.counts.males === 0 && entry.counts.females > 0);
      if (isUnbalanced) item.classList.add("is-unbalanced");
      if (entry.counts.females + entry.counts.males === 0) item.classList.add("is-absent");
      item.title = isUnbalanced
        ? `${entry.color} : stock déséquilibré, ${entry.counts.females} femelle(s) et ${entry.counts.males} mâle(s).`
        : `${entry.color} : ${entry.counts.females} femelle(s), ${entry.counts.males} mâle(s).`;
      item.append(createColorVisual(entry.color, 56, "balance-color-thumbnail"));
      const name = document.createElement("span");
      name.className = "balance-color-name";
      name.textContent = entry.color;
      const counts = document.createElement("span");
      counts.className = "balance-color-sex-counts";
      const females = document.createElement("span");
      females.setAttribute("aria-label", `${entry.counts.females} femelle(s)`);
      females.textContent = `♀ ${entry.counts.females}`;
      const males = document.createElement("span");
      males.setAttribute("aria-label", `${entry.counts.males} mâle(s)`);
      males.textContent = `♂ ${entry.counts.males}`;
      counts.append(females, males);
      item.append(name, counts);
      grid.append(item);
    }
    group.append(summary, grid);
    balanceColorGrid.append(group);
  }
  if (visibleColors.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted-note";
    empty.textContent = "Aucune monture en stock. Affiche les couleurs absentes ou ajoute des montures dans l’onglet Élevage.";
    balanceColorGrid.append(empty);
  }

  balanceShowAbsent.checked = showAbsentColors;
  balanceShowAbsent.setAttribute("aria-pressed", String(showAbsentColors));
}

function updateOverviewCapacity(sexTotals) {
  overviewCapacityCount.textContent = String(mounts.length);
  overviewCapacityLimit.textContent = String(MAX_MOUNTS);
  overviewCapacityProgress.value = mounts.length;
  setProgressTone(overviewCapacityProgress, mounts.length, MAX_MOUNTS);
  dashboardReserveValue.textContent = String(mounts.length);
  dashboardReserveCapacity.textContent = String(MAX_MOUNTS);
  dashboardReserveProgress.max = MAX_MOUNTS;
  dashboardReserveProgress.value = mounts.length;
  dashboardReserveValue.closest(".dashboard-stat-card").classList.toggle("has-value", mounts.length > 0);
  setProgressTone(dashboardReserveProgress, mounts.length, MAX_MOUNTS);

  const totalSexed = sexTotals.females + sexTotals.males;
  balanceSexProgress.replaceChildren();
  const femaleBar = document.createElement("span");
  femaleBar.className = "sex-balance-females";
  const maleBar = document.createElement("span");
  maleBar.className = "sex-balance-males";
  if (totalSexed > 0) {
    femaleBar.style.width = `${(sexTotals.females / totalSexed) * 100}%`;
    maleBar.style.width = `${(sexTotals.males / totalSexed) * 100}%`;
    balanceSexProgress.append(femaleBar, maleBar);
  } else {
    balanceSexProgress.classList.add("is-empty");
  }
  if (totalSexed > 0) balanceSexProgress.classList.remove("is-empty");
  balanceSexProgress.setAttribute("aria-label", `${sexTotals.females} femelles et ${sexTotals.males} mâles`);

  const allPairs = new Set();
  const feasibleGenerations = new Set();
  for (let generation = 2; generation <= 10; generation += 1) {
    const pairs = getTargetCrossingPairs(generation).filter((pair) => isFertile(pair.female) && isFertile(pair.male));
    if (pairs.length > 0) feasibleGenerations.add(generation);
    for (const pair of pairs) allPairs.add(`${pair.femaleIndex}:${pair.maleIndex}`);
  }
  overviewCoupleCount.textContent = String(allPairs.size);
  dashboardCoupleValue.textContent = String(allPairs.size);
  dashboardCoupleValue.closest(".dashboard-stat-card").classList.toggle("has-value", allPairs.size > 0);
  dashboardFemales.textContent = String(sexTotals.females);
  dashboardMales.textContent = String(sexTotals.males);
  dashboardFemales.closest(".dashboard-stat-card").classList.toggle("has-value", totalSexed > 0);
  dashboardSexTrack.replaceChildren();
  dashboardSexTrack.classList.toggle("is-empty", totalSexed === 0);
  if (totalSexed > 0) {
    const femalePart = document.createElement("span");
    femalePart.className = "sex-balance-females";
    femalePart.style.width = `${(sexTotals.females / totalSexed) * 100}%`;
    const malePart = document.createElement("span");
    malePart.className = "sex-balance-males";
    malePart.style.width = `${(sexTotals.males / totalSexed) * 100}%`;
    dashboardSexTrack.append(femalePart, malePart);
  }
  dashboardSexTrack.setAttribute("aria-label", `${sexTotals.females} femelles et ${sexTotals.males} mâles`);
  renderDashboardStepper();
  overviewGenerations.replaceChildren();
  for (const generation of Array.from({ length: 9 }, (_, index) => index + 2)) {
    const accessibleGeneration = feasibleGenerations.has(generation);
    const item = document.createElement("span");
    item.className = `generation-status-item${accessibleGeneration ? " is-accessible" : " is-unavailable"}`;
    let minimumMissing = Infinity;
    for (const color of colors.filter((entry) => entry.generation === generation && Array.isArray(entry.parents) && entry.parents.length === 2)) {
      const [first, second] = color.parents;
      const orientations = [
        [[first, "Femelle"], [second, "Mâle"]],
        [[second, "Femelle"], [first, "Mâle"]],
      ];
      for (const orientation of orientations) {
        const missing = orientation.reduce((count, [parentColor, sex]) => (
          count + Number(!mounts.some((mount) => mount.color === parentColor
            && (sex === "Femelle" ? isFemale(mount.sex) : isMale(mount.sex))
            && getFertilityStatus(mount) !== "Pas féconde"))
        ), 0);
        minimumMissing = Math.min(minimumMissing, missing);
      }
    }
    item.title = accessibleGeneration
      ? `G${generation} accessible`
      : Number.isFinite(minimumMissing)
        ? `Il te manque ${minimumMissing} parent(s) pour débloquer cette génération`
        : `Aucune recette définie pour la génération ${generation}`;
    item.setAttribute("aria-label", accessibleGeneration
      ? `Génération ${generation} accessible`
      : Number.isFinite(minimumMissing)
        ? `Génération ${generation} non accessible. ${item.title}`
        : item.title);
    item.append(createIcon(accessibleGeneration ? "check" : "minus", "icon generation-status-icon"), document.createTextNode(`G${generation}`));
    overviewGenerations.append(item);
  }

  const targetRate = Number(crossingThreshold.value);
  const requiredSum = calculateRequiredLevelSum(targetRate);
  const singleParentLevel = Math.ceil(requiredSum / 2);
  const levelReady = mounts.filter((mount) => Number.isFinite(mount.level) && mount.level >= singleParentLevel).length;
  overviewLevelReady.textContent = `${levelReady} monture${levelReady === 1 ? "" : "s"} · niv. ${singleParentLevel}+`;
}

function renderMissingColorChips(countsByColor) {
  summaryAbsentColors.replaceChildren();
  const absentColors = colors.filter((color) => {
    const counts = countsByColor.get(color.nom);
    return !counts || counts.females + counts.males === 0;
  });
  for (const color of absentColors) {
    const chip = document.createElement("span");
    chip.className = "summary-missing-color-chip";
    chip.dataset.missingColor = color.nom.toLocaleLowerCase("fr");
    chip.title = color.nom;
    chip.append(createColorVisual(color.nom, 20, "summary-missing-color-visual"));
    const name = document.createElement("span");
    name.textContent = color.nom;
    chip.append(name);
    summaryAbsentColors.append(chip);
  }
  summaryAbsentCount.textContent = String(absentColors.length);
  summaryAbsentOpen.hidden = absentColors.length === 0;
  summaryAbsentOpenLabel.textContent = `Voir les ${absentColors.length} couleurs manquantes`;
  filterSummaryAbsentColors();
  summaryEmptyState.hidden = mounts.length > 0;
}

function filterSummaryAbsentColors() {
  const query = summaryAbsentSearch.value.trim().toLocaleLowerCase("fr");
  const chips = [...summaryAbsentColors.children];
  let visibleCount = 0;
  for (const chip of chips) {
    const matches = chip.dataset.missingColor.includes(query);
    chip.hidden = !matches;
    if (matches) visibleCount += 1;
  }
  summaryAbsentFilterCount.textContent = `${visibleCount} sur ${chips.length}`;
}

function renderSexTotals(container, totals) {
  container.replaceChildren();
  for (const [labelText, countValue] of [["Femelles", totals.females], ["Mâles", totals.males]]) {
    const label = document.createElement("dt");
    const count = document.createElement("dd");
    label.textContent = labelText;
    count.textContent = String(countValue);
    container.append(label, count);
  }
}

function getColorCounts(mountsForColor) {
  return mountsForColor.reduce((counts, mount) => {
    if (isFemale(mount.sex)) counts.females += 1;
    else if (isMale(mount.sex)) counts.males += 1;
    return counts;
  }, { females: 0, males: 0 });
}

function calculateUsefulColors(targetGeneration, plannedColorNames = []) {
  const colorByName = new Map(colors.map((color) => [color.nom, color]));
  const usefulNames = new Set();
  const missingParents = new Set();

  function addColorAndParents(name) {
    if (usefulNames.has(name)) return;
    const color = colorByName.get(name);
    if (!color) {
      missingParents.add(name);
      return;
    }

    usefulNames.add(name);
    for (const parent of color.parents || []) addColorAndParents(parent);
  }

  const goalColors = colors.filter((color) => color.generation === targetGeneration);
  for (const color of goalColors) addColorAndParents(color.nom);
  for (const colorName of plannedColorNames) addColorAndParents(colorName);

  return {
    goalColors,
    usefulColors: [...usefulNames]
      .map((name) => colorByName.get(name))
      .filter(Boolean)
      .sort((first, second) => first.generation - second.generation || first.nom.localeCompare(second.nom, "fr")),
    missingParents: [...missingParents],
  };
}

function getPlannedRecipeColors() {
  const colorByName = new Map(colors.map((color) => [color.nom, color]));
  const recipeNames = new Set();
  const visited = new Set();

  function addRecipeAndParents(name) {
    if (visited.has(name)) return;
    visited.add(name);
    const color = colorByName.get(name);
    if (!color || !Array.isArray(color.parents) || color.parents.length !== 2) return;
    recipeNames.add(name);
    for (const parent of color.parents) addRecipeAndParents(parent);
  }

  for (const colorName of plannedCrossings) addRecipeAndParents(colorName);
  return recipeNames;
}

function calculateColorTargets(usefulColors, plannedRecipeNames) {
  const crossingCounts = new Map(usefulColors.map((color) => [color.nom, 0]));
  for (const recipeName of plannedRecipeNames) {
    const recipe = colors.find((color) => color.nom === recipeName);
    for (const parent of recipe?.parents || []) {
      if (crossingCounts.has(parent)) {
        crossingCounts.set(parent, crossingCounts.get(parent) + 1);
      }
    }
  }

  return new Map(usefulColors.map((color) => {
    const crossings = crossingCounts.get(color.nom) || 0;
    const perSex = crossings > 0 ? crossings + safetyMargin : 0;
    return [color.nom, { crossings, females: perSex, males: perSex }];
  }));
}

function getColorBalance(color, target) {
  const colorMounts = mounts.filter((mount) => mount.color === color.nom);
  const counts = getColorCounts(colorMounts);
  const fertileCounts = colorMounts.reduce((fertile, mount) => {
    if (!isFertile(mount)) return fertile;
    if (isFemale(mount.sex)) fertile.females += 1;
    else if (isMale(mount.sex)) fertile.males += 1;
    return fertile;
  }, { females: 0, males: 0 });
  const femalesTarget = target.females;
  const malesTarget = target.males;
  const surplus = Math.max(0, counts.females - femalesTarget) + Math.max(0, counts.males - malesTarget);
  const missingFemales = Math.max(0, femalesTarget - counts.females);
  const missingMales = Math.max(0, malesTarget - counts.males);
  const status = surplus > 0 ? "Surplus" : (missingFemales > 0 || missingMales > 0 ? "Manquant" : "Équilibré");
  return { counts, fertileCounts, target, missingFemales, missingMales, surplus, status };
}

function findRecommendedParents(color, includeInfertile = false) {
  if (!Array.isArray(color.parents) || color.parents.length !== 2) return null;
  const [firstParent, secondParent] = color.parents;
  const allowed = (mount) => includeInfertile || getFertilityStatus(mount) !== "Pas féconde";
  const firstFemales = mounts.filter((mount) => mount.color === firstParent && isFemale(mount.sex)
    && allowed(mount));
  const firstMales = mounts.filter((mount) => mount.color === firstParent && isMale(mount.sex)
    && allowed(mount));
  const secondFemales = mounts.filter((mount) => mount.color === secondParent && isFemale(mount.sex)
    && allowed(mount));
  const secondMales = mounts.filter((mount) => mount.color === secondParent && isMale(mount.sex)
    && allowed(mount));
  const candidates = [
    ...firstFemales.flatMap((female) => secondMales.map((male) => ({ female, male }))),
    ...secondFemales.flatMap((female) => firstMales.map((male) => ({ female, male }))),
  ];

  candidates.sort((first, second) => {
    const fertilityDifference = Number(isFertile(second.female) && isFertile(second.male))
      - Number(isFertile(first.female) && isFertile(first.male));
    if (fertilityDifference !== 0) return fertilityDifference;
    const reproductiveDifference = Number(second.female.capacity === "Reproducteur" || second.male.capacity === "Reproducteur")
      - Number(first.female.capacity === "Reproducteur" || first.male.capacity === "Reproducteur");
    if (reproductiveDifference !== 0) return reproductiveDifference;
    const levelDifference = Number(Number.isFinite(second.female.level) && Number.isFinite(second.male.level))
      - Number(Number.isFinite(first.female.level) && Number.isFinite(first.male.level));
    if (levelDifference !== 0) return levelDifference;
    return (second.female.level + second.male.level) - (first.female.level + first.male.level);
  });

  return candidates[0] || null;
}

function getCrossingProbability(female, male) {
  return calculateCrossingProbability(female.level, male.level);
}

function getTargetCrossingPairs(targetGeneration) {
  const targetsByParentPair = new Map();
  for (const color of colors) {
    if (color.generation !== targetGeneration || !Array.isArray(color.parents) || color.parents.length !== 2) continue;
    const parentNames = [...color.parents].sort((first, second) => first.localeCompare(second, "fr"));
    const pairKey = JSON.stringify(parentNames);
    const targets = targetsByParentPair.get(pairKey) || { parents: parentNames, offspring: new Set() };
    targets.offspring.add(color.nom);
    targetsByParentPair.set(pairKey, targets);
  }

  const pairsByMounts = new Map();
  for (const target of targetsByParentPair.values()) {
    const [firstParent, secondParent] = target.parents;
    const firstFemales = mounts.flatMap((mount, index) => (
      mount.color === firstParent && isFemale(mount.sex) && getFertilityStatus(mount) !== "Pas féconde" ? [{ mount, index }] : []
    ));
    const secondMales = mounts.flatMap((mount, index) => (
      mount.color === secondParent && isMale(mount.sex) && getFertilityStatus(mount) !== "Pas féconde" ? [{ mount, index }] : []
    ));
    const candidates = [
      ...firstFemales.flatMap((female) => secondMales.map((male) => ({ female, male }))),
    ];

    if (firstParent !== secondParent) {
      const secondFemales = mounts.flatMap((mount, index) => (
        mount.color === secondParent && isFemale(mount.sex) && getFertilityStatus(mount) !== "Pas féconde" ? [{ mount, index }] : []
      ));
      const firstMales = mounts.flatMap((mount, index) => (
        mount.color === firstParent && isMale(mount.sex) && getFertilityStatus(mount) !== "Pas féconde" ? [{ mount, index }] : []
      ));
      candidates.push(...secondFemales.flatMap((female) => firstMales.map((male) => ({ female, male }))));
    }

    for (const { female, male } of candidates) {
      const pairKey = `${female.index}:${male.index}`;
      const pair = pairsByMounts.get(pairKey) || {
        female: female.mount,
        femaleIndex: female.index,
        male: male.mount,
        maleIndex: male.index,
        offspring: new Set(),
      };
      for (const offspring of target.offspring) pair.offspring.add(offspring);
      pairsByMounts.set(pairKey, pair);
    }
  }

  return [...pairsByMounts.values()].map((pair) => ({
    ...pair,
    probability: calculateCrossingProbability(pair.female.level, pair.male.level),
  }));
}

function renderCrossingCalculator() {
  if (!crossingResults || !crossingThreshold) return;
  renderCrossingCaptureEstimate();
  const threshold = Number(crossingThreshold.value);
  crossingThresholdValue.textContent = `${threshold}%`;
  const requiredLevelSum = calculateRequiredLevelSum(threshold);
  const displayedRequiredSum = Math.ceil(requiredLevelSum);
  const balancedLowerLevel = Math.floor(displayedRequiredSum / 2);
  const balancedHigherLevel = Math.ceil(displayedRequiredSum / 2);
  crossingRequiredSum.textContent = `Somme de niveaux requise : ${displayedRequiredSum} (ex. ${balancedLowerLevel} + ${balancedHigherLevel}).`;
  const minimumBalancedLevel = Math.ceil(requiredLevelSum / 2);
  const exampleLevel = minimumBalancedLevel;
  crossingWeakestLevel.textContent = `Pour deux parents de même niveau : ${exampleLevel} chacun.`;
  const targetGeneration = Number(generationTarget.value);
  crossingGeneration.textContent = String(targetGeneration);
  const sortByCloseness = crossingSort.value === "closest";
  const selectedStatus = crossingStatusFilter.value;
  const pairs = getTargetCrossingPairs(targetGeneration).map((pair) => {
    const levelSum = pair.female.level + pair.male.level;
    const missingLevels = pair.probability === null
      ? null
      : Math.max(0, Math.ceil(requiredLevelSum - levelSum));
    const reachedTarget = pair.probability !== null && levelSum >= requiredLevelSum;
    return {
      ...pair,
      missingLevels,
      weakestParentLevel: pair.probability === null
        ? null
        : Math.max(0, Math.ceil(requiredLevelSum - Math.max(pair.female.level, pair.male.level))),
      status: pair.probability === null
        ? "Niveau manquant"
        : reachedTarget
          ? "Prêt"
          : missingLevels < 20
            ? "Presque"
            : "À monter",
    };
  }).filter((pair) => (!selectedStatus || pair.status === selectedStatus)
    && (!crossingFertileOnly.checked || (isFertile(pair.female) && isFertile(pair.male))));
  pairs.sort((first, second) => {
      if (first.probability === null) return second.probability === null ? 0 : 1;
      if (second.probability === null) return -1;
      if (sortByCloseness && first.missingLevels !== second.missingLevels) {
        return first.missingLevels - second.missingLevels;
      }
      return second.probability - first.probability
        || first.femaleIndex - second.femaleIndex
        || first.maleIndex - second.maleIndex;
    });

  crossingResults.replaceChildren();
  crossingResultSummary.textContent = `${pairs.length} couple(s) affiché(s) pour G${targetGeneration}, triés ${sortByCloseness ? "par proximité du seuil" : "par taux décroissant"}${selectedStatus ? `, statut « ${selectedStatus} »` : ""}${crossingFertileOnly.checked ? ", deux parents féconds" : ", parents non déclarés « Pas féconde »"}. Les couples dont le niveau manque sont signalés.`;
  if (pairs.length === 0) {
    const empty = document.createElement("li");
    empty.className = "crossing-empty";
    empty.textContent = colors.some((color) => color.generation === targetGeneration && Array.isArray(color.parents))
      ? "Aucun couple ne dépasse ce seuil avec les montures disponibles."
      : `Aucun croisement n’est défini dans data/couleurs.json pour la génération ${targetGeneration}.`;
    crossingResults.append(empty);
    return;
  }

  for (const pair of pairs) {
    const item = document.createElement("li");
    item.className = "crossing-result";
    const parents = document.createElement("div");
    parents.className = "crossing-parents";
    for (const [mount, index, sexLabel, roleLabel] of [
      [pair.female, pair.femaleIndex, "Femelle", "Parent ♀"],
      [pair.male, pair.maleIndex, "Mâle", "Parent ♂"],
    ]) {
      const parent = document.createElement("div");
      parent.className = "crossing-parent";
      const role = document.createElement("strong");
      role.className = "crossing-parent-role";
      role.textContent = roleLabel;
      parent.append(createColorVisual(mount.color, 48, "crossing-parent-image"));
      const description = document.createElement("span");
      description.className = "crossing-parent-name";
      description.textContent = getMountDisplayName(mount);
      const fertility = createFertilityBadge(mount);
      const levelLabel = document.createElement("label");
      levelLabel.className = "crossing-level-label";
      levelLabel.textContent = `Niveau ${sexLabel.toLocaleLowerCase("fr")}`;
      levelLabel.append(createLevelEditor(mount, index, "crossing-level-editor"));
      const capacity = document.createElement("span");
      capacity.className = "crossing-parent-capacity";
      capacity.textContent = `Capacité du parent : ${mount.capacity || "Aucune"}`;
      if (mount.capacity === "Reproducteur") {
        capacity.classList.add("is-useful-capacity");
        capacity.prepend(createIcon("star", "icon capacity-useful-icon"));
        capacity.append(" · Capacité utile ici (+1 bébé)");
      }
      parent.append(role, description, fertility, levelLabel, capacity);
      parents.append(parent);
    }

    const result = document.createElement("div");
    result.className = "crossing-result-details";
    const probability = document.createElement("strong");
    if (pair.probability === null) {
      probability.className = "crossing-warning";
      probability.textContent = "Probabilité non calculée";
    } else {
      probability.textContent = `${formatCrossingRate(pair.probability)} %`;
    }
    const status = document.createElement("span");
    const statusClass = {
      "Prêt": "ready",
      "Presque": "almost",
      "À monter": "level-up",
      "Niveau manquant": "missing",
    }[pair.status];
    status.className = `crossing-status crossing-status-${statusClass}`;
    status.textContent = pair.status;
    result.append(probability, status);
    if (useOptimakina) {
      const makinaBadge = document.createElement("span");
      makinaBadge.className = "crossing-makina-badge";
      makinaBadge.textContent = "Makina";
      result.append(makinaBadge);
    }
    if (pair.probability !== null) {
      const missing = document.createElement("span");
      missing.className = "crossing-level-gap";
      missing.textContent = pair.missingLevels === 0
        ? "Taux visé atteint."
        : `Il manque ${pair.missingLevels} niveau${pair.missingLevels > 1 ? "x" : ""} au total.`;
      const weakestLevel = document.createElement("span");
      weakestLevel.className = "crossing-weakest-parent";
      weakestLevel.textContent = `Parent le plus faible : niveau ${pair.weakestParentLevel} minimum.`;
      result.append(missing, weakestLevel);
    }
    const calculation = document.createElement("span");
    calculation.className = "crossing-calculation";
    if (pair.probability === null) {
      calculation.textContent = "Calcul indisponible tant que les deux niveaux ne sont pas renseignés.";
    } else {
      calculation.textContent = `${CROSSING_BASE_RATE} + ${formatCrossingRate(CROSSING_RATE_PER_LEVEL)} × (${pair.female.level} + ${pair.male.level})${useOptimakina ? " + 20" : ""} = ${formatCrossingRate(pair.probability)} %`;
    }
    result.append(calculation);
    const offspring = document.createElement("span");
    offspring.className = "crossing-offspring";
    offspring.append(document.createTextNode("Couleur(s) attendue(s) : "));
    for (const [index, colorName] of [...pair.offspring].entries()) {
      if (index > 0) offspring.append(document.createTextNode(" / "));
      offspring.append(createColorVisual(colorName, 32));
      const colorLabel = document.createElement("span");
      colorLabel.className = "crossing-offspring-name";
      colorLabel.textContent = colorName;
      offspring.append(colorLabel);
    }
    if (pair.probability === null) {
      const warning = document.createElement("span");
      warning.className = "crossing-warning-message";
      warning.textContent = "Un niveau manque ; renseignez-le pour calculer la chance de réussite.";
      result.append(warning, offspring);
    } else {
      result.append(offspring);
    }

    item.append(parents, result);
    crossingResults.append(item);
  }
}

function renderCrossingCaptureEstimate() {
  const meanParentLevel = crossingAverageParentLevel.value.trim() === ""
    ? NaN
    : Number(crossingAverageParentLevel.value);
  const isValidLevel = Number.isInteger(meanParentLevel) && meanParentLevel >= 1 && meanParentLevel <= 200;
  crossingAverageParentLevel.setAttribute("aria-invalid", String(!isValidLevel));
  crossingCaptureValidation.hidden = isValidLevel;

  if (!isValidLevel) {
    crossingCaptureValidation.textContent = "Saisis un niveau entier compris entre 1 et 200.";
    crossingCaptureRateWithout.textContent = "—";
    crossingCaptureRateWith.textContent = "—";
    crossingCapturesWithout.textContent = "—";
    crossingCapturesWith.textContent = "—";
    crossingCapturesSaved.textContent = "—";
    return;
  }

  const targetGeneration = Number(generationTarget.value);
  const rateWithout = calculateCrossingProbability(meanParentLevel, meanParentLevel, false);
  const rateWith = calculateCrossingProbability(meanParentLevel, meanParentLevel, true);
  const capturesWithout = calculateRequiredGenOneCaptures(targetGeneration, meanParentLevel, false);
  const capturesWith = calculateRequiredGenOneCaptures(targetGeneration, meanParentLevel, true);

  crossingCaptureRateWithout.textContent = `${formatCrossingRate(rateWithout)} %`;
  crossingCaptureRateWith.textContent = `${formatCrossingRate(rateWith)} %`;
  crossingCapturesWithout.textContent = capturesWithout.toLocaleString("fr-FR");
  crossingCapturesWith.textContent = capturesWith.toLocaleString("fr-FR");
  crossingCapturesSaved.textContent = (capturesWithout - capturesWith).toLocaleString("fr-FR");
}

function formatCrossingRate(value) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
}

function updateMountLevel(mountIndex, input) {
  const value = input.value.trim() === "" ? NaN : Number(input.value);
  if (!Number.isInteger(value) || value < 0 || value > 200) {
    input.setCustomValidity("Saisissez un niveau entier compris entre 0 et 200.");
    input.reportValidity();
    input.setCustomValidity("");
    const restoredValue = String(mounts[mountIndex]?.level ?? 0);
    input.closest(".mount-level-editor, .crossing-level-editor")?.querySelectorAll("input").forEach((control) => {
      control.value = restoredValue;
      if (control.type === "range") {
        control.style.setProperty("--level-progress", `${(Number(restoredValue) / 200) * 100}%`);
      }
    });
    return;
  }

  const updatedMounts = mounts.map((mount, index) => (
    index === mountIndex ? { ...mount, level: value } : mount
  ));
  if (saveMounts(updatedMounts, "Le niveau n’a pas pu être sauvegardé.")) {
    return;
  }
}

function renderPlanActionList(container, actions, emptyText) {
  container.replaceChildren();
  if (actions.length === 0) {
    const empty = document.createElement("li");
    empty.className = "plan-empty";
    empty.textContent = emptyText;
    container.append(empty);
    return;
  }

  for (const action of actions) {
    const item = document.createElement("li");
    item.className = `plan-action${completedPlanActions.has(action.id) ? " is-done" : ""}`;
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = completedPlanActions.has(action.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) completedPlanActions.add(action.id);
      else completedPlanActions.delete(action.id);
      try {
        localStorage.setItem(PLAN_DONE_KEY, JSON.stringify([...completedPlanActions]));
      } catch {
        planNotice = "Impossible d’enregistrer l’avancement des recommandations dans le navigateur.";
        planError.textContent = planNotice;
        planError.hidden = false;
        checkbox.checked = !checkbox.checked;
        if (checkbox.checked) completedPlanActions.add(action.id);
        else completedPlanActions.delete(action.id);
        return;
      }
      updateSaveStatus();
      renderOptimizationPlan();
    });
    const content = document.createElement("span");
    content.className = "plan-action-content";
    if (action.color) content.append(createColorVisual(action.color, 48, "recommendation-color"));
    const text = document.createElement("span");
    text.className = "plan-action-text";
    text.textContent = action.text;
    content.append(text);
    label.append(checkbox, content);
    item.append(label);
    container.append(item);
  }
}

function getObtainableCrossings() {
  return colors
    .filter((color) => color.generation >= 2 && Array.isArray(color.parents) && color.parents.length === 2)
    .map((color) => {
      const parents = findRecommendedParents(color) || findRecommendedParents(color, true);
      const fertile = Boolean(parents && isFertile(parents.female) && isFertile(parents.male));
      return {
        color,
        parents,
        fertile,
        probability: parents ? getCrossingProbability(parents.female, parents.male) : null,
        reproductive: parents
          ? parents.female.capacity === "Reproducteur" || parents.male.capacity === "Reproducteur"
          : false,
      };
    });
}

function getMissingParentDescription(color) {
  const [first, second] = color.parents;
  const orientations = [
    [[first, "Femelle"], [second, "Mâle"]],
    [[second, "Femelle"], [first, "Mâle"]],
  ];
  const missingForOrientation = orientations.map((orientation) => orientation
    .filter(([colorName, sex]) => !mounts.some((mount) => mount.color === colorName
      && (sex === "Femelle" ? isFemale(mount.sex) : isMale(mount.sex))
      && getFertilityStatus(mount) !== "Pas féconde"))
    .map(([colorName, sex]) => `${colorName} ${sex === "Femelle" ? "♀" : "♂"}`));
  const missing = missingForOrientation.sort((firstMissing, secondMissing) => firstMissing.length - secondMissing.length)[0];
  return missing.length ? missing.join(" + ") : "un parent";
}

function getAvailableRecipeParent(colorName, sex) {
  return mounts.find((mount) => mount.color === colorName
    && (sex === "Femelle" ? isFemale(mount.sex) : isMale(mount.sex))
    && getFertilityStatus(mount) !== "Pas féconde") || null;
}

function getSelectedRecipeParent(colorName, index, colorNames, parents) {
  if (parents) {
    if (colorNames[0] === colorNames[1]) return index === 0 ? parents.female : parents.male;
    return [parents.female, parents.male].find((mount) => mount.color === colorName) || null;
  }
  return getAvailableRecipeParent(colorName, "Femelle")
    || getAvailableRecipeParent(colorName, "Mâle");
}

function createObtainableParent(colorName, mount, sex) {
  const parent = document.createElement("div");
  parent.className = `obtainable-parent${mount ? "" : " is-missing"}`;
  parent.title = mount ? `${colorName} · Parent ${sex === "Femelle" ? "♀" : "♂"}` : `${colorName} ${sex === "Femelle" ? "♀" : "♂"} à trouver`;
  parent.append(createColorVisual(colorName, 36, "obtainable-parent-image"));
  const details = document.createElement("span");
  details.className = "obtainable-parent-details";
  const name = document.createElement("strong");
  name.textContent = colorName;
  const role = document.createElement("small");
  role.textContent = `Parent ${sex === "Femelle" ? "♀" : "♂"}`;
  details.append(name, role);
  if (mount) {
    if (Number.isFinite(mount.level)) {
      const level = document.createElement("small");
      level.textContent = `Niv. ${mount.level}`;
      details.append(level);
    }
    parent.append(details, createFertilityBadge(mount));
  } else {
    const missing = document.createElement("small");
    missing.className = "obtainable-parent-missing";
    missing.textContent = "Parent manquant";
    details.append(missing);
    parent.append(details);
  }
  return parent;
}

function createRecipeParentsVisual(colorNames, selectedParents = null) {
  const container = document.createElement("span");
  container.className = "recipe-parents";
  colorNames.forEach((colorName, index) => {
    if (index > 0) {
      const plus = document.createElement("span");
      plus.className = "recipe-operator";
      plus.textContent = "+";
      container.append(plus);
    }
    const parent = document.createElement("span");
    parent.className = "recipe-parent";
    parent.append(createColorVisual(colorName, 32));
    const label = document.createElement("span");
    label.textContent = colorName;
    parent.append(label);
    let selectedMount = null;
    if (selectedParents) {
      if (selectedParents.female.color === colorName && selectedParents.male.color === colorName) {
        selectedMount = index === 0 ? selectedParents.female : selectedParents.male;
      } else {
        selectedMount = [selectedParents.female, selectedParents.male].find((mount) => mount.color === colorName);
      }
    }
    if (selectedMount) {
      const role = document.createElement("small");
      role.className = "recipe-parent-role";
      role.textContent = isFemale(selectedMount.sex) ? "Parent ♀" : "Parent ♂";
      parent.append(role);
      const level = document.createElement("small");
      level.textContent = `${isFemale(selectedMount.sex) ? "♀" : "♂"} · niv. ${selectedMount.level}`;
      parent.append(level, createFertilityBadge(selectedMount));
      const capacity = document.createElement("small");
      capacity.className = selectedMount.capacity === "Reproducteur" ? "recipe-parent-capacity is-useful-capacity" : "recipe-parent-capacity";
      capacity.textContent = selectedMount.capacity === "Reproducteur"
        ? "Capacité du parent : Reproducteur · Capacité utile ici (+1 bébé)"
        : `Capacité du parent : ${selectedMount.capacity || "Aucune"}`;
      parent.append(capacity);
    }
    container.append(parent);
  });
  return container;
}

function createFertilityBadge(mount) {
  const status = getFertilityStatus(mount);
  const badge = document.createElement("span");
  badge.className = `fertility-badge fertility-${status === "Féconde" ? "fertile" : status === "Pas féconde" ? "infertile" : "unknown"}`;
  const indicator = document.createElement("span");
  indicator.className = "fertility-indicator";
  indicator.setAttribute("aria-hidden", "true");
  badge.append(indicator, document.createTextNode(status));
  badge.setAttribute("aria-label", `Fécondité : ${status}`);
  return badge;
}

function renderObtainableCrossings() {
  const rows = getObtainableCrossings();
  const generationCounts = new Map();
  for (const { color, fertile } of rows) {
    const generation = color.generation;
    const counts = generationCounts.get(generation) || { feasible: 0, total: 0 };
    counts.total += 1;
    if (fertile) counts.feasible += 1;
    generationCounts.set(generation, counts);
  }
  if (!obtainableFilterInitialized) {
    obtainableFeasibleOnly.checked = rows.some(({ fertile }) => fertile);
    obtainableFilterInitialized = true;
  }

  const generations = [...generationCounts.keys()].sort((first, second) => first - second);
  if (!generations.includes(obtainableGenerationTab)) obtainableGenerationTab = generations[0] || 2;
  const activeGenerationCounts = generationCounts.get(obtainableGenerationTab) || { feasible: 0, total: 0 };
  obtainableSummary.textContent = `${activeGenerationCounts.feasible} croisement(s) faisable(s) sur ${activeGenerationCounts.total} pour la génération ${obtainableGenerationTab}.`;
  obtainableGenerationTabs.replaceChildren();
  for (const generation of generations) {
    const counts = generationCounts.get(generation);
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = `obtainable-generation-tab${generation === obtainableGenerationTab ? " active" : ""}${counts.feasible === 0 ? " is-empty" : ""}`;
    tab.id = `obtainable-tab-g${generation}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(generation === obtainableGenerationTab));
    tab.setAttribute("aria-controls", "obtainable-crossings-list");
    tab.tabIndex = generation === obtainableGenerationTab ? 0 : -1;
    tab.dataset.generation = String(generation);
    tab.textContent = `G${generation} · ${counts.feasible}/${counts.total}`;
    tab.title = `${counts.feasible} faisable(s) sur ${counts.total} possible(s)`;
    obtainableGenerationTabs.append(tab);
  }

  obtainableCrossingsList.replaceChildren();
  obtainableCrossingsList.setAttribute("role", "tabpanel");
  obtainableCrossingsList.setAttribute("aria-labelledby", `obtainable-tab-g${obtainableGenerationTab}`);
  const visibleRows = rows
    .filter(({ color }) => color.generation === obtainableGenerationTab)
    .filter(({ fertile }) => (!crossingFertileOnly.checked || fertile)
      && (!obtainableFeasibleOnly.checked || fertile))
    .sort((first, second) => {
      if (first.fertile !== second.fertile) return Number(second.fertile) - Number(first.fertile);
      if (first.probability === null) return second.probability === null ? 0 : 1;
      if (second.probability === null) return -1;
      return second.probability - first.probability
        || Number(second.reproductive) - Number(first.reproductive)
        || first.color.nom.localeCompare(second.color.nom, "fr");
    });

  if (visibleRows.length === 0) {
    const empty = document.createElement("li");
    empty.className = "obtainable-empty";
    empty.textContent = generationCounts.size === 0
      ? "Aucun croisement n’est défini dans data/couleurs.json."
      : "Aucun croisement ne correspond aux filtres pour cette génération.";
    obtainableCrossingsList.append(empty);
    return;
  }

  for (const { color, parents, fertile, probability, reproductive } of visibleRows) {
    const item = document.createElement("li");
    item.className = "obtainable-crossing";
    const header = document.createElement("div");
    header.className = "obtainable-crossing-header";
    const status = document.createElement("span");
    status.className = `obtainable-status ${fertile ? "is-feasible" : parents ? "is-impossible" : "is-missing"}`;
    status.textContent = fertile ? "Faisable" : parents ? "Impossible" : `Il manque : ${getMissingParentDescription(color)}`;
    header.append(status);

    const layout = document.createElement("div");
    layout.className = "obtainable-crossing-layout";
    const [firstColor, secondColor] = color.parents;
    const firstMount = getSelectedRecipeParent(firstColor, 0, color.parents, parents);
    const secondMount = getSelectedRecipeParent(secondColor, 1, color.parents, parents);
    const firstSex = firstMount ? (isFemale(firstMount.sex) ? "Femelle" : "Mâle") : "Femelle";
    const secondSex = secondMount ? (isFemale(secondMount.sex) ? "Femelle" : "Mâle") : "Mâle";
    layout.append(createObtainableParent(firstColor, firstMount, firstSex));
    const plus = document.createElement("span");
    plus.className = "recipe-operator";
    plus.setAttribute("aria-hidden", "true");
    plus.textContent = "+";
    layout.append(plus, createObtainableParent(secondColor, secondMount, secondSex));
    const arrow = document.createElement("span");
    arrow.className = "obtainable-result-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    layout.append(arrow);

    const output = document.createElement("div");
    output.className = "obtainable-output";
    output.append(createColorVisual(color.nom, 48, "recommendation-color"));
    const outputName = document.createElement("strong");
    outputName.textContent = color.nom;
    const generation = document.createElement("span");
    generation.textContent = `G${color.generation}`;
    output.append(outputName, generation);
    layout.append(output);

    const footer = document.createElement("div");
    footer.className = "obtainable-crossing-footer";
    const probabilityText = document.createElement("span");
    probabilityText.className = "obtainable-probability";
    probabilityText.textContent = probability === null
      ? "—"
      : `${formatCrossingRate(probability)} % de réussite`;
    if (probability === null) probabilityText.title = "Renseigne les niveaux des parents pour calculer la chance";
    footer.append(probabilityText);
    if (reproductive && parents) {
      const reproductiveNote = document.createElement("span");
      reproductiveNote.className = "obtainable-reproducteur-note";
      reproductiveNote.append(createIcon("star", "icon capacity-useful-icon"), document.createTextNode(" Capacité utile ici : Reproducteur (+1 bébé)"));
      footer.append(reproductiveNote);
    }

    const planButton = document.createElement("button");
    planButton.type = "button";
    planButton.className = "secondary-button obtainable-plan-button";
    planButton.dataset.planColor = color.nom;
    const alreadyPlanned = plannedCrossings.has(color.nom);
    planButton.textContent = alreadyPlanned ? "Retirer" : "Planifier";
    planButton.setAttribute("aria-pressed", String(alreadyPlanned));
    planButton.disabled = !fertile;
    if (!fertile) planButton.title = parents ? "Parent non fécond" : "Parent manquant";
    footer.append(planButton);
    item.append(header, layout, footer);
    obtainableCrossingsList.append(item);
  }
}

function renderOptimizationPlan() {
  if (!planConfig || !colorsLoaded) return;

  const targetGeneration = Number(generationTarget.value);
  renderObtainableCrossings();
  const plannedRecipeNames = getPlannedRecipeColors();
  const { goalColors, usefulColors, missingParents } = calculateUsefulColors(
    targetGeneration,
    [...plannedCrossings],
  );
  const colorTargets = calculateColorTargets(usefulColors, plannedRecipeNames);
  const generationSummary = new Map();
  const balances = new Map();
  for (const color of usefulColors) {
    const target = colorTargets.get(color.nom);
    const balance = getColorBalance(color, target);
    balances.set(color.nom, balance);
    const summary = generationSummary.get(color.generation) || { colors: 0, target: 0, current: 0, missing: 0 };
    summary.colors += 1;
    summary.target += target.females + target.males;
    summary.current += balance.counts.females + balance.counts.males;
    summary.missing += balance.missingFemales + balance.missingMales;
    generationSummary.set(color.generation, summary);
  }

  const requiredTotal = usefulColors.reduce((total, color) => {
    const target = colorTargets.get(color.nom);
    return total + target.females + target.males;
  }, 0);
  planTargetGenerationValue.textContent = `G${targetGeneration}`;
  planTargetColorCount.textContent = goalColors.length.toLocaleString("fr-FR");
  planStatusMessage.textContent = goalColors.length === 0
    ? `Aucune couleur de génération ${targetGeneration} n’est définie dans data/couleurs.json.`
    : plannedCrossings.size === 0
      ? "Planifie un croisement dans « Ce que je peux obtenir » pour calculer les besoins."
      : "";
  const capacityExceeded = requiredTotal > MAX_MOUNTS;
  if (capacityExceeded) {
    planStatusMessage.textContent += ` L’objectif dépasse le plafond de ${MAX_MOUNTS} montures et ne peut pas être atteint avec ces cibles.`;
  }
  const missingGenerations = [];
  planGenerationTimeline.replaceChildren();
  for (let generation = 1; generation <= targetGeneration; generation += 1) {
    const summary = generationSummary.get(generation) || { colors: 0, target: 0, current: 0, missing: 0 };
    const hasNeed = summary.target > 0;
    const isComplete = hasNeed && summary.missing === 0;
    if (generation > 1) {
      const connector = document.createElement("span");
      connector.className = "plan-generation-connector";
      connector.setAttribute("aria-hidden", "true");
      connector.textContent = "→";
      planGenerationTimeline.append(connector);
    }
    const step = document.createElement("article");
    step.className = `plan-generation-step${!hasNeed ? " is-unnecessary" : isComplete ? " is-complete" : " is-missing"}`;
    if (hasNeed && !isComplete) missingGenerations.push(generation);
    step.setAttribute("aria-label", hasNeed
      ? `G${generation} : ${summary.current} en stock sur ${summary.target} nécessaires${isComplete ? ", complet" : ", manquant"}`
      : `G${generation} : non nécessaire`);
    const heading = document.createElement("h4");
    heading.textContent = `G${generation}`;
    const createMetric = (labelText, value) => {
      const metric = document.createElement("p");
      const label = document.createElement("span");
      label.textContent = labelText;
      const count = document.createElement("strong");
      count.textContent = String(value);
      metric.append(label, count);
      return metric;
    };
    const stock = createMetric("À avoir", summary.target);
    const owned = createMetric("En stock", summary.current);
    const status = document.createElement("span");
    status.className = "plan-generation-status";
    status.textContent = !hasNeed ? "— Non nécessaire" : isComplete ? "✓ Complet" : "⚠ Manquant";
    step.append(heading, stock, owned, status);
    planGenerationTimeline.append(step);
  }
  if (missingGenerations.length === 1 && missingGenerations[0] === 1) {
    planGenerationTimeline.querySelector(".plan-generation-step.is-missing")?.classList.add("is-capture-only");
  }

  const balanceRows = usefulColors.map((color) => {
    const balance = balances.get(color.nom);
    const missing = balance.missingFemales > 0 || balance.missingMales > 0;
    const hasSurplus = balance.surplus > 0;
    const status = balance.target.crossings === 0
      ? "unused"
      : missing ? "missing" : hasSurplus ? "surplus" : "balanced";
    return { color, balance, status };
  });
  const balanceSummary = balanceRows.reduce((summary, row) => {
    if (row.status !== "unused") summary[row.status] += 1;
    else summary.unused += 1;
    return summary;
  }, { missing: 0, surplus: 0, balanced: 0, unused: 0 });
  planBalanceSummary.textContent = `${balanceSummary.balanced} couleurs parfaites · ${balanceSummary.missing} couleurs manquantes · ${balanceSummary.surplus} couleurs en surplus · ${balanceSummary.unused} non utilisées dans le plan.`;

  const visibleBalanceRows = balanceRows
    .filter(({ color, status }) => {
      if (planBalanceFilter === "all") return true;
      if (planBalanceFilter === "capture") return status === "missing" && color.generation === 1;
      if (planBalanceFilter === "cross") return status === "missing" && color.generation >= 2;
      return status === planBalanceFilter;
    })
    .sort((first, second) => first.color.generation - second.color.generation
      || ["missing", "surplus", "balanced", "unused"].indexOf(first.status) - ["missing", "surplus", "balanced", "unused"].indexOf(second.status)
      || first.color.nom.localeCompare(second.color.nom, "fr"));
  planBalance.replaceChildren();
  let visibleGeneration = null;
  for (const { color, balance, status } of visibleBalanceRows) {
    if (visibleGeneration !== color.generation) {
      visibleGeneration = color.generation;
      const groupRow = document.createElement("tr");
      groupRow.className = "balance-generation-heading";
      const groupCell = document.createElement("th");
      groupCell.scope = "rowgroup";
      groupCell.colSpan = 6;
      groupCell.textContent = `Génération ${color.generation}`;
      groupRow.append(groupCell);
      planBalance.append(groupRow);
    }

    const row = document.createElement("tr");
    row.className = `balance-row balance-row-${status}`;
    const crossingCount = balance.target.crossings;
    const crossingLabel = crossingCount === 1 ? "utilisation comme parent" : "utilisations comme parent";
    const calculation = crossingCount > 0
      ? `Cette couleur est requise dans ${crossingCount} ${crossingLabel}${safetyMargin ? `, plus ${safetyMargin} monture(s) de marge par sexe` : ""}.`
      : "Pas utile pour ton objectif actuel.";
    row.title = `${calculation} Stock actuel : ${balance.counts.females} femelle(s) et ${balance.counts.males} mâle(s).`;

    const colorCell = document.createElement("td");
    colorCell.append(createColorVisual(color.nom));
    row.append(colorCell);

    const generationCell = document.createElement("td");
    generationCell.textContent = `G${color.generation}`;
    row.append(generationCell);

    for (const [sex, stock, need, label] of [
      ["female", balance.counts.females, balance.target.females, "Femelles"],
      ["male", balance.counts.males, balance.target.males, "Mâles"],
    ]) {
      const cell = document.createElement("td");
      const stockText = document.createElement("span");
      stockText.className = "balance-stock-text";
      const sexSymbol = sex === "female" ? "♀" : "♂";
      stockText.textContent = `${sexSymbol} ${stock} possédées · ${need} nécessaire${need === 1 ? "" : "s"}`;
      const progress = document.createElement("span");
      const progressStatus = crossingCount === 0
        ? "unused"
        : stock < need ? "missing" : stock > need ? "surplus" : "balanced";
      progress.className = `balance-stock-progress balance-stock-${progressStatus}`;
      progress.setAttribute("role", "progressbar");
      progress.setAttribute("aria-label", `${label} : ${stock} en stock, besoin ${need}`);
      progress.setAttribute("aria-valuemin", "0");
      progress.setAttribute("aria-valuemax", "100");
      progress.setAttribute("aria-valuenow", String(need === 0 ? (stock > 0 ? 100 : 0) : Math.min(100, Math.round((stock / need) * 100))));
      const fill = document.createElement("span");
      fill.className = "balance-stock-fill";
      fill.style.width = `${need === 0 ? (stock > 0 ? 100 : 0) : Math.min(100, (stock / need) * 100)}%`;
      progress.append(fill);
      cell.append(stockText, progress);
      row.append(cell);
    }

    const actionCell = document.createElement("td");
    actionCell.className = `balance-action balance-action-${status}${status === "missing" && color.generation >= 2 ? " balance-action-cross" : ""}`;
    const surplusFemales = Math.max(0, balance.counts.females - balance.target.females);
    const surplusMales = Math.max(0, balance.counts.males - balance.target.males);
    if (status === "unused") {
      const message = document.createElement("span");
      message.textContent = "Pas utile pour ton objectif actuel. ";
      const seeUses = document.createElement("button");
      seeUses.type = "button";
      seeUses.className = "secondary-button compact-button";
      seeUses.textContent = "Voir à quoi elle peut servir";
      seeUses.dataset.useColor = color.nom;
      actionCell.append(message, seeUses);
    } else if (status === "missing" && color.generation === 1) {
      const need = [
        balance.missingFemales ? `${balance.missingFemales} ♀` : "",
        balance.missingMales ? `${balance.missingMales} ♂` : "",
      ].filter(Boolean).join(" et ");
      actionCell.textContent = `Il te faut ${need} de plus : à capturer.`;
    } else if (status === "missing") {
      const recommendation = document.createElement("div");
      recommendation.className = "balance-crossing-recommendation";
      const message = document.createElement("span");
      const missing = [
        balance.missingFemales ? `${balance.missingFemales} ♀` : "",
        balance.missingMales ? `${balance.missingMales} ♂` : "",
      ].filter(Boolean).join(" et ");
      message.textContent = `Il te faut ${missing} de plus :`;
      recommendation.append(message);
      let parents = findRecommendedParents(color);
      if (!parents) parents = findRecommendedParents(color, true);
      if (Array.isArray(color.parents) && color.parents.length === 2) {
        recommendation.append(createRecipeParentsVisual(color.parents, parents));
        const arrow = document.createElement("span");
        arrow.className = "recipe-operator";
        arrow.textContent = "→";
        const output = document.createElement("span");
        output.className = "balance-crossing-output";
        output.append(arrow, createColorVisual(color.nom, 32));
        recommendation.append(output);
      } else {
        recommendation.append(document.createTextNode("Aucune recette connue."));
      }
      actionCell.append(recommendation);
    } else if (status === "surplus") {
      actionCell.textContent = color.generation >= 2
        ? `Garde-les pour la génération suivante, ou relâche-en ${surplusFemales + surplusMales} (${surplusFemales} ♀ et ${surplusMales} ♂).`
        : `Tu peux en relâcher ${surplusFemales} ♀ et ${surplusMales} ♂.`;
    } else {
      actionCell.append(createIcon("check", "icon action-status-icon"), document.createTextNode("Parfait, rien à faire"));
    }
    const fertilityCell = document.createElement("td");
    fertilityCell.className = "balance-fertility-counts";
    for (const [sex, count, need] of [
      ["♀", balance.fertileCounts.females, balance.target.females],
      ["♂", balance.fertileCounts.males, balance.target.males],
    ]) {
      const line = document.createElement("span");
      const insufficient = count < need;
      line.className = insufficient ? "is-fertility-insufficient" : "";
      line.textContent = `${count} / ${need} fécondes ${sex}`;
      if (insufficient) line.title = `Il faut ${need} monture(s) féconde(s) de sexe ${sex} pour le plan.`;
      fertilityCell.append(line);
    }
    row.append(actionCell);
    row.insertBefore(fertilityCell, actionCell);
    planBalance.append(row);
  }
  if (visibleBalanceRows.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 6;
    emptyCell.className = "balance-empty";
    emptyCell.textContent = usefulColors.length ? "Aucune couleur ne correspond à ce filtre." : "Aucune couleur utile pour cette génération.";
    emptyRow.append(emptyCell);
    planBalance.append(emptyRow);
  }

  const captureActions = [];
  const crossActions = [];
  const releaseActions = [];
  let releaseIndex = 0;
  const usefulNames = new Set(usefulColors.map((color) => color.nom));
  const mountsByColorSex = new Map();

  for (const color of usefulColors) {
    const balance = balances.get(color.nom);
    if (balance.target.crossings === 0) continue;
    if (color.generation === 1 && !capacityExceeded) {
      if (balance.missingFemales) {
        captureActions.push({
          id: `capture:${color.nom}:F`,
          color: color.nom,
          generation: 1,
          sex: "Femelle",
          count: balance.missingFemales,
          text: `Capturer ${balance.missingFemales} femelle(s) (G1).`,
        });
      }
      if (balance.missingMales) {
        captureActions.push({
          id: `capture:${color.nom}:M`,
          color: color.nom,
          generation: 1,
          sex: "Mâle",
          count: balance.missingMales,
          text: `Capturer ${balance.missingMales} mâle(s) (G1).`,
        });
      }
    } else if (color.generation >= 2 && !capacityExceeded && (balance.missingFemales || balance.missingMales)) {
      const parents = findRecommendedParents(color);
      const probability = parents ? getCrossingProbability(parents.female, parents.male) : null;
      const reproductive = parents
        ? parents.female.capacity === "Reproducteur" || parents.male.capacity === "Reproducteur"
        : false;
      const needed = [
        balance.missingFemales ? `${balance.missingFemales} F` : "",
        balance.missingMales ? `${balance.missingMales} M` : "",
      ].filter(Boolean).join(" / ");
      const pairDescription = parents
        ? `${getMountName(parents.female, mounts.indexOf(parents.female))} × ${getMountName(parents.male, mounts.indexOf(parents.male))}`
        : (color.parents || []).join(" + ");
      const fertilityNote = parents && (!isFertile(parents.female) || !isFertile(parents.male))
        ? " Vérifie la fécondité : les deux parents doivent être déclarés féconds."
        : "";
      crossActions.push({
        id: `cross:${color.nom}:${pairDescription}`,
        color: color.nom,
        generation: color.generation,
        missingCount: balance.missingFemales + balance.missingMales,
        parentColors: color.parents || [],
        resultColor: color.nom,
        parentsAvailable: Boolean(parents),
        reproductive,
        text: parents
          ? `${pairDescription} → manque ${needed}.${probability === null ? " Probabilité non calculée : niveau manquant." : ` Réussite de génération : ${probability.toFixed(1)} %`}${reproductive ? ` ; Reproducteur (+${planConfig.crossing.reproducteurExtraBabies} bébé)` : ""}.${fertilityNote} La probabilité exacte d’obtenir cette couleur n’est pas connue.`
          : `À obtenir par croisement : ${pairDescription} → ${color.nom}. Aucun couple avec les sexes requis n’est actuellement en stock.`,
      });
    }

    const currentMounts = mounts.filter((mount) => mount.color === color.nom);
    const excessFemaleIndexes = currentMounts
      .map((mount, index) => ({ mount, index }))
      .filter(({ mount }) => isFemale(mount.sex))
      .slice(balance.target.females)
      .map(({ mount }) => mount);
    const excessMaleMounts = currentMounts
      .filter((mount) => isMale(mount.sex))
      .slice(balance.target.males);
    for (const mount of [...excessFemaleIndexes, ...excessMaleMounts]) {
      const globalIndex = mounts.indexOf(mount);
      releaseActions.push({
        id: `release:surplus:${mount.name || mount.nom || `${mount.color}:${mount.sex}:${globalIndex}`}`,
        color: mount.color,
        text: `${getMountName(mount, globalIndex)} : surplus au regard de la cible ${balance.target.females} F / ${balance.target.males} M.`,
      });
    }
  }

  crossActions.sort((first, second) => first.generation - second.generation
    || Number(second.reproductive) - Number(first.reproductive));

  const missingCaptureColors = usefulColors.filter((color) => {
    const balance = balances.get(color.nom);
    return color.generation === 1 && balance.target.crossings > 0
      && (balance.missingFemales > 0 || balance.missingMales > 0);
  });
  const missingCaptureCount = missingCaptureColors.reduce((total, color) => {
    const balance = balances.get(color.nom);
    return total + balance.missingFemales + balance.missingMales;
  }, 0);
  planTargetCaptureCount.textContent = missingCaptureCount.toLocaleString("fr-FR");

  if (goalColors.length === 0) {
    planNextAction.textContent = `Aucune couleur cible définie pour G${targetGeneration}.`;
  } else if (plannedCrossings.size === 0) {
    planNextAction.textContent = "Planifier un croisement pour calculer les besoins de cet objectif.";
  } else if (missingCaptureCount > 0) {
    planNextAction.textContent = `Capturer ${missingCaptureCount} monture${missingCaptureCount > 1 ? "s" : ""} G1 dans ${missingCaptureColors.length} couleur${missingCaptureColors.length > 1 ? "s" : ""}.`;
  } else {
    const nextMissingGeneration = [...generationSummary.keys()]
      .filter((generation) => generation > 1)
      .sort((first, second) => first - second)
      .find((generation) => {
        const summary = generationSummary.get(generation);
        return summary.missing > 0;
      });
    if (nextMissingGeneration) {
      const missingAtGeneration = usefulColors
        .filter((color) => color.generation === nextMissingGeneration)
        .map((color) => balances.get(color.nom));
      const missingMounts = missingAtGeneration.reduce((total, balance) => (
        total + balance.missingFemales + balance.missingMales
      ), 0);
      const missingColorCount = missingAtGeneration.filter((balance) => (
        balance.missingFemales > 0 || balance.missingMales > 0
      )).length;
      planNextAction.textContent = `Obtenir ${missingMounts} monture${missingMounts > 1 ? "s" : ""} de ${missingColorCount} couleur${missingColorCount > 1 ? "s" : ""} en G${nextMissingGeneration}.`;
    } else {
      planNextAction.textContent = "Objectif atteint : toutes les montures nécessaires sont en stock.";
    }
  }

  mounts.forEach((mount, index) => {
    if (usefulNames.has(mount.color)) return;
    releaseActions.push({
      id: `release:unused:${mount.name || mount.nom || `${mount.color}:${mount.sex}:${index}`}`,
      color: mount.color,
      text: `${getMountName(mount, index)} : couleur non nécessaire pour l’objectif actuel.`,
    });
  });

  const cloneExtractActions = [];
  planCloneExtractNote.textContent = "Aucune recommandation : les données ne précisent ni stérilité ni sénilité ; l’éligibilité au clonage et à l’extraction ne peut pas être vérifiée.";
  const planErrors = [];
  if (planNotice) planErrors.push(planNotice);
  if (missingParents.length > 0) {
    planErrors.push(`Parents absents de data/couleurs.json : ${missingParents.join(", ")}.`);
  }
  if (capacityExceeded) {
    planErrors.push(`Cible irréalisable : le stock nécessaire (${requiredTotal}) dépasse le maximum de ${MAX_MOUNTS}.`);
  }
  if (planErrors.length > 0) {
    planError.textContent = planErrors.join(" ");
    planError.hidden = false;
  } else {
    planError.hidden = true;
  }

  dashboardPlanActions = [...captureActions, ...crossActions, ...cloneExtractActions, ...releaseActions];
  renderPlanActionList(planCaptureActions, captureActions, "Aucune capture G1 à prévoir.");
  renderPlanActionList(planCrossActions, crossActions, "Aucun croisement possible à recommander pour le moment.");
  renderPlanActionList(planCloneActions, cloneExtractActions, "Aucune action sûre à recommander avec les données disponibles.");
  renderPlanActionList(planReleaseActions, releaseActions, "Aucune monture à sortir pour cet objectif.");
  renderPlanActionList(planAllActions, dashboardPlanActions, "Aucune action à faire pour le moment.");
  renderDashboardGuidance();
}

function renderMounts() {
  mountList.replaceChildren();

  const anonymousDuplicates = new Map();
  for (const mount of mounts) {
    if (getMountName(mount)) continue;
    const key = `${mount.color}|${getMountGeneration(mount)}|${isFemale(mount.sex) ? "F" : "M"}`;
    anonymousDuplicates.set(key, (anonymousDuplicates.get(key) || 0) + 1);
  }
  const duplicateIndexes = new Map();
  const query = normalizeSearch(mountSearch.value.trim());
  const filteredMounts = mounts.map((mount, index) => ({ mount, index }))
    .filter(({ mount }) => {
      const name = getMountName(mount);
      const generation = getMountGeneration(mount);
      if (query && !normalizeSearch(`${name} ${mount.color}`).includes(query)) return false;
      if (generationFilter.value && String(generation) !== generationFilter.value) return false;
      if (sexFilter.value && (isFemale(mount.sex) ? "Femelle" : "Mâle") !== sexFilter.value) return false;
      if (colorFilterSelect.value && mount.color !== colorFilterSelect.value) return false;
      if (unnamedFilter.checked && name) return false;
      if (capacityFilter.value && mount.capacity !== capacityFilter.value) return false;
      if (mountFertileOnly.checked && !isFertile(mount)) return false;
      return true;
    });

  const sortBy = mountSort.value;
  filteredMounts.sort((first, second) => {
    let order = 0;
    if (sortBy === "generation") {
      order = (getMountGeneration(first.mount) || 0) - (getMountGeneration(second.mount) || 0);
    } else if (sortBy === "level") {
      order = (first.mount.level ?? 0) - (second.mount.level ?? 0);
    } else if (sortBy === "name") {
      order = getMountName(first.mount).localeCompare(getMountName(second.mount), "fr", { sensitivity: "base" });
    } else if (sortBy === "color") {
      order = first.mount.color.localeCompare(second.mount.color, "fr", { sensitivity: "base" });
    }
    return (order * mountSortDirection) || first.index - second.index;
  });

  for (const { mount, index } of filteredMounts) {
    const row = document.createElement("tr");
    const identityCell = document.createElement("td");
    const identity = document.createElement("div");
    identity.className = "mount-identity";
    identity.append(createColorVisual(mount.color, 32, "mount-thumbnail"));
    const description = document.createElement("span");
    description.className = "mount-identity-description";
    if (getMountName(mount)) {
      const name = document.createElement("strong");
      name.textContent = getMountName(mount);
      description.append(name, document.createTextNode(` · ${getMountDescription(mount)}`));
    } else {
      description.textContent = getMountDescription(mount);
      const duplicateKey = `${mount.color}|${getMountGeneration(mount)}|${isFemale(mount.sex) ? "F" : "M"}`;
      if (anonymousDuplicates.get(duplicateKey) > 1) {
        const duplicateNumber = (duplicateIndexes.get(duplicateKey) || 0) + 1;
        duplicateIndexes.set(duplicateKey, duplicateNumber);
        const badge = document.createElement("span");
        badge.className = "mount-duplicate-badge";
        badge.textContent = `#${duplicateNumber}`;
        description.append(" ", badge);
      }
    }
    identity.append(description);
    identityCell.append(identity);
    row.append(identityCell, createLevelCell(mount, index));

    const capacityCell = document.createElement("td");
    const capacityBadge = document.createElement("span");
    capacityBadge.className = `capacity-badge capacity-${Math.max(0, CAPACITIES.indexOf(mount.capacity))}`;
    capacityBadge.textContent = mount.capacity || "Aucune";
    capacityCell.append(capacityBadge);
    row.append(capacityCell);
    row.append(createFertilityCell(mount, index));
    row.append(createReproductionCountCell(mount, index));

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.className = "secondary-button icon-action";
    renameButton.textContent = "✎";
    renameButton.title = "Renommer";
    renameButton.setAttribute("aria-label", `Renommer ${getMountDisplayName(mount)}`);
    renameButton.addEventListener("click", () => renameMount(index));
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "secondary-button icon-action";
    editButton.textContent = "⚙";
    editButton.title = "Modifier la capacité";
    editButton.setAttribute("aria-label", `Modifier la capacité de ${getMountDisplayName(mount)}`);
    editButton.addEventListener("click", () => startCapacityEdit(index));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "secondary-button icon-action is-danger";
    deleteButton.textContent = "×";
    deleteButton.title = "Supprimer";
    deleteButton.setAttribute("aria-label", `Supprimer ${getMountDisplayName(mount)}`);
    deleteButton.addEventListener("click", () => deleteMount(index));
    actions.append(renameButton, editButton, deleteButton);
    actionsCell.append(actions);
    row.append(actionsCell);
    mountList.append(row);
  }

  renderMountFilterChips();
  renderMountSortIndicators();
  renderMountEmptyState();
  renderOverview();
  updateFormAvailability();
  updateQuantityValidity();
}

function renderMountEmptyState() {
  const hasResults = mountList.children.length > 0;
  emptyState.hidden = hasResults;
  if (hasResults) return;

  emptyState.replaceChildren();
  const icon = document.createElement("span");
  icon.className = "mount-empty-icon";
  icon.setAttribute("aria-hidden", "true");
  const title = document.createElement("h3");
  const description = document.createElement("p");
  const actions = document.createElement("div");
  actions.className = "mount-empty-actions";

  if (mounts.length > 0) {
    icon.append(createIcon("search", "icon mount-empty-symbol"));
    title.textContent = "Aucun résultat pour ces filtres";
    description.textContent = "Modifie tes critères ou efface les filtres pour retrouver tes montures.";
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "secondary-button";
    clearButton.textContent = "Effacer les filtres";
    clearButton.addEventListener("click", clearAllMountFilters);
    actions.append(clearButton);
  } else {
    icon.append(createIcon("sprout", "icon mount-empty-symbol"));
    title.textContent = "Aucune monture enregistrée";
    description.textContent = "Ajoute tes montures pour voir ton élevage ici.";
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "Ajouter une monture";
    addButton.addEventListener("click", () => {
      document.querySelector("#mount-detail").open = true;
      document.querySelector("#color-select-trigger").focus();
    });
    const importButton = document.createElement("button");
    importButton.type = "button";
    importButton.className = "secondary-button";
    importButton.textContent = "Importer depuis une capture";
    importButton.addEventListener("click", () => captureImportFile.click());
    actions.append(addButton, importButton);
  }

  emptyState.append(icon, title, description, actions);
}

function getActiveMountFilters() {
  const filters = [];
  if (mountSearch.value.trim()) filters.push({ label: `Recherche : ${mountSearch.value.trim()}`, clear: () => { mountSearch.value = ""; } });
  if (generationFilter.value) filters.push({ label: `Gén. ${generationFilter.value}`, clear: () => { generationFilter.value = ""; } });
  if (sexFilter.value) filters.push({ label: sexFilter.value === "Femelle" ? "♀ Femelle" : "♂ Mâle", clear: () => { sexFilter.value = ""; } });
  if (colorFilterSelect.value) filters.push({ label: `Couleur : ${colorFilterSelect.value}`, clear: () => { colorFilterSelect.value = ""; } });
  if (capacityFilter.value) filters.push({ label: `Capacité : ${capacityFilter.value}`, clear: () => { capacityFilter.value = ""; } });
  if (unnamedFilter.checked) filters.push({ label: "Sans nom", clear: () => { unnamedFilter.checked = false; } });
  if (mountFertileOnly.checked) filters.push({ label: "Fécondes", clear: () => { mountFertileOnly.checked = false; } });
  return filters;
}

function renderMountFilterChips() {
  const filters = getActiveMountFilters();
  mountFilterCount.textContent = String(filters.length);
  mountFilterCount.hidden = filters.length === 0;
  clearMountFilters.hidden = filters.length === 0;
  activeMountFilters.replaceChildren();
  for (const filter of filters) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip";
    chip.setAttribute("aria-label", `Retirer le filtre ${filter.label}`);
    chip.append(document.createTextNode(filter.label), document.createTextNode(" ×"));
    chip.addEventListener("click", () => {
      filter.clear();
      colorFilterSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });
    activeMountFilters.append(chip);
  }
}

function renderMountSortIndicators() {
  for (const button of document.querySelectorAll(".mount-sort-heading [data-sort]")) {
    const active = button.dataset.sort === mountSort.value;
    button.classList.toggle("is-active", active);
    button.querySelector("span").textContent = active ? (mountSortDirection === 1 ? "↑" : "↓") : "↕";
    button.closest("th").setAttribute("aria-sort", active
      ? (mountSortDirection === 1 ? "ascending" : "descending")
      : "none");
  }
}

function clearAllMountFilters() {
  mountSearch.value = "";
  generationFilter.value = "";
  sexFilter.value = "";
  colorFilterSelect.value = "";
  capacityFilter.value = "";
  unnamedFilter.checked = false;
  mountFertileOnly.checked = false;
  colorFilterSelect.dispatchEvent(new Event("change", { bubbles: true }));
}

function createLevelCell(mount, index) {
  const cell = document.createElement("td");
  const editor = createLevelEditor(mount, index, "mount-level-editor");
  cell.append(editor);
  return cell;
}

function createFertilityCell(mount, index) {
  const cell = document.createElement("td");
  const editor = document.createElement("div");
  editor.className = "fertility-editor";
  editor.append(createFertilityBadge(mount));
  const select = document.createElement("select");
  select.className = "fertility-select";
  select.setAttribute("aria-label", `Fécondité de ${getMountDisplayName(mount)}`);
  for (const status of FERTILITY_STATUSES) {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    select.append(option);
  }
  select.value = getFertilityStatus(mount);
  select.addEventListener("change", () => updateMountFields(index, { fertility: select.value }, "La fécondité n’a pas pu être sauvegardée."));
  editor.append(select);
  cell.append(editor);
  return cell;
}

function createReproductionCountCell(mount, index) {
  const cell = document.createElement("td");
  const counter = document.createElement("div");
  counter.className = "reproduction-counter";
  const remaining = getRemainingReproductions(mount);
  const value = document.createElement("span");
  value.className = "reproduction-count";
  value.textContent = remaining === null ? "Non renseigné" : String(remaining);
  value.setAttribute("aria-label", remaining === null ? "Reproductions restantes non renseignées" : `${remaining} reproductions restantes`);

  const decrement = document.createElement("button");
  decrement.type = "button";
  decrement.className = "counter-button reproduction-step";
  decrement.textContent = "−";
  decrement.setAttribute("aria-label", `Diminuer les reproductions restantes de ${getMountDisplayName(mount)}`);
  decrement.disabled = remaining === null || remaining === 0;
  decrement.addEventListener("click", () => updateMountFields(index, { remainingReproductions: remaining - 1 }, "Le compteur de reproductions n’a pas pu être sauvegardé."));

  const increment = document.createElement("button");
  increment.type = "button";
  increment.className = "counter-button reproduction-step";
  increment.textContent = "+";
  increment.setAttribute("aria-label", `Augmenter les reproductions restantes de ${getMountDisplayName(mount)}`);
  increment.addEventListener("click", () => updateMountFields(index, {
    remainingReproductions: remaining === null ? 1 : remaining + 1,
  }, "Le compteur de reproductions n’a pas pu être sauvegardé."));

  counter.append(decrement, value, increment);
  cell.append(counter);
  return cell;
}

function updateMountFields(index, changes, errorMessage) {
  if (!mounts[index]) return;
  const nextMounts = mounts.map((mount, mountIndex) => (
    mountIndex === index ? { ...mount, ...changes } : mount
  ));
  saveMounts(nextMounts, errorMessage);
}

function createLevelEditor(mount, index, className) {
  const editor = document.createElement("div");
  editor.className = className;
  const range = document.createElement("input");
  range.type = "range";
  range.min = "0";
  range.max = "200";
  range.step = "1";
  range.value = String(mount.level ?? 0);
  range.className = "level-range";
  range.setAttribute("aria-label", `Niveau de ${getMountDisplayName(mount)}`);
  const setRangeProgress = () => {
    range.style.setProperty("--level-progress", `${(Number(range.value) / 200) * 100}%`);
  };
  setRangeProgress();
  const number = document.createElement("input");
  number.type = "number";
  number.min = "0";
  number.max = "200";
  number.step = "1";
  number.value = String(mount.level ?? 0);
  number.className = "level-number";
  number.setAttribute("aria-label", `Niveau numérique de ${getMountDisplayName(mount)}`);
  for (const input of [range, number]) {
    input.addEventListener("input", () => {
      range.value = input.value;
      number.value = input.value;
      setRangeProgress();
    });
    input.addEventListener("change", () => updateMountLevel(index, input));
  }
  editor.append(range, number);
  return editor;
}

function renameMount(index) {
  const mount = mounts[index];
  if (!mount) return;
  const enteredName = window.prompt("Nom exact de la monture dans le jeu (laisser vide pour retirer le nom) :", getMountName(mount));
  if (enteredName === null) return;
  const updatedMounts = mounts.map((entry, mountIndex) => (
    mountIndex === index ? { ...entry, name: enteredName.trim() } : entry
  ));
  saveMounts(updatedMounts, "Le nom n’a pas pu être sauvegardé.");
}

function saveMounts(nextMounts, errorMessage = "La sauvegarde a échoué. Les modifications n’ont pas été appliquées.", recordUndo = true) {
  if (nextMounts.length > MAX_MOUNTS) {
    showTransferMessage(`Le total ne peut pas dépasser ${MAX_MOUNTS} montures.`, true);
    return false;
  }

  const previousMounts = mounts;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMounts));
  } catch {
    showStorageError(errorMessage);
    return false;
  }

  mounts = nextMounts;
  if (recordUndo) {
    lastUndoMounts = previousMounts;
    lastUndoExpires = Date.now() + 5000;
  } else {
    lastUndoMounts = null;
    lastUndoExpires = 0;
  }
  renderMounts();
  renderCrossingCalculator();
  renderOptimizationPlan();
  updateSaveStatus();
  if (recordUndo) showTransferMessage("Modifications enregistrées.");
  return true;
}

function getStoredMountName(value) {
  const name = typeof value.name === "string" ? value.name : typeof value.nom === "string" ? value.nom : "";
  const sex = isFemale(value.sex ?? value.sexe) ? "F" : "M";
  const legacyPattern = new RegExp(`^${escapeRegExp(value.color)}-${sex}-\\d+$`);
  return legacyPattern.test(name.trim()) ? "" : name.trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeStoredMount(value) {
  if (!isBaseMount(value)) {
    return null;
  }

  const generation = value.generation === undefined ? null : value.generation;
  if (generation !== null && !isGeneration(generation)) {
    return null;
  }

  return {
    name: getStoredMountName(value),
    color: value.color,
    sex: value.sex,
    level: Number.isFinite(value.level) ? Math.min(200, Math.max(0, Math.round(value.level))) : 0,
    generation,
    capacity: CAPACITIES.includes(value.capacity) ? value.capacity : "Aucune",
    fertility: value.fertility === undefined && value.fecondite === undefined
      ? "Inconnu"
      : FERTILITY_STATUSES.includes(value.fertility ?? value.fecondite)
        ? value.fertility ?? value.fecondite
        : null,
    remainingReproductions: value.remainingReproductions === undefined && value.reproductionsRestantes === undefined
      ? null
      : Number.isInteger(value.remainingReproductions ?? value.reproductionsRestantes)
        && (value.remainingReproductions ?? value.reproductionsRestantes) >= 0
        ? value.remainingReproductions ?? value.reproductionsRestantes
        : NaN,
  };
}

function loadMounts() {
  let savedMounts;

  try {
    savedMounts = localStorage.getItem(STORAGE_KEY);
  } catch {
    showStorageError("Impossible d’accéder au stockage du navigateur. Les montures ne peuvent pas être sauvegardées.");
    renderMounts();
    return;
  }

  if (savedMounts === null) {
    renderMounts();
    return;
  }

  try {
    const parsedMounts = JSON.parse(savedMounts);
    if (!Array.isArray(parsedMounts) || parsedMounts.length > MAX_MOUNTS) {
      throw new Error("Stored mount data is invalid");
    }

    const normalizedMounts = parsedMounts.map(normalizeStoredMount);
    if (normalizedMounts.some((mount) => mount === null
      || !FERTILITY_STATUSES.includes(mount.fertility)
      || (mount.remainingReproductions !== null
        && (!Number.isInteger(mount.remainingReproductions) || mount.remainingReproductions < 0)))) {
      throw new Error("Stored mount data is invalid");
    }

    mounts = normalizedMounts;
    if (JSON.stringify(parsedMounts) !== JSON.stringify(mounts)) {
      if (!saveMounts(mounts, "La migration du stockage a échoué. Les anciennes données sont conservées et les modifications sont désactivées.", false)) {
        return;
      }
    }
  } catch {
    showStorageError("Les données de montures enregistrées sont illisibles. Elles n’ont pas été modifiées.");
  }

  renderMounts();
}

function updateColorOptions() {
  colorSelect.disabled = !colorsLoaded || colors.length === 0;
  customColorSelect.update(colors, colorsLoaded);
  customColorFilter.update(colors, colorsLoaded);

  const previousGeneration = generationFilter.value;
  generationFilter.replaceChildren(new Option("Toutes", ""));
  for (const generation of [...new Set(colors.map((color) => color.generation))].sort((a, b) => a - b)) {
    generationFilter.append(new Option(`Gén. ${generation}`, String(generation)));
  }
  if ([...generationFilter.options].some((option) => option.value === previousGeneration)) {
    generationFilter.value = previousGeneration;
  }

  const previousBulkColor = bulkColorSelect.value;
  bulkColorSelect.replaceChildren(new Option("Sélectionner une couleur", ""));
  for (const color of colors) {
    bulkColorSelect.append(new Option(`${color.nom} (Gén. ${color.generation})`, color.nom));
  }
  if (colors.some((color) => color.nom === previousBulkColor)) bulkColorSelect.value = previousBulkColor;
  bulkColorSelect.disabled = !colorsLoaded || colors.length === 0;
  updateFormAvailability();
  renderMounts();
}

function updateCapacityOptions() {
  for (const select of [capacityEditSelect, capacityFilter]) {
    const firstOption = select.querySelector("option");
    select.replaceChildren();
    if (select === capacityFilter) {
      const allOption = document.createElement("option");
      allOption.value = "";
      allOption.textContent = "Toutes les capacités";
      select.append(allOption);
    } else {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Sélectionner une capacité";
      select.append(placeholder);
    }

    for (const capacity of CAPACITIES) {
      const option = document.createElement("option");
      option.value = capacity;
      option.textContent = capacity;
      const description = capacityDescriptions[capacity];
      if (description) option.title = description;
      select.append(option);
    }
    if (!firstOption && select === capacityFilter) select.value = "";
  }

  capacityLegend.replaceChildren();
  for (const capacity of CAPACITIES) {
    const item = document.createElement("li");
    const name = document.createElement("strong");
    name.textContent = `${capacity} : `;
    item.append(name, document.createTextNode(capacityDescriptions[capacity] || "Description indisponible."));
    capacityLegend.append(item);
  }
}

function renderCapacityCounters(sexKey) {
  const container = document.querySelector(sexKey === "females" ? "#female-capacities" : "#male-capacities");
  const total = Number(sexKey === "females" ? femaleCountInput.value : maleCountInput.value);
  const counts = desiredCapacityCounts[sexKey];
  const allocated = Object.values(counts).reduce((sum, count) => sum + count, 0);
  container.replaceChildren();

  for (const capacity of editableCapacities) {
    const counter = document.createElement("div");
    counter.className = "capacity-counter";
    const label = document.createElement("span");
    label.className = "capacity-counter-label";
    label.textContent = capacity;
    label.title = capacityDescriptions[capacity] || capacity;
    const controls = document.createElement("div");
    controls.className = "counter-controls";
    const decrement = document.createElement("button");
    decrement.type = "button";
    decrement.className = "counter-button";
    decrement.textContent = "−";
    decrement.setAttribute("aria-label", `Retirer une capacité ${capacity}`);
    decrement.disabled = (counts[capacity] || 0) === 0;
    decrement.addEventListener("click", () => {
      counts[capacity] = Math.max(0, (counts[capacity] || 0) - 1);
      renderCapacityCounters(sexKey);
      updateQuantityValidity();
    });
    const value = document.createElement("span");
    value.className = "counter-value";
    value.textContent = String(counts[capacity] || 0);
    const increment = document.createElement("button");
    increment.type = "button";
    increment.className = "counter-button";
    increment.textContent = "+";
    increment.setAttribute("aria-label", `Ajouter une capacité ${capacity}`);
    increment.title = capacityDescriptions[capacity] || capacity;
    increment.disabled = allocated >= total;
    increment.addEventListener("click", () => {
      counts[capacity] = (counts[capacity] || 0) + 1;
      renderCapacityCounters(sexKey);
      updateQuantityValidity();
    });
    controls.append(decrement, value, increment);
    counter.append(label, controls);
    container.append(counter);
  }
}

function initializeTabs() {
  const buttons = [...document.querySelectorAll(".tab-button")];
  const panels = [...document.querySelectorAll(".tab-panel")];
  let activeTab = "dashboard";
  let navigationVersion = null;
  const tabLabels = {
    dashboard: "Tableau de bord",
    elevage: "Élevage",
    croisements: "Croisements",
    bilan: "Plan",
    import: "Import et export",
    reglages: "Paramètres",
  };
  try {
    const storedTab = localStorage.getItem("dofus-elevage-active-tab");
    navigationVersion = localStorage.getItem("dofus-elevage-navigation-version");
    if (navigationVersion === "2" && panels.some((panel) => panel.dataset.panel === storedTab)) activeTab = storedTab;
    if (navigationVersion !== "2") localStorage.setItem("dofus-elevage-navigation-version", "2");
  } catch {
    showStorageError("Impossible de mémoriser l’onglet actif dans le stockage du navigateur.");
  }

  function activateTab(tabName) {
    for (const button of buttons) {
      const selected = button.dataset.tab === tabName;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
    for (const panel of panels) {
      const selected = panel.dataset.panel === tabName;
      panel.hidden = !selected;
      panel.classList.toggle("active", selected);
    }
    breadcrumbCurrent.textContent = tabLabels[tabName] || tabName;
    try {
      localStorage.setItem("dofus-elevage-active-tab", tabName);
    } catch {
      showStorageError("Impossible de mémoriser l’onglet actif dans le stockage du navigateur.");
    }
  }

  window.activateAppTab = activateTab;
  for (const button of buttons) {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
    button.addEventListener("keydown", (event) => {
      const currentIndex = buttons.indexOf(button);
      let nextIndex = null;
      if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % buttons.length;
      else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = buttons.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      buttons[nextIndex].focus();
      activateTab(buttons[nextIndex].dataset.tab);
    });
  }
  activateTab(activeTab);
}

function openHelpDrawer(title, content, relatedTab = "") {
  document.querySelector("#help-drawer-title").textContent = title;
  document.querySelector("#help-drawer-content").textContent = content;
  const action = document.querySelector("#help-drawer-action");
  action.hidden = !relatedTab;
  action.dataset.tab = relatedTab;
  helpDrawer.hidden = false;
  document.querySelector("#help-close-button").focus();
}

function initializeNavigationEnhancements() {
  try {
    const collapsed = localStorage.getItem("dofus-elevage-sidebar-collapsed") === "true";
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    sidebarCollapse.setAttribute("aria-expanded", String(!collapsed));
    sidebarCollapse.setAttribute("aria-label", collapsed ? "Déplier la barre latérale" : "Replier la barre latérale");
  } catch {
    document.body.classList.remove("sidebar-collapsed");
  }

  sidebarCollapse.addEventListener("click", () => {
    const collapsed = !document.body.classList.contains("sidebar-collapsed");
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    sidebarCollapse.setAttribute("aria-expanded", String(!collapsed));
    sidebarCollapse.setAttribute("aria-label", collapsed ? "Déplier la barre latérale" : "Replier la barre latérale");
    try {
      localStorage.setItem("dofus-elevage-sidebar-collapsed", String(collapsed));
    } catch {
      showTransferMessage("La barre latérale a été modifiée, mais ce choix ne peut pas être mémorisé.", true);
    }
  });
  document.querySelector(".app-sidebar .topbar-brand").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector("#tab-dashboard").click();
  });

  document.querySelectorAll("[data-open-tab]").forEach((button) => {
    button.addEventListener("click", () => document.querySelector(`#tab-${button.dataset.openTab}`)?.click());
  });
  recommendationAction.addEventListener("click", () => {
    const tabName = recommendationAction.dataset.destination || "elevage";
    document.querySelector(`#tab-${tabName}`)?.click();
    if (tabName === "elevage") {
      document.querySelector("#mount-detail").open = true;
      document.querySelector("#color-select-trigger").focus();
    }
  });
  globalSearch.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    document.querySelector("#tab-elevage").click();
    document.querySelector("#mount-detail").open = true;
    mountSearch.value = globalSearch.value;
    renderMounts();
    mountSearch.focus();
  });

  settingsThemeToggle.addEventListener("click", () => themeToggle.click());
  document.querySelector("#help-open-button").addEventListener("click", () => openHelpDrawer(
    "Centre d’aide",
    "Tes données sont conservées dans le stockage local de ce navigateur. Utilise Import et export pour conserver une copie JSON indépendante.",
  ));
  document.querySelector("#footer-help-button").addEventListener("click", () => document.querySelector("#help-open-button").click());
  document.querySelector("#help-close-button").addEventListener("click", () => {
    helpDrawer.hidden = true;
    document.querySelector("#help-open-button").focus();
  });
  document.querySelector("#help-drawer-action").addEventListener("click", (event) => {
    const tabName = event.currentTarget.dataset.tab;
    if (tabName) document.querySelector(`#tab-${tabName}`)?.click();
    helpDrawer.hidden = true;
  });
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-help-title]");
    if (trigger) openHelpDrawer(trigger.dataset.helpTitle, trigger.dataset.helpText || "Aucune explication supplémentaire.", trigger.dataset.helpTab || "");
  });
  document.querySelector("#import-capture-dashboard").addEventListener("click", () => {
    document.querySelector("#tab-elevage").click();
    captureImportFile.click();
  });
}

function initializeOnboarding() {
  const stepNumber = document.querySelector("#onboarding-step-number");
  const progressFill = document.querySelector("#onboarding-progress-fill");
  const title = document.querySelector("#onboarding-title");
  const description = document.querySelector("#onboarding-description");
  const back = document.querySelector("#onboarding-back");
  const next = document.querySelector("#onboarding-next");
  const steps = [
    ["Choisis ta génération cible", "Sélectionne la génération que tu souhaites préparer. Tu pourras la modifier à tout moment depuis la barre supérieure."],
    ["Ajoute tes montures", "Saisis ton stock ou importe une capture. Les informations reconnues restent modifiables avant validation."],
    ["Découvre ton plan", "Le plan estime les besoins à partir des croisements connus et de la génération choisie."],
  ];
  let currentStep = 0;
  const renderStep = () => {
    stepNumber.textContent = String(currentStep + 1);
    progressFill.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
    title.textContent = steps[currentStep][0];
    description.textContent = steps[currentStep][1];
    back.hidden = currentStep === 0;
    next.textContent = currentStep === steps.length - 1 ? "Ouvrir mon plan" : "Continuer";
  };
  back.addEventListener("click", () => {
    currentStep = Math.max(0, currentStep - 1);
    renderStep();
  });
  next.addEventListener("click", () => {
    if (currentStep === 0) {
      currentStep = 1;
      document.querySelector("#tab-elevage").click();
    } else if (currentStep === 1) {
      currentStep = 2;
      document.querySelector("#tab-bilan").click();
    } else {
      onboardingDialog.close();
      document.querySelector("#tab-bilan").click();
    }
    renderStep();
  });
  onboardingDialog.addEventListener("close", () => {
    try {
      localStorage.setItem("dofus-elevage-onboarding-complete", "true");
    } catch {
      showTransferMessage("L’introduction a été fermée, mais ce choix ne peut pas être mémorisé.", true);
    }
  }, { once: true });

  try {
    if (localStorage.getItem("dofus-elevage-onboarding-complete") === "true") return;
  } catch {
    showTransferMessage("L’introduction ne peut pas être mémorisée dans ce navigateur.", true);
    return;
  }
  renderStep();
  onboardingDialog.showModal();
}

function initializeGenerationTarget() {
  generationTarget.replaceChildren();
  for (let generation = 1; generation <= 10; generation += 1) {
    const option = document.createElement("option");
    option.value = String(generation);
    option.textContent = `Gén ${generation}`;
    generationTarget.append(option);
  }

  generationTarget.value = "3";
  try {
    const savedGeneration = localStorage.getItem("dofus-elevage-generation-cible");
    if (isGeneration(Number(savedGeneration))) generationTarget.value = savedGeneration;
  } catch {
    showStorageError("Impossible de mémoriser la génération visée dans le stockage du navigateur.");
  }

  generationTarget.addEventListener("change", () => {
    try {
      localStorage.setItem("dofus-elevage-generation-cible", generationTarget.value);
    } catch {
      showStorageError("Impossible de mémoriser la génération visée dans le stockage du navigateur.");
    }
    renderOverview();
  });
}

crossingThreshold.addEventListener("input", renderOverview);
crossingAverageParentLevel.addEventListener("input", renderCrossingCalculator);
crossingSort.addEventListener("change", renderCrossingCalculator);
crossingStatusFilter.addEventListener("change", renderCrossingCalculator);
crossingFertileOnly.addEventListener("change", renderOverview);
optimakinaToggle.addEventListener("change", () => {
  useOptimakina = optimakinaToggle.checked;
  try {
    localStorage.setItem(OPTIMAKINA_KEY, String(useOptimakina));
  } catch {
    showTransferMessage("Le calcul a été mis à jour, mais le choix d’Optimakina n’a pas pu être mémorisé.", true);
  }
  renderOverview();
});

function initializeOptimakina() {
  try {
    useOptimakina = localStorage.getItem(OPTIMAKINA_KEY) === "true";
  } catch {
    useOptimakina = false;
    showTransferMessage("Impossible de lire la préférence Optimakina ; le bonus reste désactivé.", true);
  }
  optimakinaToggle.checked = useOptimakina;
}

async function loadPlanConfig() {
  let data;
  try {
    const response = await fetch("data/plan-optimisation.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
    if (!data
      || !isGeneration(data.defaultTargetGeneration)
      || !Number.isInteger(data.defaultSafetyMargin)
      || data.defaultSafetyMargin < 0
      || !Number.isInteger(data.capacity?.maxMounts)
      || data.capacity.maxMounts < 1
      || typeof data.crossing?.baseProbabilityPercent !== "number"
      || typeof data.crossing?.percentPerParentLevel !== "number"
      || data.crossing.assumeMaxGauges !== true
      || typeof data.crossing?.reproducteurExtraBabies !== "number") {
      throw new Error("Invalid optimization configuration");
    }

    planConfig = data;
    MAX_MOUNTS = data.capacity.maxMounts;
    safetyMargin = data.defaultSafetyMargin;
  } catch {
    planConfig = null;
    planError.textContent = "Impossible de charger data/plan-optimisation.json ou son contenu est invalide. Le plan d’optimisation est indisponible.";
    planError.hidden = false;
    dashboardPlanActions = [];
    renderDashboardGuidance();
    return;
  }

  try {
    const savedSettings = localStorage.getItem(PLAN_SETTINGS_KEY);
    if (savedSettings !== null) {
      const parsed = JSON.parse(savedSettings);
      if (parsed && Number.isInteger(parsed.safetyMargin)
        && parsed.safetyMargin >= 0 && parsed.safetyMargin <= MAX_MOUNTS) {
        safetyMargin = parsed.safetyMargin;
      }
    }
    const savedDone = localStorage.getItem(PLAN_DONE_KEY);
    if (savedDone !== null) {
      const parsedDone = JSON.parse(savedDone);
      if (!Array.isArray(parsedDone) || !parsedDone.every((actionId) => typeof actionId === "string")) {
        throw new Error("Invalid saved recommendation progress");
      }
      completedPlanActions = new Set(parsedDone);
    }
    const savedCrossings = localStorage.getItem(PLANNED_CROSSINGS_KEY);
    if (savedCrossings !== null) {
      const parsedCrossings = JSON.parse(savedCrossings);
      if (!Array.isArray(parsedCrossings) || !parsedCrossings.every((colorName) => typeof colorName === "string")) {
        throw new Error("Invalid saved planned crossings");
      }
      plannedCrossings = new Set(parsedCrossings);
    }
    const savedGeneration = localStorage.getItem("dofus-elevage-generation-cible");
    generationTarget.value = isGeneration(Number(savedGeneration))
      ? savedGeneration
      : String(data.defaultTargetGeneration);
    safetyMarginInput.value = String(safetyMargin);
  } catch {
    safetyMargin = data.defaultSafetyMargin;
    completedPlanActions = new Set();
    planNotice = "Impossible de lire la marge de sécurité ou l’avancement enregistrés. Les valeurs par défaut de data/plan-optimisation.json sont utilisées.";
    planError.textContent = planNotice;
    planError.hidden = false;
    generationTarget.value = String(data.defaultTargetGeneration);
    safetyMarginInput.value = String(safetyMargin);
  }

  renderOverview();
}

function persistPlanSettings(nextSafetyMargin = safetyMargin) {
  try {
    localStorage.setItem(PLAN_SETTINGS_KEY, JSON.stringify({
      safetyMargin: nextSafetyMargin,
    }));
    return true;
  } catch {
    planNotice = "Impossible d’enregistrer les paramètres du plan dans le navigateur.";
    planError.textContent = planNotice;
    planError.hidden = false;
    return false;
  }
}

planSettingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextSafetyMargin = Number(safetyMarginInput.value);
  if (!Number.isInteger(nextSafetyMargin) || nextSafetyMargin < 0 || nextSafetyMargin > MAX_MOUNTS) return;

  if (!persistPlanSettings(nextSafetyMargin)) return;
  safetyMargin = nextSafetyMargin;
  planNotice = "";
  renderOverview();
  updateSaveStatus();
  showTransferMessage("Plan mis à jour.", false, false);
});

async function loadColors() {
  try {
    const response = await fetch("data/couleurs.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const fileContent = await response.text();
    if (fileContent.trim() === "") {
      colors = [];
    } else {
      const parsedColors = JSON.parse(fileContent);
      if (!parsedColors
        || !Array.isArray(parsedColors.couleurs)
        || !parsedColors.couleurs.every((color) => color
          && typeof color.nom === "string"
          && color.nom.trim().length > 0
          && isGeneration(color.generation))) {
        throw new Error("Invalid color list");
      }
      colors = parsedColors.couleurs
        .map((color) => ({
          nom: color.nom.trim(),
          generation: color.generation,
          parents: Array.isArray(color.parents) ? color.parents : [],
        }))
        .sort((first, second) => first.generation - second.generation
          || first.nom.localeCompare(second.nom, "fr", { sensitivity: "base" }));
    }
    colorsLoaded = true;
    updateColorOptions();
    colorLoadError.hidden = true;

    if (colors.length === 0) {
      colorMessage.textContent = "Aucune couleur n’est définie dans data/couleurs.json. Ajoutez-y les couleurs à proposer.";
      colorMessage.className = "message info";
      colorMessage.hidden = false;
    } else {
      colorMessage.hidden = true;
    }
    renderMounts();
  } catch {
    colors = [];
    colorsLoaded = false;
    updateColorOptions();
    colorLoadError.textContent = "Impossible de charger les couleurs depuis data/couleurs.json. Vérifiez le fichier et rechargez la page.";
    colorLoadError.hidden = false;
    colorMessage.hidden = true;
  }
}

async function loadCapacities() {
  try {
    const response = await fetch("data/capacites.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)
      || !CAPACITIES.every((capacity) => typeof data[capacity] === "string")) {
      throw new Error("Invalid capacity descriptions");
    }

    capacityDescriptions = data;
    capacityLoadError.hidden = true;
  } catch {
    capacityDescriptions = {};
    capacityLoadError.textContent = "Impossible de charger data/capacites.json. Vérifiez le fichier pour afficher la légende des capacités.";
    capacityLoadError.hidden = false;
  }

  updateCapacityOptions();
  renderCapacityCounters("females");
  renderCapacityCounters("males");
}

function normalizeOcrText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getEditDistance(first, second) {
  const previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    let diagonal = previous[0];
    previous[0] = firstIndex;
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const above = previous[secondIndex];
      previous[secondIndex] = Math.min(
        previous[secondIndex] + 1,
        previous[secondIndex - 1] + 1,
        diagonal + (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[second.length];
}

function findApproximateValue(text, knownValues) {
  const normalizedText = normalizeOcrText(text);
  if (!normalizedText) return null;
  const compactText = normalizedText.replace(/\s/g, "");
  const normalizedValues = knownValues.map((value) => ({
    value,
    normalized: normalizeOcrText(value),
    compact: normalizeOcrText(value).replace(/\s/g, ""),
  })).sort((first, second) => second.compact.length - first.compact.length);

  const exact = normalizedValues.find((entry) => compactText.includes(entry.compact));
  if (exact) return { value: exact.value, score: 1 };

  const words = normalizedText.split(/\s+/);
  let best = null;
  for (const entry of normalizedValues) {
    const expectedWordCount = entry.normalized.split(/\s+/).length;
    for (let size = Math.max(1, expectedWordCount - 1); size <= expectedWordCount + 1; size += 1) {
      for (let start = 0; start + size <= words.length; start += 1) {
        const candidate = words.slice(start, start + size).join("");
        const distance = getEditDistance(entry.compact, candidate);
        const score = 1 - distance / Math.max(entry.compact.length, candidate.length);
        if (!best || score > best.score) best = { value: entry.value, score };
      }
    }
  }
  return best && best.score >= 0.62 ? best : null;
}

function getOcrLineConfidence(line) {
  return Number.isFinite(line.confidence) ? Math.max(0, Math.min(100, line.confidence)) : 0;
}

function findOcrColor(lineText) {
  const match = findApproximateValue(lineText, colors.map((color) => color.nom));
  return match && match.score >= 0.66 ? match : null;
}

function extractCaptureCandidate(lines, lineIndex, colorMatch, fileIndex) {
  const sourceLine = lines[lineIndex];
  const sourceY = (sourceLine.bbox?.y0 + sourceLine.bbox?.y1) / 2;
  const contextLines = lines.filter((line, index) => {
    if (index === lineIndex) return true;
    const centerY = (line.bbox?.y0 + line.bbox?.y1) / 2;
    if (!Number.isFinite(sourceY) || !Number.isFinite(centerY) || Math.abs(centerY - sourceY) > 48) return false;
    return !findOcrColor(line.text);
  });
  const context = contextLines.map((line) => line.text).join(" ");
  const sourceConfidence = Math.round(getOcrLineConfidence(sourceLine));
  const values = {
    name: "",
    color: colorMatch.value,
    sex: "",
    level: "",
    capacity: "",
    fertility: "",
    remainingReproductions: "",
  };
  const confidence = {
    name: 0,
    color: Math.round(sourceConfidence * colorMatch.score),
    sex: 0,
    level: 0,
    capacity: 0,
    fertility: 0,
    remainingReproductions: 0,
  };

  const nameMatch = context.match(/(?:nom|name)\s*[:\-]\s*([^|,;]+)/i);
  if (nameMatch) {
    values.name = nameMatch[1].trim();
    confidence.name = sourceConfidence;
  }

  if (/[♀]/.test(context) || /\bfemelle\b/i.test(context) || /(?:^|\s)F(?:\s|$)/i.test(context)) {
    values.sex = "Femelle";
    confidence.sex = sourceConfidence;
  } else if (/[♂]/.test(context) || /\bmale\b|\bmâle\b/i.test(context) || /(?:^|\s)M(?:\s|$)/i.test(context)) {
    values.sex = "Mâle";
    confidence.sex = sourceConfidence;
  }

  const levelMatch = context.match(/(?:niveau|niv\.?|lvl|level)\s*[:#-]?\s*(\d{1,3})\b/i)
    || context.match(/\b(\d{1,3})\s*\/\s*200\b/);
  if (levelMatch && Number(levelMatch[1]) <= 200) {
    values.level = levelMatch[1];
    confidence.level = sourceConfidence;
  }

  const capacityMatch = findApproximateValue(context, CAPACITIES);
  if (capacityMatch && capacityMatch.score >= 0.66) {
    values.capacity = capacityMatch.value;
    confidence.capacity = Math.round(sourceConfidence * capacityMatch.score);
  }

  const normalizedContext = normalizeOcrText(context);
  if (/\bpas feconde\b|\bst[eé]rile\b|\binfeconde\b/.test(normalizedContext)) {
    values.fertility = "Pas féconde";
    confidence.fertility = sourceConfidence;
  } else if (/\bfeconde\b|\bfertile\b/.test(normalizedContext)) {
    values.fertility = "Féconde";
    confidence.fertility = sourceConfidence;
  } else if (/\binconnu\b/.test(normalizedContext)) {
    values.fertility = "Inconnu";
    confidence.fertility = sourceConfidence;
  }

  const reproductionsMatch = context.match(/(?:reproductions?|saillies?)\s*(?:restantes?)?\s*[:#-]?\s*(\d{1,3})/i);
  if (reproductionsMatch) {
    values.remainingReproductions = reproductionsMatch[1];
    confidence.remainingReproductions = sourceConfidence;
  }

  return { values, confidence, fileIndex, fileName: "", selected: true, sourceY };
}

function preprocessCapture(file) {
  return createImageBitmap(file).then((bitmap) => {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width * 2;
    canvas.height = bitmap.height * 2;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      bitmap.close();
      throw new Error("Le prétraitement de l’image n’est pas disponible dans ce navigateur.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const contrast = 1.35;
    const intercept = 128 * (1 - contrast);
    for (let index = 0; index < image.data.length; index += 4) {
      const gray = image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114;
      const adjusted = Math.max(0, Math.min(255, gray * contrast + intercept));
      image.data[index] = adjusted;
      image.data[index + 1] = adjusted;
      image.data[index + 2] = adjusted;
    }
    context.putImageData(image, 0, 0);
    return canvas;
  });
}

function clearCaptureReview() {
  captureRunId += 1;
  for (const url of capturePreviewUrls) URL.revokeObjectURL(url);
  capturePreviewUrls = [];
  captureCandidates = [];
  captureReviewRows.replaceChildren();
  capturePreviewImage.removeAttribute("src");
  capturePreviewImage.hidden = true;
  capturePreviewName.textContent = "";
  captureProgress.hidden = true;
  captureProgressBar.value = 0;
  captureProgressMessage.textContent = "";
  captureError.hidden = true;
  captureError.textContent = "";
  captureNoResults.hidden = true;
  captureImportSelected.disabled = true;
  captureOcrRunning = false;
}

function showCapturePreview(candidateIndex) {
  const candidate = captureCandidates[candidateIndex];
  if (!candidate) return;
  selectedCapturePreview = candidate.fileIndex;
  capturePreviewName.textContent = candidate.fileName;
  capturePreviewImage.src = capturePreviewUrls[candidate.fileIndex];
  capturePreviewImage.hidden = false;
}

function createCaptureSelect(values, selectedValue, placeholder) {
  const select = document.createElement("select");
  select.add(new Option(placeholder, ""));
  for (const value of values) select.add(new Option(value, value));
  select.value = selectedValue;
  return select;
}

function createCaptureFieldCell(candidate, field, control) {
  const cell = document.createElement("td");
  const confidence = candidate.confidence[field] || 0;
  const isMissing = !candidate.values[field];
  const isLowConfidence = Boolean(candidate.values[field]) && confidence < 70;
  if (isMissing) cell.classList.add("capture-field-missing");
  else if (isLowConfidence) cell.classList.add("capture-field-low");

  control.value = candidate.values[field];
  control.setAttribute("aria-label", `${field} pour ${candidate.fileName}`);
  const indicator = document.createElement("span");
  indicator.className = "capture-field-indicator";
  updateCaptureFieldIndicator(indicator, isMissing || isLowConfidence ? "warning" : "", isMissing ? "Non détecté" : `${confidence} %`);
  cell.append(control, indicator);

  control.addEventListener("input", () => {
    candidate.values[field] = control.value;
    cell.classList.remove("capture-field-missing", "capture-field-low");
    updateCaptureFieldIndicator(indicator, control.value ? "check" : "warning", control.value ? "Corrigé" : "Non détecté");
    if (!control.value) cell.classList.add("capture-field-missing");
  });
  control.addEventListener("change", () => {
    candidate.values[field] = control.value;
    cell.classList.remove("capture-field-missing", "capture-field-low");
    updateCaptureFieldIndicator(indicator, control.value ? "check" : "warning", control.value ? "Corrigé" : "Non détecté");
    if (!control.value) cell.classList.add("capture-field-missing");
  });
  return cell;
}

function updateCaptureFieldIndicator(indicator, iconName, message) {
  indicator.replaceChildren();
  if (iconName) indicator.append(createIcon(iconName, "icon capture-indicator-icon"));
  indicator.append(document.createTextNode(message));
}

function renderCaptureCandidates() {
  captureReviewRows.replaceChildren();
  captureNoResults.hidden = captureCandidates.length > 0;
  captureImportSelected.disabled = captureOcrRunning || !captureCandidates.some((candidate) => candidate.selected);

  for (const [index, candidate] of captureCandidates.entries()) {
    const row = document.createElement("tr");
    row.addEventListener("click", (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      showCapturePreview(index);
    });

    const includeCell = document.createElement("td");
    const include = document.createElement("input");
    include.type = "checkbox";
    include.checked = candidate.selected;
    include.setAttribute("aria-label", `Inclure la monture détectée ${index + 1}`);
    include.addEventListener("change", () => {
      candidate.selected = include.checked;
      captureImportSelected.disabled = captureOcrRunning || !captureCandidates.some((entry) => entry.selected);
    });
    includeCell.append(include);
    row.append(includeCell);

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    row.append(createCaptureFieldCell(candidate, "name", nameInput));

    const colorSelectControl = createCaptureSelect(colors.map((color) => color.nom), candidate.values.color, "Choisir…");
    row.append(createCaptureFieldCell(candidate, "color", colorSelectControl));

    const sexSelect = createCaptureSelect(["Femelle", "Mâle"], candidate.values.sex, "Choisir…");
    row.append(createCaptureFieldCell(candidate, "sex", sexSelect));

    const levelInput = document.createElement("input");
    levelInput.type = "number";
    levelInput.min = "0";
    levelInput.max = "200";
    levelInput.step = "1";
    row.append(createCaptureFieldCell(candidate, "level", levelInput));

    const capacitySelect = createCaptureSelect(CAPACITIES, candidate.values.capacity, "Choisir…");
    row.append(createCaptureFieldCell(candidate, "capacity", capacitySelect));

    const fertilitySelect = createCaptureSelect(FERTILITY_STATUSES, candidate.values.fertility, "Choisir…");
    row.append(createCaptureFieldCell(candidate, "fertility", fertilitySelect));

    const reproductionInput = document.createElement("input");
    reproductionInput.type = "number";
    reproductionInput.min = "0";
    reproductionInput.step = "1";
    row.append(createCaptureFieldCell(candidate, "remainingReproductions", reproductionInput));
    captureReviewRows.append(row);
  }

  if (captureCandidates.length > 0) showCapturePreview(0);
}

async function beginCaptureImport(inputFiles) {
  const files = [...inputFiles].filter((file) => file.type.startsWith("image/"));
  if (files.length === 0) return;
  if (!colorsLoaded || colors.length === 0) {
    showTransferMessage("Charge les couleurs depuis data/couleurs.json avant de lire une capture.", true);
    return;
  }

  clearCaptureReview();
  const runId = ++captureRunId;
  capturePreviewUrls = files.map((file) => URL.createObjectURL(file));
  captureProgress.hidden = false;
  captureProgressMessage.textContent = `Préparation de ${files.length} capture(s)…`;
  captureOcrRunning = true;
  if (!captureReviewDialog.open) captureReviewDialog.showModal();
  captureImportSelected.disabled = true;

  let worker;
  try {
    if (!window.Tesseract?.createWorker) {
      throw new Error("Le moteur OCR n’a pas pu être chargé. Vérifie ta connexion puis réessaie.");
    }
    worker = await window.Tesseract.createWorker("fra", 1, {
      logger: (progress) => {
        if (runId !== captureRunId || typeof progress.progress !== "number") return;
        const currentFile = Math.min(files.length, selectedCapturePreview + 1);
        captureProgressMessage.textContent = `Lecture de la capture ${currentFile}/${files.length}…`;
        captureProgressBar.value = Math.round(((currentFile - 1 + progress.progress) / files.length) * 100);
      },
    });

    for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
      if (runId !== captureRunId) return;
      capturePreviewName.textContent = files[fileIndex].name;
      capturePreviewImage.src = capturePreviewUrls[fileIndex];
      capturePreviewImage.hidden = false;
      selectedCapturePreview = fileIndex;
      captureProgressMessage.textContent = `Lecture de la capture ${fileIndex + 1}/${files.length}…`;
      captureProgressBar.value = Math.round((fileIndex / files.length) * 100);

      const processedImage = await preprocessCapture(files[fileIndex]);
      const result = await worker.recognize(processedImage);
      if (runId !== captureRunId) return;
      const lines = result.data.lines || [];
      const matches = [];
      for (const [lineIndex, line] of lines.entries()) {
        const colorMatch = findOcrColor(line.text);
        if (!colorMatch) continue;
        const candidate = extractCaptureCandidate(lines, lineIndex, colorMatch, fileIndex);
        candidate.fileName = files[fileIndex].name;
        candidate.generation = colors.find((color) => color.nom === candidate.values.color)?.generation ?? "";
        matches.push(candidate);
      }
      const uniqueMatches = matches.filter((candidate, index) => {
        return matches.findIndex((other) => other.values.color === candidate.values.color
          && other.fileIndex === candidate.fileIndex
          && Number.isFinite(other.sourceY)
          && Number.isFinite(candidate.sourceY)
          && Math.abs(other.sourceY - candidate.sourceY) < 14) === index;
      });
      captureCandidates.push(...uniqueMatches);
      captureProgressBar.value = Math.round(((fileIndex + 1) / files.length) * 100);
    }

    if (runId !== captureRunId) return;
    captureProgressMessage.textContent = "Lecture terminée. Vérifie chaque champ avant l’import.";
    captureOcrRunning = false;
    renderCaptureCandidates();
    if (captureCandidates.length === 0) {
      captureNoResults.hidden = false;
      captureNoResults.textContent = "Aucune monture détectée. Essaie une capture plus nette ou ajoute-la manuellement.";
    }
  } catch (error) {
    if (runId !== captureRunId) return;
    captureOcrRunning = false;
    captureProgress.hidden = true;
    captureError.textContent = `La lecture des captures a échoué : ${error instanceof Error ? error.message : "erreur inconnue"}`;
    captureError.hidden = false;
    captureImportSelected.disabled = true;
  } finally {
    if (worker) await worker.terminate();
  }
}

function importCaptureSelection() {
  const selected = captureCandidates.filter((candidate) => candidate.selected);
  if (selected.length === 0) {
    captureError.textContent = "Sélectionne au moins une monture à importer.";
    captureError.hidden = false;
    return;
  }

  const importedMounts = [];
  const errors = [];
  for (const [index, candidate] of selected.entries()) {
    const rowNumber = index + 1;
    const { values } = candidate;
    const level = values.level === "" ? NaN : Number(values.level);
    const remaining = values.remainingReproductions === "" ? null : Number(values.remainingReproductions);
    if (!colors.some((color) => color.nom === values.color)) errors.push(`Ligne ${rowNumber} : choisis une couleur connue.`);
    if (!["Femelle", "Mâle"].includes(values.sex)) errors.push(`Ligne ${rowNumber} : choisis le sexe.`);
    if (!Number.isInteger(level) || level < 0 || level > 200) errors.push(`Ligne ${rowNumber} : le niveau doit être compris entre 0 et 200.`);
    if (!CAPACITIES.includes(values.capacity)) errors.push(`Ligne ${rowNumber} : choisis une capacité.`);
    if (!FERTILITY_STATUSES.includes(values.fertility)) errors.push(`Ligne ${rowNumber} : choisis un statut de fécondité.`);
    if (remaining !== null && (!Number.isInteger(remaining) || remaining < 0)) errors.push(`Ligne ${rowNumber} : les reproductions restantes doivent être un entier positif ou nul.`);

    const color = colors.find((entry) => entry.nom === values.color);
    if (color && ["Femelle", "Mâle"].includes(values.sex) && Number.isInteger(level)
      && level >= 0 && level <= 200 && CAPACITIES.includes(values.capacity)
      && FERTILITY_STATUSES.includes(values.fertility)
      && (remaining === null || (Number.isInteger(remaining) && remaining >= 0))) {
      importedMounts.push({
        name: values.name.trim(),
        color: color.nom,
        generation: color.generation,
        sex: values.sex,
        level,
        capacity: values.capacity,
        fertility: values.fertility,
        remainingReproductions: remaining,
      });
    }
  }

  if (errors.length > 0) {
    captureError.textContent = errors.join(" ");
    captureError.hidden = false;
    return;
  }
  if (mounts.length + importedMounts.length > MAX_MOUNTS) {
    captureError.textContent = `L’import dépasserait le plafond de ${MAX_MOUNTS} montures.`;
    captureError.hidden = false;
    return;
  }

  if (saveMounts([...mounts, ...importedMounts], "L’import de la capture n’a pas pu être sauvegardé. Les montures actuelles sont conservées.")) {
    syncSelectedColorQuantities();
    captureReviewDialog.close();
    showTransferMessage(`${importedMounts.length} monture(s) importée(s) depuis les captures.`);
  }
}

function syncSelectedColorQuantities() {
  const isSelected = Boolean(colorSelect.value);
  quantityFields.hidden = !isSelected;
  femaleCountInput.disabled = !isSelected;
  maleCountInput.disabled = !isSelected;

  if (isSelected) {
    const counts = getCountsForColor(colorSelect.value);
    femaleCountInput.value = String(counts.females);
    maleCountInput.value = String(counts.males);
    desiredCapacityCounts = {
      females: countCapacitiesForColor(colorSelect.value, "females"),
      males: countCapacitiesForColor(colorSelect.value, "males"),
    };
  } else {
    femaleCountInput.value = "0";
    maleCountInput.value = "0";
    desiredCapacityCounts = { females: {}, males: {} };
  }

  renderCapacityCounters("females");
  renderCapacityCounters("males");
  quantityMessage.hidden = true;
  updateFormAvailability();
  updateQuantityValidity();
}

function countCapacitiesForColor(color, sexKey) {
  const counts = {};
  for (const capacity of editableCapacities) counts[capacity] = 0;
  for (const mount of mounts) {
    if (mount.color !== color || (sexKey === "females" ? !isFemale(mount.sex) : !isMale(mount.sex))) continue;
    if (editableCapacities.includes(mount.capacity)) counts[mount.capacity] += 1;
  }
  return counts;
}

function updateQuantityValidity() {
  const selectedColor = colorSelect.value;
  if (!selectedColor) {
    submitButton.disabled = true;
    return;
  }

  const currentCounts = getCountsForColor(selectedColor);
  const otherMountCount = mounts.length - currentCounts.females - currentCounts.males;
  const desiredFemales = Number(femaleCountInput.value);
  const desiredMales = Number(maleCountInput.value);
  const desiredTotal = otherMountCount + desiredFemales + desiredMales;
  const femaleCapacitiesTotal = Object.values(desiredCapacityCounts.females).reduce((sum, count) => sum + count, 0);
  const maleCapacitiesTotal = Object.values(desiredCapacityCounts.males).reduce((sum, count) => sum + count, 0);
  const hasValidCounts = Number.isInteger(desiredFemales)
    && femaleCountInput.value !== ""
    && desiredFemales >= 0
    && Number.isInteger(desiredMales)
    && maleCountInput.value !== ""
    && desiredMales >= 0
    && femaleCapacitiesTotal <= desiredFemales
    && maleCapacitiesTotal <= desiredMales;

  if (hasValidCounts && desiredTotal > MAX_MOUNTS) {
    quantityMessage.textContent = `Le total dépasserait ${MAX_MOUNTS} montures. Réduisez les quantités.`;
    quantityMessage.hidden = false;
  } else if (femaleCapacitiesTotal > desiredFemales || maleCapacitiesTotal > desiredMales) {
    quantityMessage.textContent = "Le nombre de capacités ne peut pas dépasser le nombre de montures correspondant.";
    quantityMessage.hidden = false;
  } else if (hasValidCounts) {
    quantityMessage.hidden = true;
  }

  renderCapacityCounters("females");
  renderCapacityCounters("males");
  submitButton.disabled = !storageAvailable
    || !colorsLoaded
    || colors.length === 0
    || !hasValidCounts
    || desiredTotal > MAX_MOUNTS;
}

function deleteMount(index) {
  if (!mounts[index]) {
    return;
  }

  const deletedColor = mounts[index].color;
  const updatedMounts = mounts.filter((_, mountIndex) => mountIndex !== index);
  if (saveMounts(updatedMounts, "La suppression n’a pas pu être sauvegardée.")
    && colorSelect.value === deletedColor) {
    syncSelectedColorQuantities();
  }
}

function getDesiredCapacityMap(sexKey, desiredCount) {
  const desired = { ...desiredCapacityCounts[sexKey] };
  desired.Aucune = desiredCount - editableCapacities.reduce((sum, capacity) => sum + (desired[capacity] || 0), 0);
  return desired;
}

function reconcileColorSex(existing, sex, desiredCount, desiredCapacities, color) {
  const matching = existing.filter((mount) => mount.color === color
    && (sex === "Femelle" ? isFemale(mount.sex) : isMale(mount.sex)));
  const retained = matching.slice(0, desiredCount).map((mount) => ({ ...mount }));
  const capacityAssignments = new Map();
  const assignedIndexes = new Set();
  const remainingByCapacity = { ...desiredCapacities };

  for (const capacity of CAPACITIES) {
    let remaining = remainingByCapacity[capacity] || 0;
    for (let index = 0; index < retained.length && remaining > 0; index += 1) {
      if (retained[index].capacity === capacity) {
        capacityAssignments.set(index, capacity);
        assignedIndexes.add(index);
        remaining -= 1;
      }
    }
    remainingByCapacity[capacity] = remaining;
  }

  for (const capacity of CAPACITIES) {
    while (remainingByCapacity[capacity] > 0) {
      const index = retained.findIndex((_, position) => !assignedIndexes.has(position));
      if (index < 0) break;
      capacityAssignments.set(index, capacity);
      assignedIndexes.add(index);
      remainingByCapacity[capacity] -= 1;
    }
  }

  const updatedRetained = retained.map((mount, index) => ({
    ...mount,
    capacity: capacityAssignments.get(index) || "Aucune",
  }));
  const additionsByCapacity = CAPACITIES.flatMap((capacity) => (
    Array(Math.max(0, remainingByCapacity[capacity] || 0)).fill(capacity)
  ));
  const additions = additionsByCapacity.map((capacity) => {
    const mount = {
      name: "",
      color,
      sex,
      level: 0,
      generation: colors.find((entry) => entry.nom === color).generation,
      capacity,
      fertility: "Inconnu",
      remainingReproductions: null,
    };
    return mount;
  });

  return { retained: updatedRetained, additions };
}

function startCapacityEdit(index) {
  const mount = mounts[index];
  if (!mount) return;

  editingMountIndex = index;
  capacityEditSelect.value = CAPACITIES.includes(mount.capacity) ? mount.capacity : "Aucune";
  capacityEditForm.hidden = false;
  capacityEditForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeCapacityEdit() {
  editingMountIndex = null;
  capacityEditForm.hidden = true;
}

capacityEditForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (editingMountIndex === null || !storageAvailable) return;

  const capacity = capacityEditSelect.value;
  if (!CAPACITIES.includes(capacity)) return;

  const updatedMounts = mounts.map((mount, index) => (
    index === editingMountIndex ? { ...mount, capacity } : mount
  ));
  if (saveMounts(updatedMounts, "La capacité n’a pas pu être sauvegardée.")) {
    closeCapacityEdit();
  }
});

cancelCapacityEdit.addEventListener("click", closeCapacityEdit);
planBalanceFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-balance-filter]");
  if (!button) return;
  planBalanceFilter = button.dataset.balanceFilter;
  for (const filterButton of planBalanceFilters.querySelectorAll("[data-balance-filter]")) {
    const isActive = filterButton === button;
    filterButton.classList.toggle("active", isActive);
    filterButton.setAttribute("aria-pressed", String(isActive));
  }
  renderOptimizationPlan();
});
planBalance.addEventListener("click", (event) => {
  const button = event.target.closest("[data-use-color]");
  if (!button) return;
  const nextColor = colors.find((color) => (color.parents || []).includes(button.dataset.useColor));
  if (nextColor) obtainableGenerationTab = nextColor.generation;
  renderObtainableCrossings();
  obtainableCrossingsList.scrollIntoView({ behavior: "smooth", block: "start" });
});
planActionsToggle.addEventListener("click", () => {
  const expanded = planActionsToggle.getAttribute("aria-expanded") === "true";
  planActionsToggle.setAttribute("aria-expanded", String(!expanded));
  planActionsToggle.textContent = expanded ? "Liste d’actions" : "Masquer la liste d’actions";
  planAllActions.hidden = expanded;
});
balanceShowAbsent.addEventListener("change", () => {
  showAbsentColors = balanceShowAbsent.checked;
  balanceShowAbsent.setAttribute("aria-pressed", String(showAbsentColors));
  renderOverview();
});
balanceColorSearch.addEventListener("input", renderOverview);
summaryAbsentSearch.addEventListener("input", filterSummaryAbsentColors);
summaryAbsentOpen.addEventListener("click", () => {
  summaryMissingColorsDialog.showModal();
  summaryAbsentSearch.focus();
});
summaryMissingColorsClose.addEventListener("click", () => summaryMissingColorsDialog.close());
balanceColorSort.addEventListener("change", renderOverview);
mountFiltersToggle.addEventListener("click", () => {
  const expanded = mountFiltersToggle.getAttribute("aria-expanded") === "true";
  mountFiltersToggle.setAttribute("aria-expanded", String(!expanded));
  mountFiltersPanel.hidden = expanded;
});
clearMountFilters.addEventListener("click", clearAllMountFilters);
document.querySelectorAll(".mount-sort-heading [data-sort]").forEach((button) => {
  button.addEventListener("click", () => {
    if (mountSort.value === button.dataset.sort) mountSortDirection *= -1;
    else {
      mountSort.value = button.dataset.sort;
      mountSortDirection = 1;
    }
    renderMounts();
  });
});
captureImportButton.addEventListener("click", () => captureImportFile.click());
function openMountEntry() {
  document.querySelector("#mount-detail").open = true;
  document.querySelector("#color-select-trigger").focus();
}
document.querySelector("#empty-state-add-mount").addEventListener("click", openMountEntry);
document.querySelector("#summary-import-capture").addEventListener("click", () => captureImportFile.click());
document.querySelector("#overview-add-mount").addEventListener("click", openMountEntry);
document.querySelector("#overview-import-capture").addEventListener("click", () => captureImportFile.click());
captureImportFile.addEventListener("change", () => {
  const files = [...captureImportFile.files];
  captureImportFile.value = "";
  beginCaptureImport(files);
});
captureImportSelected.addEventListener("click", importCaptureSelection);
captureReviewCancel.addEventListener("click", () => captureReviewDialog.close());
captureReviewDialog.addEventListener("close", clearCaptureReview);
document.addEventListener("paste", (event) => {
  const imageFiles = [...(event.clipboardData?.items || [])]
    .filter((item) => item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (imageFiles.length === 0) return;
  event.preventDefault();
  beginCaptureImport(imageFiles);
});
document.addEventListener("dragover", (event) => {
  if ([...(event.dataTransfer?.items || [])].some((item) => item.kind === "file" && item.type.startsWith("image/"))) {
    event.preventDefault();
    document.body.classList.add("capture-drop-active");
  }
});
document.addEventListener("dragleave", (event) => {
  if (event.relatedTarget === null) document.body.classList.remove("capture-drop-active");
});
document.addEventListener("drop", (event) => {
  document.body.classList.remove("capture-drop-active");
  const imageFiles = [...(event.dataTransfer?.files || [])].filter((file) => file.type.startsWith("image/"));
  if (imageFiles.length === 0) return;
  event.preventDefault();
  beginCaptureImport(imageFiles);
});
obtainableGenerationTabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-generation]");
  if (!tab) return;
  obtainableGenerationTab = Number(tab.dataset.generation);
  renderObtainableCrossings();
});
obtainableFeasibleOnly.addEventListener("change", renderObtainableCrossings);
obtainableCrossingsList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-plan-color]");
  if (!button) return;
  const colorName = button.dataset.planColor;
  const wasPlanned = plannedCrossings.has(colorName);
  if (wasPlanned) plannedCrossings.delete(colorName);
  else plannedCrossings.add(colorName);
  try {
    localStorage.setItem(PLANNED_CROSSINGS_KEY, JSON.stringify([...plannedCrossings]));
  } catch {
    if (wasPlanned) plannedCrossings.add(colorName);
    else plannedCrossings.delete(colorName);
    planNotice = "Le croisement a été modifié, mais le plan n’a pas pu être enregistré dans le navigateur.";
    planError.textContent = planNotice;
    planError.hidden = false;
    return;
  }
  planNotice = "";
  renderOverview();
  updateSaveStatus();
  showTransferMessage(wasPlanned ? "Croisement retiré du plan." : "Croisement ajouté au plan.", false, false);
});
for (const control of [capacityFilter, generationFilter, sexFilter, colorFilterSelect, unnamedFilter, mountFertileOnly]) {
  control.addEventListener("change", renderMounts);
}
mountSearch.addEventListener("input", renderMounts);
mountSort.addEventListener("change", () => {
  mountSortDirection = 1;
  renderMounts();
});

bulkAddToggle.addEventListener("click", () => {
  const isExpanded = bulkAddToggle.getAttribute("aria-expanded") === "true";
  bulkAddToggle.setAttribute("aria-expanded", String(!isExpanded));
  bulkAddForm.hidden = isExpanded;
});

bulkAddForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!storageAvailable || !colorsLoaded) return;
  const color = colors.find((entry) => entry.nom === bulkColorSelect.value);
  const quantity = Number(bulkQuantityInput.value);
  if (!color || !Number.isInteger(quantity) || quantity < 1) return;
  if (mounts.length + quantity > MAX_MOUNTS) {
    showTransferMessage(`L’ajout dépasserait le plafond de ${MAX_MOUNTS} montures.`, true);
    return;
  }
  const additions = Array.from({ length: quantity }, () => ({
    name: "",
    color: color.nom,
    generation: color.generation,
    sex: bulkSexSelect.value,
    level: 0,
    capacity: "Aucune",
    fertility: "Inconnu",
    remainingReproductions: null,
  }));
  if (saveMounts([...mounts, ...additions])) {
    bulkQuantityInput.value = "1";
    showTransferMessage(`${quantity} monture(s) ${formatColorName(color.nom)} ajoutée(s).`);
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!storageAvailable || !colorsLoaded || colors.length === 0 || !colorSelect.value) {
    return;
  }

  updateQuantityValidity();
  if (!form.reportValidity() || submitButton.disabled) {
    return;
  }

  const selectedColor = colors.find((color) => color.nom === colorSelect.value);
  if (!selectedColor) {
    return;
  }

  const desired = {
    females: Number(femaleCountInput.value),
    males: Number(maleCountInput.value),
  };
  const current = getCountsForColor(selectedColor.nom);
  const femaleDesiredCapacities = getDesiredCapacityMap("females", desired.females);
  const maleDesiredCapacities = getDesiredCapacityMap("males", desired.males);
  const femaleResult = reconcileColorSex(mounts, "Femelle", desired.females, femaleDesiredCapacities, selectedColor.nom);
  const maleResult = reconcileColorSex(mounts, "Mâle", desired.males, maleDesiredCapacities, selectedColor.nom);
  const selectedColorIndexes = new Set(mounts.flatMap((mount, index) => mount.color === selectedColor.nom ? [index] : []));
  const remainingMounts = mounts.filter((_, index) => !selectedColorIndexes.has(index));
  const nextMounts = [
    ...remainingMounts,
    ...femaleResult.retained,
    ...maleResult.retained,
    ...femaleResult.additions,
    ...maleResult.additions,
  ];

  if (nextMounts.length > MAX_MOUNTS) {
    quantityMessage.textContent = `Le total ne peut pas dépasser ${MAX_MOUNTS} montures.`;
    quantityMessage.hidden = false;
    return;
  }

  if (saveMounts(nextMounts)) {
    syncSelectedColorQuantities();
  }
});

colorSelect.addEventListener("change", syncSelectedColorQuantities);
femaleCountInput.addEventListener("input", updateQuantityValidity);
maleCountInput.addEventListener("input", updateQuantityValidity);

document.querySelector("#export-button").addEventListener("click", () => {
  const exportedMounts = mounts.map((mount) => {
    const color = colors.find((entry) => entry.nom === mount.color);
    return {
      sexe: isFemale(mount.sex) ? "F" : "M",
      couleur: mount.color,
      ...(getMountName(mount) ? { nom: getMountName(mount) } : {}),
      generation: getMountGeneration(mount) ?? color?.generation,
      niveau: mount.level ?? 0,
      capacite: CAPACITIES.includes(mount.capacity) ? mount.capacity : "Aucune",
      fecondite: getFertilityStatus(mount),
      ...(getRemainingReproductions(mount) === null
        ? {}
        : { reproductionsRestantes: getRemainingReproductions(mount) }),
    };
  });
  const file = new Blob([JSON.stringify(exportedMounts, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "montures.json";
  link.click();
  URL.revokeObjectURL(url);
  showTransferMessage("L’export JSON a été téléchargé.");
});

document.querySelector("#settings-export-button").addEventListener("click", () => {
  document.querySelector("#export-button").click();
});

document.querySelector("#import-button").addEventListener("click", () => {
  importFile.click();
});

document.querySelector("#nav-import-button").addEventListener("click", () => {
  importFile.click();
});

document.querySelector("#reset-button").addEventListener("click", () => {
  if (!window.confirm("Supprimer définitivement toutes les montures enregistrées ?")) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PLAN_DONE_KEY);
    localStorage.removeItem(PLANNED_CROSSINGS_KEY);
  } catch {
    showStorageError("Impossible de réinitialiser les données enregistrées dans le navigateur.");
    return;
  }

  mounts = [];
  completedPlanActions.clear();
  plannedCrossings.clear();
  closeCapacityEdit();
  renderMounts();
  syncSelectedColorQuantities();
  showTransferMessage("L’élevage a été réinitialisé.");
});

importFile.addEventListener("change", async () => {
  const [file] = importFile.files;
  importFile.value = "";
  if (!file) {
    return;
  }

  if (!colorsLoaded) {
    showTransferMessage("Attendez le chargement de data/couleurs.json avant d’importer.", true);
    return;
  }

  let importedMounts;
  try {
    importedMounts = JSON.parse(await file.text());
  } catch {
    showTransferMessage("Le fichier sélectionné ne contient pas un JSON lisible.", true);
    return;
  }

  if (!Array.isArray(importedMounts)) {
    showTransferMessage("Le fichier JSON doit contenir un tableau de montures.", true);
    return;
  }

  const knownColors = new Set(colors.map((color) => color.nom));
  const errors = [];
  const normalizedMounts = importedMounts.map((mount, index) => {
    const lineNumber = index + 1;
    if (!mount || typeof mount !== "object" || Array.isArray(mount)) {
      errors.push(`Ligne ${lineNumber} : entrée de monture invalide.`);
      return null;
    }

    if (typeof mount.couleur !== "string" || !knownColors.has(mount.couleur)) {
      errors.push(`Ligne ${lineNumber} : couleur inconnue « ${String(mount.couleur)} ».`);
    }
    if (mount.nom !== undefined && typeof mount.nom !== "string") {
      errors.push(`Ligne ${lineNumber} : le nom doit être du texte.`);
    }
    if (mount.sexe !== "F" && mount.sexe !== "M") {
      errors.push(`Ligne ${lineNumber} : sexe attendu « F » ou « M ».`);
    }
    if (!isGeneration(mount.generation)) {
      errors.push(`Ligne ${lineNumber} : génération invalide (1 à 10).`);
    }
    if (mount.niveau !== undefined && mount.niveau !== null
      && (typeof mount.niveau !== "number" || !Number.isInteger(mount.niveau) || mount.niveau < 0 || mount.niveau > 200)) {
      errors.push(`Ligne ${lineNumber} : niveau invalide (0 à 200).`);
    }
    if (mount.capacite !== undefined && !CAPACITIES.includes(mount.capacite)) {
      errors.push(`Ligne ${lineNumber} : capacité inconnue « ${String(mount.capacite)} ».`);
    }
    if (mount.fecondite !== undefined && !FERTILITY_STATUSES.includes(mount.fecondite)) {
      errors.push(`Ligne ${lineNumber} : fécondité inconnue « ${String(mount.fecondite)} ».`);
    }
    if (mount.reproductionsRestantes !== undefined && mount.reproductionsRestantes !== null
      && (!Number.isInteger(mount.reproductionsRestantes) || mount.reproductionsRestantes < 0)) {
      errors.push(`Ligne ${lineNumber} : les reproductions restantes doivent être un entier positif ou nul.`);
    }

    return {
      name: typeof mount.nom === "string" ? mount.nom.trim() : "",
      sex: mount.sexe === "F" ? "Femelle" : "Mâle",
      color: typeof mount.couleur === "string" ? mount.couleur : "",
      generation: mount.generation,
      level: mount.niveau === undefined || mount.niveau === null ? 0 : mount.niveau,
      capacity: mount.capacite === undefined ? "Aucune" : mount.capacite,
      fertility: mount.fecondite === undefined ? "Inconnu" : mount.fecondite,
      remainingReproductions: mount.reproductionsRestantes === undefined || mount.reproductionsRestantes === null
        ? null
        : mount.reproductionsRestantes,
    };
  });

  if (errors.length > 0) {
    showTransferMessage(errors.join("\n"), true);
    return;
  }

  const replaceExisting = window.confirm("Remplacer les montures actuelles ? Choisissez Annuler pour les ajouter.");
  const nextMounts = replaceExisting ? normalizedMounts : [...mounts, ...normalizedMounts];
  if (nextMounts.length > MAX_MOUNTS) {
    showTransferMessage(`L’import dépasserait le plafond de ${MAX_MOUNTS} montures.`, true);
    return;
  }

  if (saveMounts(nextMounts, "L’import n’a pas pu être sauvegardé. La liste actuelle est conservée.")) {
    syncSelectedColorQuantities();
    showTransferMessage(`Import terminé : ${normalizedMounts.length} monture(s) ${replaceExisting ? "remplacée(s)" : "ajoutée(s)"} .`);
  }
});

initializeTabs();
initializeNavigationEnhancements();
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    globalSearch.focus();
    globalSearch.select();
    return;
  }
  if (event.key === "Escape" && !helpDrawer.hidden) {
    helpDrawer.hidden = true;
    return;
  }
  const activeElement = document.activeElement;
  const isEditing = activeElement instanceof HTMLElement
    && (activeElement.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(activeElement.tagName));
  if (event.key !== "/" || event.altKey || event.ctrlKey || event.metaKey || isEditing || captureReviewDialog.open) return;
  event.preventDefault();
  document.querySelector("#mount-detail").open = true;
  mountSearch.focus();
});
initializeTheme();
initializeGenerationTarget();
initializeOptimakina();
loadMounts();
Promise.all([loadColors(), loadCapacities(), loadPlanConfig()]).finally(() => {
  document.body.classList.remove("is-loading");
  initializeOnboarding();
});
