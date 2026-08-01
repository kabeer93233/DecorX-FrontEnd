import custom_axios from '../axios/axios';

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatContext {
  page: string;
  productId?: number;
}

interface ChatResponse {
  reply: string;
  data?: {
    type: string;
    data: any;
  };
  sideEffects?: string[];
  error?: string;
}

interface UploadResponse {
  fileId: string;
  preview: {
    rows: number;
    columns: string[];
  };
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  context?: ChatContext,
): Promise<ChatResponse> {
  const res = await custom_axios.post('/chat/message', {
    message,
    history,
    context,
  }, { timeout: 60000 });
  return res.data;
}

export async function uploadChatFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await custom_axios.post('/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
