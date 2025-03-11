import { useState } from "react";
import { CMD } from "constants/commands";
import { useSerialContext } from "context/SerialContext";

export const useTimeControl = () => {
 const [isToggleTime, setIsToggleTime] = useState(false);
 const [UTCTime, setUTCTime] = useState("");
 const { isConnected, ipcRenderer } = useSerialContext();
 const cmd = CMD;

 // 입력 값 형식화 처리(허용 범위를 초과하면 최대값으로 자동 맞춤)
 const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const value = e.target.value;
   
   // 숫자와 콜론만 허용
   const cleaned = value.replace(/[^\d:]/g, '');
   
   // 형식화 로직 (hh:mm:ss)
   let formatted = '';
   const digits = cleaned.replace(/:/g, '');
   
   if (digits.length > 0) {
     // 시간 (00-23)
     const hours = digits.substring(0, Math.min(2, digits.length));
     if (hours.length === 2 && parseInt(hours) > 23) {
       formatted += '23';
     } else {
       formatted += hours;
     }
     
     if (digits.length > 2) {
       // 분 (00-59)
       const minutes = digits.substring(2, Math.min(4, digits.length));
       if (minutes.length === 2 && parseInt(minutes) > 59) {
         formatted += ':59';
       } else {
         formatted += ':' + minutes;
       }
       
       if (digits.length > 4) {
         // 초 (00-59)
         const seconds = digits.substring(4, Math.min(6, digits.length));
         if (seconds.length === 2 && parseInt(seconds) > 59) {
           formatted += ':59';
         } else {
           formatted += ':' + seconds;
         }
       }
     }
   }
   
   setUTCTime(formatted);
 };

 const handleSetGPSTime = async () => {
   if (isConnected) {
     try {
       await ipcRenderer.invoke("send-data", cmd.TIME.GPS);
       setIsToggleTime(false);
     } catch (error) {
       console.error("Failed to set GPS time:", error);
       alert(
         `GPS 시간 설정 실패

Failed to set GPS time`
       );
     }
   }
 };

 const handleSetUTCTime = async (e: React.FormEvent) => {
   if (isConnected) {
     try {
       e.preventDefault();
       
       // 입력값이 올바른 형식인지 확인
       const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
       if (UTCTime.trim() && timeRegex.test(UTCTime)) {
         await ipcRenderer.invoke("send-data", cmd.TIME.UTC + UTCTime);
         setIsToggleTime(false);
       } else {
         alert("올바른 시간 형식을 입력하세요 (hh:mm:ss)\nPlease enter a valid time format (hh:mm:ss)");
       }
     } catch (error) {
       console.error("Failed to set UTC time:", error);
       alert("UTC 시간 설정 실패\nFailed to set UTC time");
     }
   }
 };

 const handleToggleTime = () => {
   if (isConnected) {
     setIsToggleTime(true);
     setUTCTime(""); // 입력 필드 초기화
   }
 };

 return {
   isToggleTime,
   setIsToggleTime,
   UTCTime,
   setUTCTime,
   handleTimeInputChange, // 새로운 입력 핸들러
   handleSetGPSTime,
   handleSetUTCTime,
   handleToggleTime,
 };
};