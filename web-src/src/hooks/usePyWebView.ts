import { useCallback, useEffect, useState } from 'react';
import type { PyWebViewApi, ProgressEvent } from '../types';

export function usePyWebView() {
  const [api, setApi] = useState<PyWebViewApi | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkApi = () => {
      if (window.pywebview?.api) {
        setApi(window.pywebview.api);
        setIsReady(true);
        return true;
      }
      return false;
    };

    if (checkApi()) return;

    const interval = setInterval(() => {
      if (checkApi()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return { api, isReady };
}

export function useBackendEvents(onEvent: (event: string, data: ProgressEvent) => void) {
  useEffect(() => {
    window.onBackendEvent = onEvent;
    return () => {
      window.onBackendEvent = undefined;
    };
  }, [onEvent]);
}

export function useAnalysis() {
  const { api, isReady } = usePyWebView();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentFile, setCurrentFile] = useState('');

  const handleEvent = useCallback((event: string, data: ProgressEvent) => {
    if (event === 'progress') {
      switch (data.type) {
        case 'start':
          setIsAnalyzing(true);
          setProgress({ current: 0, total: data.total || 0 });
          break;
        case 'processing':
          setCurrentFile(data.file || '');
          setProgress({ current: data.current || 0, total: data.total || 0 });
          break;
        case 'completed':
          setProgress({ current: data.current || 0, total: data.total || 0 });
          break;
        case 'error':
          setProgress({ current: data.current || 0, total: data.total || 0 });
          break;
        case 'finish':
          setIsAnalyzing(false);
          setCurrentFile('');
          break;
      }
    }
  }, []);

  useBackendEvents(handleEvent);

  return {
    api,
    isReady,
    isAnalyzing,
    progress,
    currentFile,
    setIsAnalyzing,
  };
}
