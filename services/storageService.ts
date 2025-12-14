import { Member, Transaction, ChatMessage, Grievance, Notice, BotMessage, Holiday } from '../types';
import CryptoJS from 'crypto-js';

// Security Configuration
const ENCRYPTION_KEY = 'MDU-EWA-SECURE-KEY-INTERNAL-V1'; // In a real app, this should be env var or key derived from user input
const USE_ENCRYPTION = true;

const STORAGE_KEY_MEMBERS = 'mdu_ewa_members';
const STORAGE_KEY_TRANSACTIONS = 'mdu_ewa_transactions';
const STORAGE_KEY_CHAT = 'mdu_ewa_chat';
const STORAGE_KEY_BOT_CHAT = 'mdu_ewa_bot_chat';
const STORAGE_KEY_GRIEVANCES = 'mdu_ewa_grievances';
const STORAGE_KEY_NOTICES = 'mdu_ewa_notices';
const STORAGE_KEY_MEETING = 'mdu_ewa_meeting_link';
const STORAGE_KEY_MANAGER = 'mdu_ewa_manager_creds';
const STORAGE_KEY_HOLIDAYS = 'mdu_ewa_holidays';

// --- ENCRYPTION HELPERS ---

const encryptData = (data: any): string => {
  if (!USE_ENCRYPTION) return JSON.stringify(data);
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error("Encryption failed", error);
    return JSON.stringify(data);
  }
};

const decryptData = <T>(ciphertext: string | null): T | null => {
  if (!ciphertext) return null;
  try {
    // Attempt to decrypt
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    
    // If decryption results in empty string, it might be plain text (migration)
    if (!decryptedStr) {
       // Try parsing original text as JSON (fallback for old plain text data)
       try {
         return JSON.parse(ciphertext);
       } catch {
         return null;
       }
    }
    return JSON.parse(decryptedStr);
  } catch (error) {
    // If decryption fails, try parsing as plain JSON (Backward compatibility)
    try {
      return JSON.parse(ciphertext);
    } catch {
      return null;
    }
  }
};

// --- DATA ACCESSORS ---

export const getMembers = (): Member[] => {
  const data = localStorage.getItem(STORAGE_KEY_MEMBERS);
  return decryptData<Member[]>(data) || [];
};

export const saveMembers = (members: Member[]) => {
  localStorage.setItem(STORAGE_KEY_MEMBERS, encryptData(members));
};

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
  return decryptData<Transaction[]>(data) || [];
};

export const saveTransactions = (transactions: Transaction[]) => {
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, encryptData(transactions));
};

export const getChatMessages = (): ChatMessage[] => {
  const data = localStorage.getItem(STORAGE_KEY_CHAT);
  return decryptData<ChatMessage[]>(data) || [];
};

export const saveChatMessages = (messages: ChatMessage[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_CHAT, encryptData(messages));
  } catch (e) {
    console.error("Storage full or error", e);
    alert("Storage full! Older messages might need to be cleared.");
  }
};

export const getBotMessages = (): BotMessage[] => {
  const data = localStorage.getItem(STORAGE_KEY_BOT_CHAT);
  return decryptData<BotMessage[]>(data) || [];
};

export const saveBotMessages = (messages: BotMessage[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_BOT_CHAT, encryptData(messages));
  } catch (e) {
    console.error("Storage full for bot chat", e);
  }
};

export const getGrievances = (): Grievance[] => {
  const data = localStorage.getItem(STORAGE_KEY_GRIEVANCES);
  return decryptData<Grievance[]>(data) || [];
};

export const saveGrievances = (grievances: Grievance[]) => {
  localStorage.setItem(STORAGE_KEY_GRIEVANCES, encryptData(grievances));
};

export const getNotices = (): Notice[] => {
  const data = localStorage.getItem(STORAGE_KEY_NOTICES);
  return decryptData<Notice[]>(data) || [];
};

export const saveNotices = (notices: Notice[]) => {
  localStorage.setItem(STORAGE_KEY_NOTICES, encryptData(notices));
};

export const getHolidays = (): Holiday[] => {
  const data = localStorage.getItem(STORAGE_KEY_HOLIDAYS);
  return decryptData<Holiday[]>(data) || [];
};

export const saveHolidays = (holidays: Holiday[]) => {
  localStorage.setItem(STORAGE_KEY_HOLIDAYS, encryptData(holidays));
};

export const getMeetingLink = (): string => {
  // Meeting link is simple string, but we can encrypt it too for consistency
  const data = localStorage.getItem(STORAGE_KEY_MEETING);
  // It might be stored as raw string previously
  if (data && !data.startsWith('{') && !data.startsWith('"') && !data.startsWith('U2F')) { 
      return data; 
  }
  return decryptData<string>(data) || '';
};

export const saveMeetingLink = (link: string) => {
  localStorage.setItem(STORAGE_KEY_MEETING, encryptData(link));
};

export interface ManagerCreds {
  password: string;
  mobile: string;
}

export const getManagerCreds = (): ManagerCreds => {
  const data = localStorage.getItem(STORAGE_KEY_MANAGER);
  if (data) {
    const creds = decryptData<ManagerCreds>(data);
    if (creds) return creds;
  }
  // Default Credentials
  return {
    password: 'Magic$Mountain', 
    mobile: '918144372669'
  };
};

export const saveManagerCreds = (creds: ManagerCreds) => {
  localStorage.setItem(STORAGE_KEY_MANAGER, encryptData(creds));
};