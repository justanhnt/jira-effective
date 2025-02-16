import OpenAI, { AzureOpenAI } from 'openai';
import { loadSettings } from '../config/settings';

let openaiInstance: OpenAI | AzureOpenAI | null = null;

const getOpenAIInstance = async () => {
  if (!openaiInstance) {
    const settings = await loadSettings();
    
    if (settings.modelProvider === 'azure') {
      // Azure OpenAI setup
      openaiInstance = new AzureOpenAI({
        apiKey: settings.azureApiKey,
        apiVersion: settings.azureApiVersion,
        endpoint: settings.azureEndpoint || "",
        deployment: settings.azureDeployment || "",
        dangerouslyAllowBrowser: true
      });
    } else {
      // Regular OpenAI setup
      openaiInstance = new OpenAI({
        apiKey: settings.openaiApiKey,
        dangerouslyAllowBrowser: true
      });
    }
  }
  return openaiInstance;
};

export const analyzeIssue = async (issueTitle: string, issueContent: string) => {
  try {
    const openai = await getOpenAIInstance();
    const settings = await loadSettings();
    
    const response = await openai.chat.completions.create({
      model: settings.gptModel || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful JIRA project management assistant that helps analyze tickets. Your response should be in JSON format 
          The Description should be rich enough to understand the issue and in MD format.
          The estimated_effort should be in story points (1,2,3,5,8,13)
          The breakdown_required should be true if the estimated_effort is above 8 points
        {
          description: string;
          estimated_effort: number;
          breakdown_required: boolean;
        }
        `
        },
        {
          role: "user",
          content: `Analyze this ticket and provide: 
            Issue Title: ${issueTitle}
            Issue Content: ${issueContent}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return response.choices[0]?.message?.content;
  } catch (error) {
    console.error('Error analyzing ticket:', error);
    throw error;
  }
}; 