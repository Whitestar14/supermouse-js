import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Supermouse,
  type SupermouseOptions,
  type SupermousePlugin,
  type SupermouseInstance
} from "@supermousejs/core";

const SupermouseContext = createContext<SupermouseInstance | null>(null);

export interface SupermouseProviderProps {
  options?: SupermouseOptions;
  plugins?: SupermousePlugin[];
  children: React.ReactNode;
}

export const SupermouseProvider: React.FC<SupermouseProviderProps> = ({
  children,
  options = {},
  plugins = []
}) => {
  const [instance, setInstance] = useState<SupermouseInstance | null>(null);

  useEffect(() => {
    // 1. Initialize
    const mouse = new Supermouse(options);

    // 2. Register Plugins
    plugins.forEach((p) => mouse.use(p));

    setInstance(mouse);

    // 3. Cleanup
    return () => {
      mouse.destroy();
      setInstance(null);
    };
  }, []); // Run once on mount

  return <SupermouseContext.Provider value={instance}>{children}</SupermouseContext.Provider>;
};

export const useSupermouse = (): SupermouseInstance | null => {
  return useContext(SupermouseContext);
};
