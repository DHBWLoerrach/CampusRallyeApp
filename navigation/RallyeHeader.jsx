import { View, Text } from "react-native";
import * as Progress from "react-native-progress";
import { observer } from "@legendapp/state/react";
import { currentTime } from "@legendapp/state/helpers/time";
import TimeHeader from "./TimeHeader";
import { store$ } from "../services/storage/Store";

const RallyeHeader = observer(function RallyeHeader({ rallye, percentage }) {
  const currentTime$ = currentTime.get();

  const ProgressBar = () => (
    <Progress.Bar
      style={{ marginTop: 10 }}
      progress={percentage}
      color="white"
    />
  );

  return (
    <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
      {rallye ? (
        rallye.status === "running" && !rallye.tour_mode &&
        new Date(currentTime$).getTime() <
          new Date(rallye.end_time).getTime() ? (
          <View style={{ alignItems: "center" }}>
            <TimeHeader endTime={rallye.end_time} />
            <ProgressBar />
          </View>
        ) : (
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "500",
            }}
          >
            {rallye.tour_mode && "Gelände erkunden"}
            {rallye.status === "preparing" && "Vorbereitungen"}
            {rallye.status === "post_processing" && "Abstimmung"}
            {rallye.status === "running" &&
              !rallye.tour_mode &&
              "Zeit abgelaufen"}
            {rallye.status === "ended" && "Rallye beendet"}
          </Text>
        )
      ) : (
        <ProgressBar />
      )}
    </View>
  );
});

export default RallyeHeader;
