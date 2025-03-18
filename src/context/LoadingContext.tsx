import React, { createContext, useState, useContext, ReactNode, useRef, useEffect } from 'react';
import { LoadingSpinner } from 'component/LoadingSpinner'; 

type LoadingContextType = {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
  delay?: number; // 로딩 표시 지연 시간 (밀리초)
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ 
  children, 
  delay = 500  // 기본값 500ms
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('데이터를 불러오는 중입니다...');
  const [visibleLoading, setVisibleLoading] = useState(false);
  
  // 타이머 참조를 저장하기 위한 ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // 현재 로딩 상태 추적을 위한 ref
  const isLoadingRef = useRef(false);

  // 로딩 상태가 변경될 때마다 지연 타이머 관리
  useEffect(() => {
    if (loading) {
      isLoadingRef.current = true;
      
      // 이미 실행 중인 타이머가 있다면 취소
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // 지정된 지연 시간 후에 로딩 스피너 표시
      timerRef.current = setTimeout(() => {
        if (isLoadingRef.current) { // 여전히 로딩 중인지 확인
          setVisibleLoading(true);
        }
      }, delay);
    } else {
      isLoadingRef.current = false;
      setVisibleLoading(false);
      
      // 타이머가 있다면 취소
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [loading, delay]);

  const showLoading = (customMessage?: string) => {
    if (customMessage) {
      setMessage(customMessage);
    }
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading: loading }}>
      {children}
      {visibleLoading && <LoadingSpinner message={message} fullScreen={true} />}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};