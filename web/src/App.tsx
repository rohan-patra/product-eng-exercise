import { useState } from "react";
import { NavTabs, TabConfig } from "./components/NavTabs";
import { Feedback } from "./Feedback";
import { Groups } from "./Groups";
import { FilterBar } from "./components/FeedbackFilter";

export type FilterType = {
  column: string;
  type: "select" | "date";
  values?: string[];
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
};

export const TabsConfig: TabConfig = {
  feedback: {
    id: "feedback",
    name: "Feedback",
  },
  groups: {
    id: "groups",
    name: "Groups",
  },
};

function App() {
  const [selectedTab, setSelectedTab] = useState("feedback");
  const [filters, setFilters] = useState<FilterType[]>([]);

  const getQueryFilters = () => {
    return filters.reduce((acc, filter) => {
      if (filter.type === "select" && filter.values?.length) {
        acc[filter.column] = filter.values;
      }
      if (filter.type === "date" && filter.dateRange) {
        const { start, end } = filter.dateRange;
        if (start || end) {
          acc[filter.column] = {
            start: start?.toISOString(),
            end: end
              ? new Date(end.setHours(23, 59, 59, 999)).toISOString()
              : undefined,
          };
        }
      }
      return acc;
    }, {} as Record<string, any>);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="w-5/6 h-4/5 flex flex-col gap-y-4">
        <NavTabs
          config={TabsConfig}
          tabOrder={["feedback", "groups"]}
          onTabClicked={(tabId) => {
            setSelectedTab(tabId);
          }}
          selectedTab={selectedTab}
        />
        {/** - done
         * TODO(part-1): Add filter options
         */}
        <FilterBar onFiltersChange={setFilters} />
        {selectedTab === "feedback" ? (
          <Feedback filters={getQueryFilters()} />
        ) : (
          <Groups filters={getQueryFilters()} />
        )}
      </div>
    </div>
  );
}

export default App;
