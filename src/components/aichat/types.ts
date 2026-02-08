export interface ChatImage {
  type: string;
  image_url: { url: string };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: ChatImage[];
}

export interface UploadedDoc {
  filename: string;
  text: string;
  pageCount: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  uploadedDoc: UploadedDoc | null;
  createdAt: number;
  updatedAt: number;
}
