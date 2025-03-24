import { useState } from "react";
import { CMD } from "constants/commands";
import { useSerialContext } from "context/SerialContext";
import { electronService } from "services/electronService";
import { useLoading } from "./useLoading";

export const useTimeControl = () => {
  const [isToggleTime, setIsToggleTime] = useState(false); // 시간 설정 모드 활성화 상태
  const [inputedTime, setInputedTime] = useState(""); // 사용자가 입력 중인 시간 문자열
  const [setTime, setSetTime] = useState(""); // 실제로 설정된/적용된 시간 (MissionTime에 표시)
  const { isConnected } = useSerialContext(); // 시리얼 연결 상태
  const ipcRenderer = electronService.ipcRenderer; // 전자 통신용 인터페이스
  const cmd = CMD; // 명령어 상수
  const { showLoading, hideLoading } = useLoading(); // 로딩 상태 관리

  /**
   * 현재 UTC 시간을 받아와서 전송
   */
  const handleSetUTCTime = async () => {
    if (isConnected) {
      try {
        const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
        const date = new Date();
        const utcTime = `${String(date.getUTCHours()).padStart(
          2,
          "0"
        )}:${String(date.getUTCMinutes()).padStart(2, "0")}:${String(
          date.getUTCSeconds()
        ).padStart(2, "0")}`;
        console.log(`가져온 UTC TIME: ${utcTime}`); // DEBUG

        if (utcTime.trim() && timeRegex.test(utcTime)) {
          // REGEX TEST
          console.log(`UTC 형식 테스트 성공`); // DEBUG
          // 로딩 표시 시작
          showLoading("UTC 시간을 설정 중입니다...");

          // 1. 시리얼 통신: UTC 명령 send
          await ipcRenderer.invoke("send-data", cmd.TIME.UTC + utcTime);
          console.log("전송 완료"); // DEBUG

          // 2. 입력한 시간으로 프로그램 시간 동기화
          setSetTime(utcTime);
          setIsToggleTime(false);

          // 로딩 표시 종료
          hideLoading();
        } else {
          alert(
            "올바른 시간 형식을 입력하세요 (hh:mm:ss)\nPlease enter a valid time format (hh:mm:ss)"
          );
        }
      } catch (error) {
        console.error("Failed to set UTC time:", error);
        hideLoading(); // 오류 발생 시에도 로딩 표시 종료
        alert("UTC 시간 설정 실패\nFailed to set UTC time");
      }
    }
  };

  // const handleSetGPSTime = async () => {
  //   if (isConnected) {
  //     try {
  //       // 로딩 표시 시작
  //       showLoading("GPS 시간을 가져오는 중입니다...");

  //       // 1. GPS 시간 명령 전송 (장치에 GPS 시간을 요청)
  //       const gpsTimeResponse = await ipcRenderer.invoke(
  //         "send-data",
  //         cmd.TIME.GPS
  //       ); // 응답형식: string(hh:mm:ss)

  //       // DEBUG
  //       console.log("GPS 시간 응답:", gpsTimeResponse);

  //       // GPS 응답: hh:mm:ss
  //       if (gpsTimeResponse && typeof gpsTimeResponse === "string") {
  //         // GPS 응답에서 시간 형식 추출 (실제 응답 형식에 맞게 수정 필요)
  //         const timeMatch = gpsTimeResponse.match(/(\d{2}:\d{2}:\d{2})/);
  //         // DEBUG
  //         console.log("추출된 시간:", timeMatch);

  //         if (timeMatch && timeMatch[1]) {
  //           // 추출된 GPS 시간으로 프로그램 시간 설정
  //           setSetTime(timeMatch[1]);
  //           setIsToggleTime(false);
  //           hideLoading(); // 로딩 표시 종료
  //         } else {
  //           hideLoading(); // 로딩 표시 종료
  //           alert(
  //             "GPS 시간 형식을 인식할 수 없습니다\nCannot recognize GPS time format"
  //           );
  //         }
  //       } else { // GPS 응답이 없는 경우, 간단하게 모드만 닫습니다
  //         setIsToggleTime(false);
  //         hideLoading(); // 로딩 표시 종료
  //         alert("GPS 시간을 받아오지 못했습니다\nFailed to get GPS time");
  //       }
  //     } catch (error) {
  //       console.error("Failed to set GPS time:", error);
  //       hideLoading(); // 오류 발생 시에도 로딩 표시 종료
  //       alert(`GPS 시간 설정 실패\n\nFailed to set GPS time`);
  //     }
  //   }
  // };

  const handleSetGPSTime = async () => {
    if (isConnected) {
      try {
        // 로딩 표시 시작
        showLoading("GPS 시간을 가져오는 중입니다...");

        // 1. GPS 시간 명령 전송 (장치에 GPS 시간을 요청)
        const response = await ipcRenderer.invoke("send-data", cmd.TIME.GPS);

        // DEBUG
        console.log("GPS 시간 요청 응답:", response);
        // 응답 구조 확인
        if (response && response.success && response.gpsTime) {
          // GPS 시간 형식 확인
          const timeRegex = /^(\d{2}:\d{2}:\d{2})$/;
          const isValidTimeFormat = timeRegex.test(response.gpsTime);

          console.log( // DEBUG
            "GPS 시간:",
            response.gpsTime,
            "유효한 형식인가?:",
            isValidTimeFormat
          );

          if (isValidTimeFormat) { // 형식에 맞을 때, 시간 업데이트
            setSetTime(response.gpsTime);
            setIsToggleTime(false);
            hideLoading();
          } else {
            hideLoading();
            alert(
              "GPS 시간 형식이 올바르지 않습니다 (hh:mm:ss)\nInvalid GPS time format"
            );
          }
        } else if (response && !response.success && response.error) {
          // 명시적 오류가 있는 경우
          hideLoading();
          console.error("GPS 시간 설정 오류:", response.error);
          alert(
            `GPS 시간 설정 실패: ${response.error}\nFailed to set GPS time`
          );
        } else {
          // 알 수 없는 응답
          hideLoading();
          alert("GPS 시간을 받아오지 못했습니다\nFailed to get GPS time");
        }
      } catch (error: any) {
        console.error("Failed to set GPS time:", error);
        hideLoading();
        let errorMessage = "GPS 시간 설정 실패";

        // 타임아웃 오류 감지
        if (error.message && error.message.includes("timeout")) {
          errorMessage +=
            "\n\nGPS 장치 응답 시간 초과. 다음을 확인해 주세요:\n" +
            "- GPS 모듈이 올바르게 연결되어 있는지\n" +
            "- GPS 신호 수신이 가능한 위치인지\n" +
            "- 장치 전원이 켜져 있는지";
        }

        alert(`${errorMessage}\n\nFailed to set GPS time`);
      }
    } else {
      alert("장치가 연결되어 있지 않습니다.\nDevice is not connected.");
    }
  };

  const handleToggleTime = () => {
    if (isConnected) {
      setIsToggleTime(true);
      setInputedTime(""); // 입력 필드 초기화
    }
  };

  return {
    isToggleTime,
    setIsToggleTime,
    inputedTime,
    setInputedTime,
    setTime,
    handleSetGPSTime,
    handleSetUTCTime,
    handleToggleTime,
  };
};
