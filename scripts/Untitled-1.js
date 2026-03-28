const commission = totalAmount * 0.1;
const farmerAmount = totalAmount - commission;

wallet.balance += farmerAmount;
await wallet.save();