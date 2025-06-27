import Asset from '../Asset.js';

export const getAssets = async (req, res) => {
  const userId = req.user.id;
  const assets = await Asset.find({ user: userId });
  res.json(assets);
};

export const addAsset = async (req, res) => {
  const userId = req.user.id;
  const { name, type, amount } = req.body;
  const asset = new Asset({ user: userId, name, type, amount });
  await asset.save();
  res.json(asset);
};
