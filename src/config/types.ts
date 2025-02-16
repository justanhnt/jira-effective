export interface Settings {
  modelProvider: 'openai' | 'azure';
  azureEndpoint?: string;
  azureDeployment?: string;
  openaiApiKey?: string;
  azureApiKey?: string;
  azureApiVersion?: string;
  gptModel?: string;
} 