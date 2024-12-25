export function filterData<T extends Record<string, any>>(
  data: T[],
  filters: Record<string, any>
): T[] {
  return data.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length === 0 || value.includes(item[key]);
      }
      if (typeof value === "object" && value !== null) {
        const itemDate = new Date(item[key]);
        const { start, end } = value;

        if (start && end) {
          const startDate = new Date(start);
          const endDate = new Date(end);
          return itemDate >= startDate && itemDate <= endDate;
        }
        if (start) {
          const startDate = new Date(start);
          return itemDate >= startDate;
        }
        if (end) {
          const endDate = new Date(end);
          return itemDate <= endDate;
        }
      }
      return true;
    });
  });
}
