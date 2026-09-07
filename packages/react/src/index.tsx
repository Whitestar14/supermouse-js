import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Supermouse,
  type SupermouseOptions,
  type SupermousePlugin,
  type SupermouseInstance
} from "@supermousejs/core";

export interface SupermouseContextValue {
  instance: SupermouseInstance | null;
  isEnabled: boolean;
}

const SupermouseContext = createContext<SupermouseContextValue>({
  instance: null,
  isEnabled: true
});

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
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const mouse = new Supermouse(options);
    plugins.forEach((p) => mouse.use(p));

    const origEnable = mouse.enable.bind(mouse);
    const origDisable = mouse.disable.bind(mouse);

    mouse.enable = () => {
      origEnable();
      setIsEnabled(true);
    };
    mouse.disable = () => {
      origDisable();
      setIsEnabled(false);
    };

    setInstance(mouse);
    setIsEnabled(mouse.isEnabled);

    return () => {
      mouse.destroy();
      setInstance(null);
      setIsEnabled(true);
    };
  }, []);

  return (
    <SupermouseContext.Provider value={{ instance, isEnabled }}>
      {children}
    </SupermouseContext.Provider>
  );
};

export const useSupermouse = (): SupermouseContextValue => {
  return useContext(SupermouseContext);
};
