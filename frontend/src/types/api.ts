// API Types

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roles?: string[];
  gender?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  salutation?: string;
  gender?: string;
  clientType?: string;
  companyName?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  taxId?: string;
  taxNumber?: string;
  vatId?: string;
  commercialRegister?: string;
  phoneNumber?: string;
  fullLegalName?: string;
  dateOfBirth?: string;
  googleId?: string;
  datevId?: string;
  privacyConsent?: boolean;
  termsConsent?: boolean;
  recaptchaToken?: string;
}

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  taxId?: string;
  createdAt: string;
}

export interface Case {
  id: number;
  title: string;
  description: string;
  status: string;
  clientId: number;
  assignedToId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: number;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  clientId?: number;
  caseId?: number;
}

export interface Message {
  id: number;
  subject: string;
  content: string;
  senderId: number;
  recipientId: number;
  isRead: boolean;
  createdAt: string;
  caseId?: number;
}

export interface SendMessageData {
  recipientUserId: number;
  subject: string;
  content: string;
  caseId?: number;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isCompleted: boolean;
  clientId?: number;
}

export interface DATEVJob {
  id: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface UpdateUserRoleData {
  role: string;
}

export interface HeaderTextData {
  welcomeTitle: string;
  welcomeSubtitle: string;
}
