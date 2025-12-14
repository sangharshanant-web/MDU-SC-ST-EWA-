
export interface Member {
  id: string;
  name: string;
  designation: string;
  placeOfPosting: string;
  category: string; // e.g., SC, ST
  mobile: string;
  joinedDate: string;
  role?: 'MEMBER' | 'LIAISON'; // Added role for access control
}

export type TransactionType = 'SUBSCRIPTION' | 'EXPENSE' | 'DONATION';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  description: string;
  memberId?: string; // Optional, links to a member if it's a subscription
}

export interface ChatMessage {
  id: string;
  senderName: string;
  content: string; // Text content or Base64 data for media
  mediaType: 'TEXT' | 'AUDIO' | 'VIDEO';
  timestamp: string;
}

export interface BotMessage {
  id: string;
  sender: 'USER' | 'BOT';
  text: string;
  timestamp: string;
}

export interface Grievance {
  id: string;
  memberId: string;
  memberName: string; // Denormalized for display ease
  description: string;
  formation: string; // The section/department the problem pertains to
  addressedTo?: string; // The authority/person the problem is addressed to
  dateReported: string;
  status: 'PENDING' | 'RESOLVED';
  actionTaken?: string;
  dateResolved?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  isImportant: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'RESTRICTED' | 'CLOSED';
}

export interface AppState {
  members: Member[];
  transactions: Transaction[];
  chatMessages: ChatMessage[];
  grievances: Grievance[];
  notices: Notice[];
  meetingLink: string;
  botMessages: BotMessage[];
  holidays: Holiday[];
}

export enum Tab {
  DASHBOARD = 'Dashboard',
  MEMBERS = 'Members',
  FINANCES = 'Finances',
  COMMUNICATION = 'Chat',
  LIAISON = 'Liaison',
  NOTICES = 'Notices'
}