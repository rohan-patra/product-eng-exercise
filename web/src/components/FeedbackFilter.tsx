import { useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FeedbackData } from "../hooks";

type FilterType = {
  column: string;
  type: "select" | "date";
  values?: string[];
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
};

type FilterBarProps = {
  data?: FeedbackData;
  onFiltersChange: (filters: FilterType[]) => void;
};

type ColumnConfig = {
  name: string;
  key: string;
  type: "select" | "date";
  shortValues?: Record<string, string>;
  valueColors?: Record<string, string>;
};

const FILTERABLE_COLUMNS: readonly ColumnConfig[] = [
  {
    name: "Importance",
    key: "importance",
    type: "select",
    shortValues: { High: "High", Medium: "Med", Low: "Low" },
    valueColors: {
      High: "bg-red-500",
      Medium: "bg-yellow-500",
      Low: "bg-blue-500",
    },
  },
  { name: "Type", key: "type", type: "select" },
  { name: "Customer", key: "customer", type: "select" },
  { name: "Date", key: "date", type: "date" },
] as const;

const DEFAULT_VALUES: Record<string, string[]> = {
  importance: ["High", "Medium", "Low"],
  type: ["Sales", "Customer", "Research"],
  customer: ["Loom", "Ramp", "Brex", "Vanta", "Notion", "Linear", "OpenAI"],
};

function FilterValuePopover({
  column,
  values,
  availableValues,
  onChange,
  columnConfig,
}: {
  column: string;
  values: string[];
  availableValues: string[];
  onChange: (values: string[]) => void;
  columnConfig: ColumnConfig;
}) {
  return (
    <PopoverPanel className="absolute z-20 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 p-2">
      <div className="space-y-2">
        {availableValues.map((value) => (
          <label
            key={value}
            className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={values.includes(value)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...values, value]);
                } else {
                  onChange(values.filter((v) => v !== value));
                }
              }}
              className="rounded border-gray-300"
            />
            <span className="text-sm flex items-center gap-2">
              {columnConfig.valueColors?.[value] && (
                <span
                  className={`w-2 h-2 rounded-full ${columnConfig.valueColors[value]}`}
                />
              )}
              {value}
            </span>
          </label>
        ))}
      </div>
    </PopoverPanel>
  );
}

function formatFilterValues(
  filter: FilterType,
  columnConfig: (typeof FILTERABLE_COLUMNS)[number]
): string {
  if (filter.type === "select" && filter.values?.length) {
    const shortValues = columnConfig.shortValues || {};
    const displayValues = filter.values.map(
      (v) => shortValues[v as keyof typeof shortValues] || v
    );
    if (displayValues.length === 1) {
      return displayValues[0];
    }
    return `${displayValues[0]}, ${displayValues[1]}${
      displayValues.length > 2 ? "..." : ""
    }`;
  }
  if (filter.type === "date" && filter.dateRange) {
    const { start, end } = filter.dateRange;
    if (start && end) {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    if (start) {
      return `After ${start.toLocaleDateString()}`;
    }
    if (end) {
      return `Before ${end.toLocaleDateString()}`;
    }
  }
  return "Any";
}

function FilterButton({
  filter,
  columnConfig,
}: {
  filter: FilterType;
  columnConfig: ColumnConfig;
}) {
  const displayText = formatFilterValues(filter, columnConfig);
  const values = filter.values || [];

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{columnConfig.name}</span>
      <span className="text-gray-600">-</span>
      <span className="flex items-center gap-1">
        {columnConfig.valueColors && values.length > 0 ? (
          <>
            {values.slice(0, 2).map((value, i) => (
              <span
                key={value}
                className={`w-2 h-2 rounded-full ${columnConfig.valueColors?.[value]}`}
              />
            ))}
            {values.length > 2 && <span className="text-gray-400">...</span>}
          </>
        ) : null}
        {displayText}
      </span>
    </div>
  );
}

export function FilterBar({ data, onFiltersChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterType[]>([]);

  const getUniqueValues = (column: string) => {
    if (!data) {
      return DEFAULT_VALUES[column] || [];
    }
    return [...new Set(data?.map((item) => (item as any)[column]))];
  };

  const handleAddFilter = (
    column: string,
    type: "select" | "date",
    close: () => void
  ) => {
    const newFilter: FilterType = {
      column,
      type,
      values: type === "select" ? [] : undefined,
      dateRange: type === "date" ? { start: null, end: null } : undefined,
    };
    setFilters([...filters, newFilter]);
    onFiltersChange([...filters, newFilter]);
    close();
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleFilterChange = (
    index: number,
    values?: string[],
    dateRange?: { start: Date | null; end: Date | null }
  ) => {
    const newFilters = [...filters];
    if (values) {
      newFilters[index].values = values;
    }
    if (dateRange) {
      newFilters[index].dateRange = dateRange;
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="mb-4 flex flex-wrap gap-2 items-center">
      {filters.map((filter, index) => {
        const columnConfig = FILTERABLE_COLUMNS.find(
          (col) => col.key === filter.column
        )!;
        return (
          <Popover key={index} className="relative">
            <PopoverButton className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 text-sm">
              <FilterButton filter={filter} columnConfig={columnConfig} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFilter(index);
                }}
                className="ml-2 text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </PopoverButton>

            {filter.type === "select" && (
              <FilterValuePopover
                column={filter.column}
                values={filter.values || []}
                availableValues={getUniqueValues(filter.column)}
                onChange={(values) => handleFilterChange(index, values)}
                columnConfig={columnConfig}
              />
            )}
            {filter.type === "date" && (
              <PopoverPanel className="absolute z-20 mt-2 p-3 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <DatePicker
                      selected={filter.dateRange?.start}
                      onChange={(date: Date | null) =>
                        handleFilterChange(index, undefined, {
                          start: date,
                          end: filter.dateRange?.end || null,
                        })
                      }
                      placeholderText="From"
                      className="rounded border p-1 text-sm w-32"
                    />
                    <span>to</span>
                    <DatePicker
                      selected={filter.dateRange?.end}
                      onChange={(date: Date | null) =>
                        handleFilterChange(index, undefined, {
                          start: filter.dateRange?.start || null,
                          end: date,
                        })
                      }
                      placeholderText="To"
                      className="rounded border p-1 text-sm w-32"
                    />
                  </div>
                </div>
              </PopoverPanel>
            )}
          </Popover>
        );
      })}

      <Popover>
        {({ close }) => (
          <>
            <PopoverButton className="bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 text-sm flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Filter
            </PopoverButton>
            <PopoverPanel className="absolute z-10 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                {FILTERABLE_COLUMNS.filter(
                  (column) => !filters.some((f) => f.column === column.key)
                ).map((column) => (
                  <button
                    key={column.key}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    onClick={() =>
                      handleAddFilter(column.key, column.type, close)
                    }
                  >
                    {column.name}
                  </button>
                ))}
              </div>
            </PopoverPanel>
          </>
        )}
      </Popover>
    </div>
  );
}
