import React, { useState, useEffect } from 'react';

interface MissionTimeProps {
  UTCTime?: string;
}

export const MissionTime: React.FC<MissionTimeProps> = ({ UTCTime }) => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, "0");
      const minutes = String(now.getUTCMinutes()).padStart(2, "0");
      const seconds = String(now.getUTCSeconds()).padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };
    
    updateTime(); // 초기 시간 설정
    const interval = setInterval(updateTime, 1000); // 1초마다 업데이트
    
    return () => clearInterval(interval);
  }, []);

  return <span>{`UTC ${UTCTime || currentTime}`}</span>;
};