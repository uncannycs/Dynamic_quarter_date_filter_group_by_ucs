/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { sprintf } from "@web/core/utils/strings";
import { QUARTERS, PERIOD_OPTIONS, QUARTER_OPTIONS, setParam, getSelectedOptions, sortPeriodOptions, getMonthPeriodOptions, getComparisonParams, getSetParam} from "@web/search/utils/dates";
import { Domain } from "@web/core/domain";
import { serializeDate, serializeDateTime } from "@web/core/l10n/dates";
import { localization } from "@web/core/l10n/localization";
import { SearchModel } from "@web/search/search_model";
import { rpc } from "@web/core/network/rpc";
export const DEFAULT_PERIOD = "this_month";
import { clamp } from "@web/core/utils/numbers";

// Global variable to store fiscal quarters
let FISCAL_QUARTERS = {};

// Function to load fiscal year configuration from backend using company's fiscal year last month
async function loadFiscalYearConfig() {
    try {
        const result = await rpc("/web/dataset/call_kw", {
            model: "res.config.settings",
            method: "get_fiscal_quarters",
            args: [],
            kwargs: {},
        });
        return result;
    } catch (error) {
        console.error("Error loading fiscal year config:", error);
        // Fallback to default Indian fiscal year (April-March)
        return {
            1: { description: "Q1", coveredMonths: [4, 5, 6] },
            2: { description: "Q2", coveredMonths: [7, 8, 9] },
            3: { description: "Q3", coveredMonths: [10, 11, 12] },
            4: { description: "Q4", coveredMonths: [1, 2, 3] }
        };
    }
}

// Initialize fiscal quarters
loadFiscalYearConfig().then(quarters => {
    FISCAL_QUARTERS = quarters;
    // Update QUARTERS object with fiscal configuration
    Object.keys(quarters).forEach(key => {
        QUARTERS[key] = quarters[key];
    });
});

// Update QUARTER_OPTIONS with dynamic fiscal quarters
function updateQuarterOptions() {
    Object.keys(FISCAL_QUARTERS).forEach(quarterNum => {
        const quarter = FISCAL_QUARTERS[quarterNum];
        const optionKey = `quarter_${quarterNum}`;
        
        QUARTER_OPTIONS[optionKey] = {
            id: optionKey,
            groupNumber: 1,
            description: quarter.description,
            setParam: { quarter: parseInt(quarterNum) },
            granularity: "quarter",
        };
    });
}

export function getQuarterPeriodOptionsCustom(optionsParams) {
    // Ensure quarter options are updated with latest fiscal config
    updateQuarterOptions();
    
    const { startYear, endYear } = optionsParams;
    const defaultYearId = toGeneratorId("year", clamp(0, startYear, endYear));
    return Object.values(QUARTER_OPTIONS).map((quarter) => ({
        ...quarter,
        defaultYearId,
    }));
}

export function constructDateDomainCustom(
    referenceMoment,
    searchItem,
    selectedOptionIds,
    comparisonOptionId
) {
    let plusParam;
    let selectedOptions;
    if (comparisonOptionId) {
        [plusParam, selectedOptions] = getComparisonParams(
            referenceMoment,
            searchItem,
            selectedOptionIds,
            comparisonOptionId
        );
    } else {
        selectedOptions = getSelectedOptionsCustom(referenceMoment, searchItem, selectedOptionIds);
    }
    if ("withDomain" in selectedOptions) {
        return {
            description: selectedOptions.withDomain[0].description,
            domain: Domain.and([selectedOptions.withDomain[0].domain, searchItem.domain]),
        };
    }
    const yearOptions = selectedOptions.year;
    const otherOptions = [...(selectedOptions.quarter || []), ...(selectedOptions.month || [])];
    sortPeriodOptions(yearOptions);
    sortPeriodOptions(otherOptions);
    const ranges = [];
    const { fieldName, fieldType } = searchItem;
    for (const yearOption of yearOptions) {
        const constructRangeParams = {
            referenceMoment,
            fieldName,
            fieldType,
            plusParam,
        };
        if (otherOptions.length) {
            for (const option of otherOptions) {
                const setParam = Object.assign(
                    {},
                    yearOption.setParam,
                    option ? option.setParam : {}
                );
                const { granularity } = option;
                const range = constructDateRangeCustom(
                    Object.assign({ granularity, setParam }, constructRangeParams)
                );
                ranges.push(range);
            }
        } else {
            const { granularity, setParam } = yearOption;
            const range = constructDateRangeCustom(
                Object.assign({ granularity, setParam }, constructRangeParams)
            );
            ranges.push(range);
        }
    }
    let domain = Domain.combine(
        ranges.map((range) => range.domain),
        "OR"
    );
    domain = Domain.and([domain, searchItem.domain]);
    const description = ranges.map((range) => range.description).join("/");
    return { domain, description };
}

export function getPeriodOptionsCustom(referenceMoment, optionsParams) {
    return [
        ...getMonthPeriodOptionsCustom(referenceMoment, optionsParams),
        ...getQuarterPeriodOptionsCustom(optionsParams),
        ...getYearPeriodOptionsCustom(referenceMoment, optionsParams),
        ...getCustomPeriodOptionsCustom(optionsParams),
    ];
}

function getYearPeriodOptionsCustom(referenceMoment, optionsParams) {
    const { startYear, endYear } = optionsParams;
    return [...Array(endYear - startYear + 1).keys()]
        .map((i) => {
            const offset = startYear + i;
            const date = referenceMoment.plus({ years: offset });
            return {
                id: toGeneratorId("year", offset),
                description: date.toFormat("yyyy"),
                granularity: "year",
                groupNumber: 2,
                plusParam: { years: offset },
            };
        })
        .reverse();
}

function getCustomPeriodOptionsCustom(optionsParams) {
    const { customOptions } = optionsParams;
    return customOptions.map((option) => ({
        id: option.id,
        description: option.description,
        granularity: "withDomain",
        groupNumber: 3,
        domain: option.domain,
    }));
}

function getMonthPeriodOptionsCustom(referenceMoment, optionsParams) {
    const { startYear, endYear, startMonth, endMonth } = optionsParams;
    return [...Array(endMonth - startMonth + 1).keys()]
        .map((i) => {
            const monthOffset = startMonth + i;
            const date = referenceMoment.plus({
                months: monthOffset,
                years: clamp(0, startYear, endYear),
            });
            const yearOffset = date.year - referenceMoment.year;
            return {
                id: toGeneratorId("month", monthOffset),
                defaultYearId: toGeneratorId("year", clamp(yearOffset, startYear, endYear)),
                description: date.toFormat("MMMM"),
                granularity: "month",
                groupNumber: 1,
                plusParam: { months: monthOffset },
            };
        })
        .reverse();
}

export function toGeneratorId(unit, offset) {
    if (!offset) {
        return unit;
    }
    const sep = offset > 0 ? "+" : "-";
    const val = Math.abs(offset);
    return `${unit}${sep}${val}`;
}

function constructDateRangeCustom(params) {
    const { referenceMoment, fieldName, fieldType, granularity, setParam, plusParam } = params;
    if ("quarter" in setParam) {
        // Use dynamic fiscal quarters instead of hardcoded ones
        const fiscalQuarter = FISCAL_QUARTERS[setParam.quarter] || QUARTERS[setParam.quarter];
        setParam.month = fiscalQuarter.coveredMonths[0];
        delete setParam.quarter;
    }
    const date = referenceMoment.set(setParam).plus(plusParam || {});
    // compute domain
    const leftDate = date.startOf(granularity);
    const rightDate = date.endOf(granularity);
    let leftBound;
    let rightBound;
    if (fieldType === "date") {
        leftBound = serializeDate(leftDate);
        rightBound = serializeDate(rightDate);
    } else {
        leftBound = serializeDateTime(leftDate);
        rightBound = serializeDateTime(rightDate);
    }
    const domain = new Domain(["&", [fieldName, ">=", leftBound], [fieldName, "<=", rightBound]]);
    // compute description
    const descriptions = [date.toFormat("yyyy")];
    const method = localization.direction === "rtl" ? "push" : "unshift";
    if (granularity === "month") {
        descriptions[method](date.toFormat("MMMM"));
    } else if (granularity === "quarter") {
        // Use dynamic fiscal quarter logic
        let quarter;
        const currentMonth = date.c.month;
        
        // Find which fiscal quarter this month belongs to
        Object.keys(FISCAL_QUARTERS).forEach(q => {
            const fiscalQuarter = FISCAL_QUARTERS[q];
            if (fiscalQuarter.coveredMonths.includes(currentMonth)) {
                quarter = parseInt(q);
            }
        });
        
        if (!quarter) {
            quarter = date.quarter; // fallback to luxon's quarter
        }
        
        const fiscalQuarter = FISCAL_QUARTERS[quarter] || QUARTERS[quarter];
        descriptions[method](fiscalQuarter.description.toString());
    }
    const description = descriptions.join(" ");
    return { domain, description };
}

function getSelectedOptionsCustom(referenceMoment, searchItem, selectedOptionIds) {
    const selectedOptions = { year: [] };
    const periodOptions = getPeriodOptionsCustom(referenceMoment, searchItem.optionsParams);
    for (const optionId of selectedOptionIds) {
        const option = periodOptions.find((option) => option.id === optionId);
        const granularity = option.granularity;
        if (!selectedOptions[granularity]) {
            selectedOptions[granularity] = [];
        }
        if (option.domain) {
            selectedOptions[granularity].push(pick(option, "domain", "description"));
        } else {
            const setParam = getSetParam(option, referenceMoment);
            selectedOptions[granularity].push({ granularity, setParam });
        }
    }
    return selectedOptions;
}

// Utility function for pick (if not available)
function pick(obj, ...keys) {
    const result = {};
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}