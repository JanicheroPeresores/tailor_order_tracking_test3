// Placeholder for peresores types
export type PeresoresType = {
  id: number;
  description: string;
};

export type ExchangeTokenRequest = {
  token: string;
  clientId: string;
  grantType?: string;
  code?: string;
  redirectUri?: string;
};

export type ExchangeTokenResponse = {
  success: boolean;
  data: string;
  accessToken: string;
};

export type GetUserInfoResponse = {
  id: number;
  name: string;
  platform?: string;
};

export type GetUserInfoWithJwtRequest = {
  jwt: string;
  jwtToken?: string;
  projectId?: string;
};

export type GetUserInfoWithJwtResponse = {
  id: number;
  name: string;
  email: string;
  platform?: string;
  openId?: string;
  loginMethod?: string;
  lastSignedIn?: string;
};

export type User = {
  id: number;
  name: string;
  openId: string;
  email?: string;
  lastSignedIn?: string;
};