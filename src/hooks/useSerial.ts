import { useSerialContext } from "context/SerialContext";
import { TelemetryData } from "types/mission";

export const useSerial = () => {
  const {
    isConnected,
    setIsConnected,
    serialPorts,
    setSerialPorts,
    setSelectedPort,
    selectedPort,
  } = useSerialContext();

  const handleSerialError = (_event: any, error: string) => {
    if (isConnected) {
      alert("Serial port already connected");
      return;
    }
    console.error("Serial error:", error);
    alert(`Serial Error: ${error}`);
    setIsConnected(false);
    setSelectedPort("");
  };

  // telemetryData는 파라미터로 받아서 처리
  const handleSerialData =
    (telemetryData: TelemetryData[], setTelemetryData: Function) =>
    (_event: any, data: string) => {
      try {
        // 캐리지 리턴 제거 및 데이터 분리
        const values = data
          .trim()
          .split(",")
          .map((value) => value.trim());

        // 데이터 검증을 위한 기본 체크 - 25개 필드로 수정
        if (values.length < 25) {
          console.warn("Insufficient number of fields in telemetry data");
          console.log(`Expected 25 fields, but got ${values.length}`);
          console.log("Raw data:", data);
          return;
        }

        if (values[3] !== "F" && values[3] !== "S") {
          console.warn(`Invalid MODE value: ${values[3]}`);
          return;
        }

        const validStates = [
          "LAUNCH_WAIT",
          "LAUNCH_PAD",
          "ASCENT",
          "APOGEE",
          "DESCENT",
          "PROBE_RELEASE",
          "LANDED",
        ];
        if (!validStates.includes(values[4])) {
          console.warn(`Invalid STATE value: ${values[4]}`);
          return;
        }

        const parsedData: TelemetryData = {
          TEAM_ID: values[0],
          MISSION_TIME: values[1],
          PACKET_COUNT: values[2],
          MODE: values[3] as "F" | "S",
          STATE: values[4] as TelemetryData["STATE"],
          ALTITUDE: values[5],
          TEMPERATURE: values[6],
          PRESSURE: values[7],
          VOLTAGE: values[8],
          GYRO_R: values[9],
          GYRO_P: values[10],
          GYRO_Y: values[11],
          ACCEL_R: values[12],
          ACCEL_P: values[13],
          ACCEL_Y: values[14],
          MAG_R: values[15],
          MAG_P: values[16],
          MAG_Y: values[17],
          AUTO_GYRO_ROTATION_RATE: values[18], // 수정: 실제 데이터에서 가져오기
          GPS_TIME: values[19], // 수정: 19번 인덱스로 변경
          GPS_ALTITUDE: values[20], // 수정: 20번 인덱스로 변경
          GPS_LATITUDE: values[21], // 수정: 21번 인덱스로 변경
          GPS_LONGITUDE: values[22], // 수정: 22번 인덱스로 변경
          GPS_SATS: values[23], // 수정: 23번 인덱스로 변경
          CMD_ECHO: values[24], // 수정: 24번 인덱스로 변경
        };

        if (!parsedData.TEAM_ID || !parsedData.MISSION_TIME) {
          console.warn("Missing required fields (TEAM_ID or MISSION_TIME)");
          return;
        }

        const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
        if (!timeRegex.test(parsedData.MISSION_TIME)) {
          console.warn(
            `Invalid MISSION_TIME format: ${parsedData.MISSION_TIME}`
          );
          return;
        }

        setTelemetryData((prev) => [...prev, parsedData]);
      } catch (error) {
        console.error("Failed to parse telemetry data:", error);
        console.log("Raw data:", data);
      }
    };

  return {
    serialPorts,
    setSerialPorts,
    selectedPort,
    setSelectedPort,
    isConnected,
    setIsConnected,
    handleSerialData,
    handleSerialError,
  };
};