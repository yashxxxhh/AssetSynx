import mongoose from 'mongoose';

const AssetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  type: String,
  amount: Number,
});

export default mongoose.model('Asset', AssetSchema);
