import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const LoadingContext = createContext({
  sceneReady: false,
  sceneProgress: 0,
  finishScene: () => {},
  updateSceneProgress: (_progress: number) => {},
});

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);
  const finishScene = useCallback(() => setSceneReady(true), []);
  const updateSceneProgress = useCallback((progress: number) => {
    setSceneProgress((previous) => Math.max(previous, progress));
  }, []);
  const value = useMemo(
    () => ({ sceneReady, sceneProgress, finishScene, updateSceneProgress }),
    [sceneReady, sceneProgress, finishScene, updateSceneProgress],
  );

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}

export const useSceneLoading = () => useContext(LoadingContext);
