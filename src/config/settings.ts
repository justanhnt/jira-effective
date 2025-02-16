import { Settings } from './types';

export const loadSettings = async (): Promise<Settings> => {
  try {
    const [settings] = await Promise.all([
      chrome.storage.sync.get('settings'),
    ]);
    
    return {
      ...(settings.settings || {
        modelProvider: 'openai',
        openaiApiKey: ''
      }),
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      modelProvider: 'openai',
      openaiApiKey: ''
    };
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  await Promise.all([
    chrome.storage.sync.set({ settings }),
  ]);
}; 