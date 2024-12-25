import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import json from "./data.json";

type Feedback = {
  id: number;
  name: string;
  description: string;
  importance: "High" | "Medium" | "Low";
  type: "Sales" | "Customer" | "Research";
  customer: "Loom" | "Ramp" | "Brex" | "Vanta" | "Notion" | "Linear" | "OpenAI";
  date: string;
};

type FeedbackData = Feedback[];

export const router = express.Router();
router.use(bodyParser.json());

router.post("/query", queryHandler);
router.post("/groups", groupHandler);

const feedback: FeedbackData = json as any;

function filterFeedback(
  data: FeedbackData,
  filters: Record<string, any>
): FeedbackData {
  return data.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (Array.isArray(value)) {
        return (
          value.length === 0 || value.includes(item[key as keyof Feedback])
        );
      }
      if (typeof value === "object" && value !== null) {
        const itemDate = new Date(item.date);
        const { start, end } = value;

        /** - done
         * TODO(part-1): Implement query handling
         */
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

function queryHandler(req: Request, res: Response<{ data: FeedbackData }>) {
  const { filters } = req.body;
  const filteredData = filterFeedback(feedback, filters || {});
  res.status(200).json({ data: filteredData });
}

type FeedbackGroup = {
  name: string;
  feedback: Feedback[];
};

async function groupHandler(
  req: Request,
  res: Response<{ data: FeedbackGroup[] }>
) {
  /**
   * TODO(part-2): Implement filtering + grouping
   */
  const { filters } = req.body;
  const filteredFeedback = filterFeedback(feedback, filters || {});

  const pythonRes = await fetch("http://127.0.0.1:8000/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ feedback: filteredFeedback }),
  });

  const pythonData = (await pythonRes.json()) as { feedback: Feedback[] };

  res.status(200).json({
    data: [
      {
        name: "All feedback",
        feedback: pythonData.feedback,
      },
    ],
  });
}
