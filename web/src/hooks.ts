import { useQuery } from "@tanstack/react-query";

type Feedback = {
  id: number;
  name: string;
  description: string;
  importance: "High" | "Medium" | "Low";
  type: "Sales" | "Customer" | "Research";
  customer: "Loom" | "Ramp" | "Brex" | "Vanta" | "Notion" | "Linear" | "OpenAI";
  date: string;
};

export type FeedbackData = Feedback[];

export type FeedbackGroup = {
  name: string;
  feedback: Feedback[];
};

type QueryParams = {
  filters?: Record<string, any>;
};

export function useFeedbackQuery({ filters }: QueryParams) {
  return useQuery<{ data: FeedbackData }>({
    queryFn: async () => {
      const res = await fetch("http://localhost:5001/query", {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filters }),
        method: "POST",
      });

      return res.json();
    },
    queryKey: ["query-data", filters],
  });
}

export function useGroupsQuery({ filters }: QueryParams) {
  return useQuery<{ data: FeedbackGroup[] }>({
    queryFn: async () => {
      const res = await fetch("http://localhost:5001/groups", {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filters }),
        method: "POST",
      });

      return res.json();
    },
    queryKey: ["groups-data", filters],
  });
}
