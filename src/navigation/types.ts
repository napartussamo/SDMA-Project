export type RootStackParamList = {
  PreLoad: undefined;
  PhoneLogin: undefined;
  OTPVerify: undefined;
  PermSetUp: undefined;
  Home: undefined;
  Chat: {
    contactId: string;
    contactPhone: string;
  };
  RiskScore: {
    risk_score: number;
    message: string;
  };
  Profile: undefined;
  Blocked: undefined;
};
