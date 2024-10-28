export interface TranscriptionResult {
  transcript: string;
  fileName: string;
  outputPath: string;
}

export interface TransformerRequest {
  transcript: string; //der transcripierte Text
  template: string; //das Template als Text
  provider: string; //OpenAI oder Anthropic
  sourceFile: string; //Quelldatei
}

export interface AiInstructions {
  [key: string]:
  {
    instruction: string,
    type: string,
  }
}

export interface ImageAnalysisResult {
  analysis: string;
  error?: string;
}


export interface UserData {
  displayName: string;
  mail: string;
  userPrincipalName: string;
  photo?: string;
}

export interface TokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  modifiedDate: string;
  modifiedBy: string;
  size: string;
  shared: boolean;
}