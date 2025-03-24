import React, { useState, useEffect, useRef } from "react";

interface MissionTimeProps {
  setTime?: string; // 선택적 prop
}

export const MissionTime: React.FC<MissionTimeProps> = ({ setTime }) => {
  const [currentTime, setCurrentTime] = useState("");
  const [baseTime, setBaseTime] = useState<Date | null>(null);
  const initialFetchDoneRef = useRef(false);
  
  // 컴포넌트가 처음 마운트될 때 1회성으로 UTC 시간 가져오기
  useEffect(() => {
    // 이미 초기화되었거나 외부에서 전달받은 시간이 있으면 실행하지 않음
    if (initialFetchDoneRef.current || setTime) {
      return;
    }
    
    const now = new Date();
    const initialTime = new Date(now.getTime());
    setBaseTime(initialTime);
    formatAndSetTime(initialTime);
    
    // 초기화 완료 표시
    initialFetchDoneRef.current = true;
  }, []);
  
  // setTime prop이 변경될 때 기준 시간 재설정
  useEffect(() => {
    if (setTime && setTime.trim()) {
      try {
        // 전달받은 시간 문자열(HH:MM:SS)을 파싱
        const [hours, minutes, seconds] = setTime.split(':').map(Number);
        
        // 현재 날짜 기준의 Date 객체 생성
        const now = new Date();
        const newBaseTime = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            hours,
            minutes,
            seconds
          )
        );
        
        setBaseTime(newBaseTime);
        formatAndSetTime(newBaseTime);
        
        // 외부에서 시간을 설정했으므로 초기화 완료 표시
        initialFetchDoneRef.current = true;
      } catch (error) {
        console.error("Invalid time format:", error);
      }
    }
  }, [setTime]);

  // 시간을 포맷팅하고 상태 업데이트하는 함수
  const formatAndSetTime = (date: Date) => {
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    
    setCurrentTime(`${hours}:${minutes}:${seconds}`);
  };

  // 1초마다 시간 업데이트
  useEffect(() => {
    if (!baseTime) return;
    
    let interval: NodeJS.Timeout | null = null;
    let secondsCounter = 0;
    
    const updateTime = () => {
      secondsCounter++;
      const updatedTime = new Date(baseTime.getTime() + secondsCounter * 1000);
      formatAndSetTime(updatedTime);
    };

    interval = setInterval(updateTime, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [baseTime]);

  return <span>{`UTC ${currentTime}`}</span>;
};