import { useState } from "react";

export const useTime = () => {
    const [isToggleTime, setIsToggleTime] = useState(false);
    const [UTCTime, setUTCTime] = useState("");
  
    return { isToggleTime, setIsToggleTime, UTCTime, setUTCTime };
  };