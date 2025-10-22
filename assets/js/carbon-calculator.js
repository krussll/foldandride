const EMISSION_FACTORS = {
  flight: {
    economy: 0.255, // kg CO2e per passenger-km
    premium: 0.33,
    business: 0.43,
    first: 0.6,
  },
  rail: {
    standard: 0.041,
    highspeed: 0.019,
  },
  coach: {
    standard: 0.027,
  },
  car: {
    petrol: 0.192,
    diesel: 0.171,
    hybrid: 0.11,
    ev: 0.016,
  },
  ferry: {
    standard: 0.115,
  },
};

const OFFSET_PROJECTS = [
  {
    provider: 'Gold Standard Marketplace',
    projectType: 'Clean cookstoves & community energy',
    priceRangePerTonne: {
      currency: 'USD',
      min: 18,
      max: 28,
    },
    url: 'https://marketplace.goldstandard.org/',
    summary:
      'Supports cleaner cooking technologies that cut fuel use, improve indoor air, and reduce deforestation.',
  },
  {
    provider: 'Cool Effect',
    projectType: 'Forestry & avoided deforestation',
    priceRangePerTonne: {
      currency: 'USD',
      min: 15,
      max: 24,
    },
    url: 'https://www.cooleffect.org/',
    summary: 'Protects high-biodiversity forests while funding local stewardship and monitoring.',
  },
  {
    provider: 'Terrapass',
    projectType: 'Renewable energy & methane capture',
    priceRangePerTonne: {
      currency: 'USD',
      min: 13,
      max: 22,
    },
    url: 'https://www.terrapass.com/',
    summary: 'Bundles wind, solar, and landfill gas projects that displace fossil fuel generation.',
  },
  {
    provider: 'Ecologi',
    projectType: 'Reforestation & carbon removal',
    priceRangePerTonne: {
      currency: 'USD',
      min: 11,
      max: 19,
    },
    url: 'https://ecologi.com/',
    summary: 'Combines global tree planting with verified carbon removal for longer-term impact.',
  },
];

const RETURN_TRIP_MULTIPLIERS = {
  'one-way': 1,
  return: 2,
  roundtrip: 2,
};

function normaliseMode(mode = '') {
  return String(mode).trim().toLowerCase();
}

function normaliseClass(travelClass = '') {
  return String(travelClass).trim().toLowerCase() || 'standard';
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function extractPresetRoutes(form) {
  if (!form) return {};
  const datasetRoutes = form.dataset.routes;
  if (!datasetRoutes) return {};
  try {
    const parsed = JSON.parse(datasetRoutes);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (error) {
    console.warn('Unable to parse preset routes from data-routes attribute', error);
  }
  return {};
}

export function resolveRouteDistance(routeId, presetRoutes = {}, fallback = null) {
  if (!routeId) return fallback;
  const normalised = String(routeId).trim();
  if (normalised in presetRoutes) {
    const raw = presetRoutes[normalised];
    const numeric = parseNumber(raw?.distance ?? raw);
    if (numeric !== null) {
      return numeric;
    }
  }
  return fallback;
}

export function calculateDistanceForLeg(leg, presetRoutes = {}) {
  if (!leg) return 0;
  const explicitDistance = parseNumber(leg.distanceKm ?? leg.distance);
  if (explicitDistance !== null) {
    return Math.max(0, explicitDistance);
  }
  const { routeId } = leg;
  if (routeId) {
    const resolved = resolveRouteDistance(routeId, presetRoutes);
    if (resolved !== null && resolved !== undefined) {
      return Math.max(0, resolved);
    }
  }
  if (typeof leg.routeDistance === 'number') {
    return Math.max(0, leg.routeDistance);
  }
  return 0;
}

export function getEmissionFactor(mode, travelClass = 'standard', emissionFactors = EMISSION_FACTORS) {
  const normalisedMode = normaliseMode(mode);
  const factorsForMode = emissionFactors[normalisedMode];
  if (!factorsForMode) return null;

  if (typeof factorsForMode === 'number') {
    return factorsForMode;
  }

  const normalisedClass = normaliseClass(travelClass);
  if (normalisedClass in factorsForMode) {
    return factorsForMode[normalisedClass];
  }

  // fall back to a known key if available
  if ('standard' in factorsForMode) {
    return factorsForMode.standard;
  }

  const firstValueKey = Object.keys(factorsForMode)[0];
  return factorsForMode[firstValueKey];
}

export function calculateEmissionsForLeg(leg, options = {}) {
  const {
    emissionFactors = EMISSION_FACTORS,
    presetRoutes = {},
    passengers: defaultPassengers,
  } = options;

  if (!leg) {
    return {
      mode: undefined,
      travelClass: undefined,
      distanceKm: 0,
      passengers: 0,
      emissionsKg: 0,
    };
  }

  const mode = normaliseMode(leg.mode);
  const travelClass = normaliseClass(leg.travelClass ?? leg.class);
  const passengersCount = parseNumber(leg.passengers) ?? parseNumber(defaultPassengers) ?? 1;
  const passengers = Math.max(1, passengersCount);
  const distanceKm = calculateDistanceForLeg(leg, presetRoutes);

  const factor = getEmissionFactor(mode, travelClass, emissionFactors);
  if (!factor || !distanceKm) {
    return {
      mode,
      travelClass,
      distanceKm,
      passengers,
      emissionsKg: 0,
    };
  }

  const emissionsKg = distanceKm * factor * passengers;

  return {
    mode,
    travelClass,
    distanceKm,
    passengers,
    emissionsKg,
  };
}

export function parseCalculatorForm(form, presetRoutes = {}) {
  if (!(form instanceof HTMLFormElement)) {
    throw new Error('Expected an HTMLFormElement when parsing the carbon calculator form.');
  }

  const legs = [];
  const legElements = form.querySelectorAll('[data-carbon-leg]');

  const parseLegElement = (legEl) => {
    const modeEl = legEl.querySelector(
      '[name="mode"], [name="travelMode"], [data-mode]'
    );
    const mode = modeEl?.value ?? modeEl?.dataset?.mode ?? legEl.dataset.mode;

    const classEl = legEl.querySelector(
      '[name="class"], [name="travelClass"], [name="cabinClass"], [data-class]'
    );
    const travelClass = classEl?.value ?? classEl?.dataset?.class ?? legEl.dataset.class;

    const passengersEl = legEl.querySelector('[name="passengers"], [data-passengers]');
    const passengers = passengersEl?.value ?? passengersEl?.dataset?.passengers ?? legEl.dataset.passengers;

    const distanceInput = legEl.querySelector('[name="distance"], [data-distance]');
    const distanceKm = distanceInput ? parseNumber(distanceInput.value ?? distanceInput.dataset.distance) : null;

    const routeSelect = legEl.querySelector('[name="route"], [data-route]');
    let routeId = routeSelect ? (routeSelect.value || routeSelect.dataset.route) : legEl.dataset.route;

    if (routeSelect && routeSelect instanceof HTMLSelectElement) {
      const selectedOption = routeSelect.options[routeSelect.selectedIndex];
      if (selectedOption) {
        const optionDistance = parseNumber(selectedOption.dataset.distance);
        if (distanceKm === null && optionDistance !== null) {
          // prefer preset distance when no manual distance is provided
          return {
            mode,
            travelClass,
            passengers,
            distanceKm: optionDistance,
            routeId: routeId || selectedOption.value,
          };
        }
        if (!routeId) {
          routeId = selectedOption.value;
        }
      }
    }

    const legData = {
      mode,
      travelClass,
      passengers,
      distanceKm,
      routeId,
    };

    if (distanceKm === null && routeId) {
      const resolved = resolveRouteDistance(routeId, presetRoutes);
      if (resolved !== null) {
        legData.distanceKm = resolved;
      }
    }

    return legData;
  };

  if (legElements.length) {
    legElements.forEach((legEl) => {
      const leg = parseLegElement(legEl);
      if (leg.mode) {
        legs.push(leg);
      }
    });
  } else {
    // fallback to form-wide elements
    const leg = parseLegElement(form);
    if (leg.mode) {
      legs.push(leg);
    }
  }

  const tripTypeInput = form.querySelector('[name="tripType"]:checked, [name="tripType"]');
  const tripType = tripTypeInput?.value || form.dataset.tripType || 'one-way';

  const tripsPerYearInput = form.querySelector(
    '[name="tripsPerYear"], [name="frequency"], [data-trips-per-year]'
  );
  const tripsPerYearValue =
    parseNumber(tripsPerYearInput?.value ?? tripsPerYearInput?.dataset.tripsPerYear) ?? 1;

  const tripsPerYear = Math.max(1, tripsPerYearValue);

  return {
    legs,
    tripType: String(tripType).toLowerCase(),
    tripsPerYear,
  };
}

export function calculateTripBreakdown(parsedForm, options = {}) {
  const {
    emissionFactors = EMISSION_FACTORS,
    presetRoutes = {},
  } = options;

  const legs = parsedForm?.legs ?? [];
  const tripType = parsedForm?.tripType ?? 'one-way';
  const tripsPerYear = Math.max(1, parsedForm?.tripsPerYear ?? 1);

  const legResults = legs
    .map((leg) => calculateEmissionsForLeg(leg, { emissionFactors, presetRoutes }))
    .filter((result) => result.mode && Number.isFinite(result.emissionsKg));

  const singleTripEmissionsKg = legResults.reduce((sum, leg) => sum + leg.emissionsKg, 0);
  const tripMultiplier = RETURN_TRIP_MULTIPLIERS[tripType] ?? 1;
  const totalEmissionsKg = singleTripEmissionsKg * tripMultiplier * tripsPerYear;

  return {
    legs: legResults,
    tripType,
    tripMultiplier,
    tripsPerYear,
    singleTripEmissionsKg,
    totalEmissionsKg,
  };
}

function formatNumber(value, options = {}) {
  const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...options,
  });
  return formatter.format(value);
}

function formatKilograms(value) {
  return `${formatNumber(value, { maximumFractionDigits: value >= 100 ? 0 : 2 })} kg CO₂e`;
}

function formatDistance(value) {
  return `${formatNumber(value, { maximumFractionDigits: value >= 100 ? 0 : 1 })} km`;
}

function titleCase(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatTonnes(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const digits = safeValue >= 10 ? 1 : 2;
  return `${formatNumber(safeValue, { maximumFractionDigits: digits, minimumFractionDigits: safeValue >= 1 ? 1 : 2 })} t CO₂e`;
}

function formatCurrency(value, currency = 'USD') {
  if (!Number.isFinite(value)) return null;
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  });
  return formatter.format(value);
}

function formatPriceRange(range, tonnes) {
  if (!range) return '';
  const { min, max, currency = 'USD' } = range;
  if (!Number.isFinite(min) && !Number.isFinite(max)) {
    return '';
  }

  const multiplier = Number.isFinite(tonnes) && tonnes > 0 ? tonnes : 1;
  const minCost = Number.isFinite(min) ? min * multiplier : null;
  const maxCost = Number.isFinite(max) ? max * multiplier : null;

  if (minCost !== null && maxCost !== null) {
    return `${formatCurrency(minCost, currency)} – ${formatCurrency(maxCost, currency)}`;
  }
  if (minCost !== null) {
    return `From ${formatCurrency(minCost, currency)}`;
  }
  if (maxCost !== null) {
    return `Up to ${formatCurrency(maxCost, currency)}`;
  }
  return '';
}

function calculateRecommendedTonnes(totalEmissionsKg) {
  if (!Number.isFinite(totalEmissionsKg) || totalEmissionsKg <= 0) {
    return 0;
  }
  const tonnes = totalEmissionsKg / 1000;
  if (tonnes <= 0) return 0;
  const rounded = Math.ceil(tonnes * 10) / 10;
  return Number.isFinite(rounded) && rounded > 0 ? rounded : tonnes;
}

function renderOffsetSuggestions(container, totalEmissionsKg, projects = OFFSET_PROJECTS) {
  if (!container) return;

  const validProjects = Array.isArray(projects)
    ? projects.filter((project) => project && project.provider && project.url)
    : [];

  const recommendedTonnes = calculateRecommendedTonnes(totalEmissionsKg);

  if (!validProjects.length || recommendedTonnes <= 0) {
    container.innerHTML =
      '<p class="rounded-lg border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600">Calculate a trip to unlock personalised offset recommendations matched to your emissions.</p>';
    return;
  }

  const actualTonnes = totalEmissionsKg / 1000;
  const projectsMarkup = validProjects
    .map((project) => {
      const priceText = formatPriceRange(project.priceRangePerTonne, recommendedTonnes);
      const summaryText = project.summary ? `<p class="text-xs text-slate-500">${project.summary}</p>` : '';
      const projectType = project.projectType ? `<p class="text-xs font-medium uppercase tracking-wide text-slate-500">${project.projectType}</p>` : '';
      const coverageText = `Covers ${formatTonnes(recommendedTonnes)} for your ${formatTonnes(actualTonnes)} trip`;

      return `
        <article class="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:border-[#0D9488] hover:shadow-md">
          <div class="space-y-2">
            ${projectType}
            <h3 class="text-base font-semibold text-slate-900">${project.provider}</h3>
            <p class="text-sm text-slate-600">${coverageText}</p>
            ${summaryText}
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p class="text-sm font-medium text-slate-700">${priceText || 'See live pricing per tonne'}</p>
            <a class="inline-flex items-center justify-center rounded-full bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0fb7a4] focus:outline-none focus:ring focus:ring-[#0D9488]/40" href="${project.url}" target="_blank" rel="noopener">
              Offset ${formatNumber(recommendedTonnes, { maximumFractionDigits: recommendedTonnes >= 1 ? 1 : 2 })} t
            </a>
          </div>
        </article>
      `;
    })
    .join('');

  container.innerHTML = projectsMarkup;
}

function renderBreakdown(container, breakdown = { legs: [] }) {
  if (!container) return;

  const safeBreakdown = {
    legs: [],
    singleTripEmissionsKg: 0,
    totalEmissionsKg: 0,
    tripsPerYear: 1,
    tripMultiplier: 1,
    ...breakdown,
  };

  if (!safeBreakdown.legs.length) {
    container.innerHTML =
      '<p class="carbon-results__empty rounded-lg border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600">Please enter at least one journey leg with a travel mode and distance.</p>';
    return;
  }

  const legRows = safeBreakdown.legs
    .map((leg, index) => {
      const labelParts = [titleCase(leg.mode)].filter(Boolean);
      if (leg.travelClass && leg.travelClass !== 'standard') {
        labelParts.push(`(${titleCase(leg.travelClass)})`);
      }
      return `
        <tr>
          <td class="px-4 py-2 font-medium text-slate-600">Leg ${index + 1}</td>
          <td class="px-4 py-2">${labelParts.join(' ')}</td>
          <td class="px-4 py-2">${formatDistance(leg.distanceKm)}</td>
          <td class="px-4 py-2">${formatNumber(leg.passengers)} passenger${leg.passengers === 1 ? '' : 's'}</td>
          <td class="px-4 py-2">${formatKilograms(leg.emissionsKg)}</td>
        </tr>
      `;
    })
    .join('');

  const singleTripText = formatKilograms(safeBreakdown.singleTripEmissionsKg);
  const totalText = formatKilograms(safeBreakdown.totalEmissionsKg);
  const frequencyText = safeBreakdown.tripMultiplier * safeBreakdown.tripsPerYear;
  const zeroNotice =
    safeBreakdown.singleTripEmissionsKg === 0
      ? '<p class="carbon-results__warning rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">We couldn\'t calculate emissions for this trip. Double-check the distance and mode details.</p>'
      : '';

  container.innerHTML = `
    ${zeroNotice}
    <div class="carbon-results__summary space-y-1 rounded-xl bg-white/70 p-4 text-sm text-slate-700 shadow-sm">
      <p><strong>Single trip emissions:</strong> ${singleTripText}</p>
      <p><strong>Total emissions</strong> (including ${frequencyText} trip${frequencyText === 1 ? '' : 's'}): ${totalText}</p>
    </div>
    <table class="carbon-results__table mt-4 w-full overflow-hidden rounded-xl border border-slate-200 text-sm text-slate-700 shadow-sm">
      <thead>
        <tr>
          <th scope="col" class="bg-slate-100 px-4 py-2 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">Leg</th>
          <th scope="col" class="bg-slate-100 px-4 py-2 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">Mode</th>
          <th scope="col" class="bg-slate-100 px-4 py-2 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">Distance</th>
          <th scope="col" class="bg-slate-100 px-4 py-2 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">Passengers</th>
          <th scope="col" class="bg-slate-100 px-4 py-2 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">Emissions</th>
        </tr>
      </thead>
      <tbody>
        ${legRows}
      </tbody>
    </table>
  `;
}

function getStickyHeaderOffset() {
  if (typeof document === 'undefined') {
    return 0;
  }

  const header = document.querySelector('header.sticky');
  if (!(header instanceof HTMLElement)) {
    return 0;
  }

  const { height } = header.getBoundingClientRect();
  return Number.isFinite(height) ? height : 0;
}

function scrollResultsIntoView(resultsContainer) {
  if (!(resultsContainer instanceof HTMLElement)) {
    return;
  }

  const scrollTarget = resultsContainer.closest('[id="carbon-results"]') || resultsContainer;

  const schedule =
    typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : (callback) => callback();

  schedule(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const headerOffset = getStickyHeaderOffset();
    const buffer = 16; // add a little breathing room beneath the sticky header

    if (typeof window.scrollTo === 'function' && typeof scrollTarget.getBoundingClientRect === 'function') {
      const rect = scrollTarget.getBoundingClientRect();
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
      const targetScroll = rect.top + currentScroll - headerOffset - buffer;
      window.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      return;
    }

    if (typeof scrollTarget.scrollIntoView === 'function') {
      scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const resultsContainer = document.getElementById('carbon-results');
  if (!resultsContainer) {
    console.warn('Missing carbon results container with id "carbon-results".');
    return;
  }

  const presetRoutes = extractPresetRoutes(form);
  const parsed = parseCalculatorForm(form, presetRoutes);
  const offsetContainer = document.getElementById('offset-suggestions');

  if (!parsed.legs.length) {
    renderBreakdown(resultsContainer, { legs: [] });
    renderOffsetSuggestions(offsetContainer, 0);
    scrollResultsIntoView(resultsContainer);
    return;
  }

  const breakdown = calculateTripBreakdown(parsed, { presetRoutes });
  renderBreakdown(resultsContainer, breakdown);
  renderOffsetSuggestions(offsetContainer, breakdown.totalEmissionsKg);
  scrollResultsIntoView(resultsContainer);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const form =
      document.querySelector('[data-carbon-calculator]') ||
      document.getElementById('carbon-calculator-form') ||
      document.getElementById('carbon-calculator');
    if (!form) {
      return;
    }

    const stepper = form.querySelector('[data-carbon-stepper]');
    if (stepper) {
      const modeStep = stepper.querySelector('[data-step="mode"]');
      const detailsStep = stepper.querySelector('[data-step="details"]');
      const continueButton = stepper.querySelector('[data-step-continue]');
      const modeSelect = stepper.querySelector('[name="travelMode"]');

      const completionMessage = stepper.querySelector('[data-step-complete-message]');

      const revealDetails = (options = {}) => {
        if (!detailsStep || !modeStep) {
          return;
        }

        if (!modeSelect?.value) {
          return;
        }

        if (detailsStep.classList.contains('hidden')) {
          detailsStep.classList.remove('hidden');
        }
        detailsStep.removeAttribute('aria-hidden');
        modeStep.setAttribute('data-step-complete', 'true');
        stepper.setAttribute('data-stepper-state', 'details');
        if (completionMessage && completionMessage.classList.contains('hidden')) {
          completionMessage.classList.remove('hidden');
        }

        if (options.focus !== false) {
          const focusTarget = detailsStep.querySelector('[data-step-focus]');
          if (focusTarget instanceof HTMLElement) {
            focusTarget.focus();
          }
        }
      };

      const updateContinueState = () => {
        if (!continueButton) return;
        const hasSelection = Boolean(modeSelect?.value);
        continueButton.disabled = !hasSelection;
        if (hasSelection && stepper.getAttribute('data-stepper-state') === 'details') {
          // ensure mode can be re-enabled if the user changed their mind
          revealDetails({ focus: false });
        }
      };

      if (continueButton) {
        continueButton.addEventListener('click', (event) => {
          event.preventDefault();
          revealDetails();
        });
      }

      if (modeSelect) {
        modeSelect.addEventListener('change', () => {
          updateContinueState();
        });
        updateContinueState();
        if (modeSelect.value) {
          revealDetails({ focus: false });
        }
      }
    }

    form.addEventListener('submit', handleFormSubmit);

    const offsetContainer = document.getElementById('offset-suggestions');
    if (offsetContainer) {
      renderOffsetSuggestions(offsetContainer, 0);
    }
  });
}

export {
  EMISSION_FACTORS,
  OFFSET_PROJECTS,
};

