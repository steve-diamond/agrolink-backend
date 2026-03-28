// Add this type for withdrawal requests
export type Withdrawal = {
  _id: string;
  user: { name: string; email: string } | string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'refunded';
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  adminNote?: string;
  createdAt?: string;
};
