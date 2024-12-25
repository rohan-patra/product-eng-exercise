import { GroupsDataTable } from "./components/GroupsDataTable";
import { useGroupsQuery } from "./hooks";

type Props = {
  filters?: Record<string, any>;
};

export function Groups({ filters }: Props) {
  const dataReq = useGroupsQuery({
    filters,
  });

  if (dataReq.isLoading || !dataReq.data) {
    return <div>Loading...</div>;
  }

  if (dataReq.isError) {
    return <div>Error loading groups data</div>;
  }

  return <GroupsDataTable data={dataReq.data.data} />;
}
