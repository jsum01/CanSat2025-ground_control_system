import { useRef, useState } from "react";

export const useSimulation = () => {
    const [simStatus, setSimStatus] = useState<"DISABLED" | "ENABLED" | "ACTIVE">("DISABLED");
    const [simFile, setSimFile] = useState<string[]>([]);
    const [hasValidSimFile, setHasValidSimFile] = useState(false);
    const [canReceiveSimData, setCanReceiveSimData] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
    return {
      simStatus, setSimStatus,
      simFile, setSimFile,
      hasValidSimFile, setHasValidSimFile,
      canReceiveSimData, setCanReceiveSimData,
      fileInputRef, intervalRef
    };
  };