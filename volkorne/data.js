"use strict";

(() => {
  const colors = [];
  const idsByLabel = new Map();
  const normalize = (value) => value.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const imageSlug = (label) => normalize(label.replace(/\s+et\s+/gi, " "));

  function add(generation, label, parentPairs = []) {
    const color = {
      id: normalize(label),
      label,
      generation,
      image: `montures/${imageSlug(label)}.png`,
      parents: parentPairs,
    };
    colors.push(color);
    idsByLabel.set(normalize(label), color.id);
  }

  function pair(first, second) {
    return [first, second];
  }

  const g1 = ["Indigo", "Ébène", "Pourpre", "Orchidée"];
  for (const label of g1) add(1, label);

  const g2 = [
    "Pourpre-Orchidée", "Pourpre-Indigo", "Pourpre-Ébène",
    "Orchidée-Indigo", "Orchidée-Ébène", "Indigo-Ébène",
  ];
  for (const label of g2) {
    const [first, second] = label.split("-");
    add(2, label, [pair(first, second)]);
  }

  const g3 = {
    Roux: [
      pair("Pourpre-Orchidée", "Pourpre-Indigo"),
      pair("Pourpre-Orchidée", "Pourpre-Ébène"),
      pair("Pourpre-Indigo", "Pourpre-Ébène"),
    ],
    Amande: [
      pair("Pourpre-Ébène", "Orchidée-Ébène"),
      pair("Pourpre-Ébène", "Indigo-Ébène"),
      pair("Orchidée-Ébène", "Indigo-Ébène"),
    ],
    Ivoire: [
      pair("Pourpre-Indigo", "Indigo-Ébène"),
      pair("Pourpre-Indigo", "Orchidée-Indigo"),
      pair("Orchidée-Indigo", "Indigo-Ébène"),
    ],
    Turquoise: [
      pair("Pourpre-Orchidée", "Orchidée-Ébène"),
      pair("Orchidée-Indigo", "Orchidée-Ébène"),
      pair("Pourpre-Orchidée", "Orchidée-Indigo"),
    ],
  };
  for (const [label, parents] of Object.entries(g3)) add(3, label, parents);

  const g4 = [
    ["Amande et pourpre", "Pourpre", "Amande"],
    ["Amande et orchidée", "Orchidée", "Amande"],
    ["Amande et indigo", "Indigo", "Amande"],
    ["Amande et ébène", "Ébène", "Amande"],
    ["Amande et roux", "Roux", "Amande"],
    ["Amande et ivoire", "Amande", "Ivoire"],
    ["Amande et turquoise", "Amande", "Turquoise"],
    ["Roux et pourpre", "Pourpre", "Roux"],
    ["Roux et orchidée", "Orchidée", "Roux"],
    ["Roux et indigo", "Indigo", "Roux"],
    ["Roux et ébène", "Ébène", "Roux"],
    ["Roux et ivoire", "Roux", "Ivoire"],
    ["Roux et turquoise", "Roux", "Turquoise"],
    ["Ivoire et pourpre", "Pourpre", "Ivoire"],
    ["Ivoire et orchidée", "Orchidée", "Ivoire"],
    ["Ivoire et indigo", "Indigo", "Ivoire"],
    ["Ivoire et ébène", "Ébène", "Ivoire"],
    ["Ivoire et turquoise", "Ivoire", "Turquoise"],
    ["Turquoise et pourpre", "Pourpre", "Turquoise"],
    ["Turquoise et orchidée", "Orchidée", "Turquoise"],
    ["Turquoise et indigo", "Indigo", "Turquoise"],
    ["Turquoise et ébène", "Ébène", "Turquoise"],
  ];
  for (const [label, first, second] of g4) add(4, label, [pair(first, second)]);

  const g5 = {
    Prune: [
      ["Amande et pourpre", "Amande et roux"],
      ["Amande et orchidée", "Amande et roux"],
      ["Amande et indigo", "Amande et roux"],
      ["Amande et ébène", "Amande et roux"],
      ["Amande et roux", "Amande et turquoise"],
      ["Amande et roux", "Amande et ivoire"],
      ["Amande et roux", "Roux et pourpre"],
      ["Amande et roux", "Roux et orchidée"],
      ["Amande et roux", "Roux et indigo"],
      ["Amande et roux", "Roux et ébène"],
      ["Amande et roux", "Roux et ivoire"],
      ["Amande et roux", "Roux et turquoise"],
    ],
    Émeraude: [
      ["Ivoire et orchidée", "Ivoire et turquoise"],
      ["Ivoire et indigo", "Ivoire et turquoise"],
      ["Ivoire et ébène", "Ivoire et turquoise"],
      ["Ivoire et turquoise", "Turquoise et orchidée"],
      ["Ivoire et pourpre", "Ivoire et turquoise"],
      ["Roux et ivoire", "Ivoire et turquoise"],
      ["Roux et turquoise", "Ivoire et turquoise"],
      ["Amande et turquoise", "Ivoire et turquoise"],
      ["Amande et ivoire", "Ivoire et turquoise"],
      ["Ivoire et turquoise", "Turquoise et pourpre"],
      ["Ivoire et turquoise", "Turquoise et indigo"],
      ["Ivoire et turquoise", "Turquoise et ébène"],
    ],
  };
  for (const [label, parents] of Object.entries(g5)) add(5, label, parents);

  const g6 = [
    ["Prune et pourpre", "Pourpre", "Prune"],
    ["Prune et orchidée", "Orchidée", "Prune"],
    ["Prune et indigo", "Indigo", "Prune"],
    ["Prune et ébène", "Ébène", "Prune"],
    ["Prune et amande", "Amande", "Prune"],
    ["Prune et turquoise", "Turquoise", "Prune"],
    ["Prune et émeraude", "Prune", "Émeraude"],
    ["Émeraude et pourpre", "Pourpre", "Émeraude"],
    ["Émeraude et orchidée", "Orchidée", "Émeraude"],
    ["Émeraude et indigo", "Indigo", "Émeraude"],
    ["Émeraude et ébène", "Ébène", "Émeraude"],
    ["Émeraude et amande", "Amande", "Émeraude"],
    ["Émeraude et roux", "Roux", "Émeraude"],
    ["Émeraude et ivoire", "Ivoire", "Émeraude"],
    ["Émeraude et turquoise", "Turquoise", "Émeraude"],
    ["Prune et roux", "Roux", "Prune"],
    ["Prune et ivoire", "Ivoire", "Prune"],
  ];
  for (const [label, first, second] of g6) add(6, label, [pair(first, second)]);

  add(7, "Doré", [
    pair("Prune et pourpre", "Émeraude et roux"),
    pair("Prune et orchidée", "Émeraude et turquoise"),
    pair("Prune et indigo", "Émeraude et ivoire"),
    pair("Prune et ébène", "Émeraude et amande"),
    pair("Prune et amande", "Émeraude et ébène"),
    pair("Prune et turquoise", "Émeraude et orchidée"),
    pair("Émeraude et pourpre", "Prune et roux"),
    pair("Émeraude et indigo", "Prune et ivoire"),
  ]);

  const g8 = [
    ["Doré et pourpre", "Pourpre", "Doré"],
    ["Doré et orchidée", "Orchidée", "Doré"],
    ["Doré et indigo", "Indigo", "Doré"],
    ["Doré et ébène", "Ébène", "Doré"],
    ["Doré et roux", "Roux", "Doré"],
    ["Doré et amande", "Amande", "Doré"],
    ["Doré et ivoire", "Ivoire", "Doré"],
    ["Doré et turquoise", "Turquoise", "Doré"],
    ["Doré et prune", "Prune", "Doré"],
    ["Doré et émeraude", "Émeraude", "Doré"],
  ];
  for (const [label, first, second] of g8) add(8, label, [pair(first, second)]);

  const g9 = {
    Jade: [
      pair("Prune et émeraude", "Doré et pourpre"),
      pair("Doré et roux", "Doré et prune"),
    ],
    Rubis: [
      pair("Prune et émeraude", "Doré et orchidée"),
      pair("Doré et amande", "Doré et prune"),
    ],
    Saphir: [
      pair("Prune et émeraude", "Doré et indigo"),
      pair("Doré et turquoise", "Doré et émeraude"),
    ],
    Améthyste: [
      pair("Prune et émeraude", "Doré et ébène"),
      pair("Doré et ivoire", "Doré et émeraude"),
    ],
  };
  for (const [label, parents] of Object.entries(g9)) add(9, label, parents);

  const gen10Basics = [
    ["pourpre", "Pourpre"],
    ["orchidée", "Orchidée"],
    ["indigo", "Indigo"],
    ["ébène", "Ébène"],
    ["amande", "Amande"],
    ["roux", "Roux"],
    ["ivoire", "Ivoire"],
    ["turquoise", "Turquoise"],
    ["prune", "Prune"],
    ["émeraude", "Émeraude"],
    ["doré", "Doré"],
  ];
  const g10Groups = [
    {
      base: "Jade",
      extras: [
        ["rubis", "Rubis"],
        ["saphir", "Saphir"],
        ["améthyste", "Améthyste"],
      ],
    },
    {
      base: "Rubis",
      extras: [
        ["saphir", "Saphir"],
        ["améthyste", "Améthyste"],
      ],
    },
    {
      base: "Saphir",
      extras: [["améthyste", "Améthyste"]],
    },
    { base: "Améthyste", extras: [] },
  ];
  for (const { base, extras } of g10Groups) {
    const baseId = idsByLabel.get(normalize(base));
    for (const [slug, parentLabel] of gen10Basics) {
      const label = `${base} et ${slug}`;
      const canonicalLabel = `${base} et ${parentLabel.toLowerCase()}`;
      add(10, canonicalLabel, [pair(parentLabel, base)]);
    }
    for (const [, parentLabel] of extras) {
      add(10, `${base} et ${parentLabel.toLowerCase()}`, [pair(base, parentLabel)]);
    }
    if (!baseId) console.error(`[Volkorne] Parent de génération 10 introuvable : ${base}`);
  }

  const ids = new Set(colors.map((color) => color.id));
  const countsByGeneration = new Map();
  for (const color of colors) {
    countsByGeneration.set(color.generation, (countsByGeneration.get(color.generation) || 0) + 1);
    if (color.parents.length !== 0 && color.generation !== 1 && color.parents.length === 0) {
      console.error(`[Volkorne] Aucun parent déclaré pour ${color.label}.`);
    }
    for (const parents of color.parents) {
      for (const parent of parents) {
        if (!ids.has(normalize(parent))) {
          console.error(`[Volkorne] Parent absent de la table : ${color.label} → ${parent}.`);
        }
      }
    }
  }
  for (let generation = 1; generation <= 10; generation += 1) {
    console.info(`[Volkorne] Génération ${generation} : ${countsByGeneration.get(generation) || 0} couleurs.`);
  }

  window.VOLKORNE_COLORS = colors;
})();
