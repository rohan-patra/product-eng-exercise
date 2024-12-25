import { FeedbackDataTable } from "./components/FeedbackDataTable";
import { useFeedbackQuery } from "./hooks";

type Props = {
  filters?: Record<string, any>;
};

export function Feedback({ filters }: Props) {
  const dataReq = useFeedbackQuery({
    filters,
  });

  if (dataReq.isLoading) {
    return <div>Loading...</div>;
  }

  if (dataReq.isError) {
    return <div>Error loading feedback data</div>;
  }

  if (!dataReq.data) {
    return <div>No data available</div>;
  }

  return <FeedbackDataTable data={dataReq.data.data} />;
}
