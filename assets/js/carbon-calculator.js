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
  if (!parsed.legs.length) {
    renderBreakdown(resultsContainer, { legs: [] });
    return;
  }

  const breakdown = calculateTripBreakdown(parsed, { presetRoutes });
  renderBreakdown(resultsContainer, breakdown);
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

    form.addEventListener('submit', handleFormSubmit);
  });
}

export {
  EMISSION_FACTORS,
};

