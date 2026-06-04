const scansPerDay = Number(process.argv[2] || 100);
const secondsPerScan = Number(process.argv[3] || 15);
const daysPerMonth = Number(process.argv[4] || 30);

if (!Number.isFinite(scansPerDay) || !Number.isFinite(secondsPerScan) || !Number.isFinite(daysPerMonth)) {
  console.error("Usage: node estimate-browser-cost.mjs <scansPerDay> <secondsPerScan> <daysPerMonth>");
  process.exit(1);
}

const monthlyScans = scansPerDay * daysPerMonth;
const browserHours = (monthlyScans * secondsPerScan) / 3600;
const browserlessUnits = Math.ceil((monthlyScans * secondsPerScan) / 30);

const browserlessFreeUnits = 1000;
const browserlessPrototypeUnits = 20000;
const browserlessOverageUnitPrice = 0.002;
const browserbaseFreeHours = 1;
const browserbaseDeveloperHours = 100;
const browserbaseOverageHourPrice = 0.12;

const browserlessFreeOverUnits = Math.max(0, browserlessUnits - browserlessFreeUnits);
const browserlessPrototypeOverUnits = Math.max(0, browserlessUnits - browserlessPrototypeUnits);
const browserbaseFreeOverHours = Math.max(0, browserHours - browserbaseFreeHours);
const browserbaseDeveloperOverHours = Math.max(0, browserHours - browserbaseDeveloperHours);

console.log(
  JSON.stringify(
    {
      input: { scansPerDay, secondsPerScan, daysPerMonth },
      monthlyScans,
      browserHours: Number(browserHours.toFixed(2)),
      browserlessUnits,
      roughPlans: {
        browserlessFree: {
          includedUnits: browserlessFreeUnits,
          overUnits: browserlessFreeOverUnits,
        },
        browserlessPrototyping25Monthly: {
          includedUnits: browserlessPrototypeUnits,
          overUnits: browserlessPrototypeOverUnits,
          estimatedOverageUsd: Number((browserlessPrototypeOverUnits * browserlessOverageUnitPrice).toFixed(2)),
        },
        browserbaseFree: {
          includedBrowserHours: browserbaseFreeHours,
          overBrowserHours: Number(browserbaseFreeOverHours.toFixed(2)),
        },
        browserbaseDeveloper20Monthly: {
          includedBrowserHours: browserbaseDeveloperHours,
          overBrowserHours: Number(browserbaseDeveloperOverHours.toFixed(2)),
          estimatedOverageUsd: Number((browserbaseDeveloperOverHours * browserbaseOverageHourPrice).toFixed(2)),
        },
      },
    },
    null,
    2,
  ),
);
