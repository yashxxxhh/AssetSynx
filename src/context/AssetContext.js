import { createContext, useState } from 'react';

export const AssetContext = createContext();

export const AssetProvider = ({ children }) => {
  const [assets, setAssets] = useState([]);

  const addAsset = (asset) => {
    setAssets((prev) => [...prev, asset]);
  };

  return (
    <AssetContext.Provider value={{ assets, addAsset }}>
      {children}
    </AssetContext.Provider>
  );
};
