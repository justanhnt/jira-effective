import React, { useState, useEffect } from 'react';
import { analyzeIssue, createSubIssue } from '../../services/openai';
import { loadSettings, saveSettings } from '../../config/settings';
import { Settings } from '../../config/types';

// Add this type definition near the top of the file
type TicketAnalysis = {
  description: string;
  estimated_effort: number;
  breakdown_required: boolean;
};

type SubTicket = {
  title: string;
  estimated_effort: number;
};

// Add interface for popup state
interface PopupState {
  issueContent: string;
  issueKey: string;
  issueTitle: string;
  generatedDescription: string;
  analysis: TicketAnalysis | null;
  subTickets: SubTicket[] | null;
}

const Popup = () => {
  const [issueContent, setIssueContent] = useState('');
  const [loadingStates, setLoadingStates] = useState({
    analyze: false,
    subIssue: false,
    apply: false,
    loadJira: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({
    modelProvider: 'openai',
    azureEndpoint: '',
    azureDeployment: '',
    openaiApiKey: '',
    azureApiKey: '',
    azureApiVersion: '',
    gptModel: 'gpt-4o-mini'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [issueKey, setIssueKey] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [analysis, setAnalysis] = useState<TicketAnalysis | null>(null);
  const [subTickets, setSubTickets] = useState<SubTicket[] | null>(null);

  useEffect(() => {
    // Load both settings and popup state when component mounts
    Promise.all([
      loadSettings(),
      chrome.storage.local.get(['popupState'])
    ]).then(([savedSettings, { popupState }]) => {
      setSettings(savedSettings);
      
      // Restore popup state if it exists
      if (popupState) {
        setIssueContent(popupState.issueContent || '');
        setIssueKey(popupState.issueKey || '');
        setIssueTitle(popupState.issueTitle || '');
        setGeneratedDescription(popupState.generatedDescription || '');
        setAnalysis(popupState.analysis);
        setSubTickets(popupState.subTickets);
      }
    });
  }, []);

  // Add effect to save state when relevant values change
  useEffect(() => {
    const popupState: PopupState = {
      issueContent,
      issueKey,
      issueTitle,
      generatedDescription,
      analysis,
      subTickets
    };
    
    chrome.storage.local.set({ popupState });
  }, [issueContent, issueKey, issueTitle, generatedDescription, analysis, subTickets]);

  const handleAnalyzeIssue = async () => {
    setLoadingStates(prev => ({ ...prev, analyze: true }));
    setError(null);
    try {
      const result = await analyzeIssue(issueTitle, issueContent);
      if (typeof result === 'string') {
        try {
          const parsedResult = JSON.parse(result) as TicketAnalysis;
          setAnalysis(parsedResult);
          setGeneratedDescription(parsedResult.description);
        } catch {
          setGeneratedDescription(result);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setGeneratedDescription('Failed to analyze ticket. Please check your API key and try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, analyze: false }));
    }
  };

  const handleCreateSubIssue = async () => {
    setLoadingStates(prev => ({ ...prev, analyze: true }));
    setError(null);
    try {
      const result = await createSubIssue(issueTitle, issueContent);
      if (typeof result === 'string') {
        try {
          const parsedResult = JSON.parse(result)["sub_tickets"] as SubTicket[];
          setSubTickets(parsedResult);
        } catch {
          setError('Failed to parse sub-issue response');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to create sub-issues. Please check your API key and try again.');
    } finally {
    }
  }

  const handleSaveSetings = async () => {
    try {
      await saveSettings(settings);
      setError(null);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000); // Clear success after 3 seconds
      setShowSettings(false);
    } catch (error) {
      setError('Failed to save settings');
      setSuccess(null);
    }
  };

  const handleClearSetings = async () => {
    try {
      const clearedSettings: Settings = {
        modelProvider: 'openai',
        azureEndpoint: '',
        azureDeployment: '',
        openaiApiKey: '',
        azureApiKey: '',
        azureApiVersion: '',
        gptModel: 'gpt-4o-mini'
      };
      await saveSettings(clearedSettings);
      setSettings(clearedSettings);
      setError(null);
    } catch (error) {
      setError('Failed to clear settings');
    }
  };

  const loadJiraInformation = async () => {
    setError(null);
    setLoadingStates(prev => ({ ...prev, loadJira: true }));
    try {
      // Clear existing state first
      setGeneratedDescription('');
      setAnalysis(null);

      // Query the active tab to execute content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('No active tab found');

      const result = await chrome.tabs.sendMessage(tab.id, { action: 'getJiraInfo' });
      
      if (result.issueKey) {
        setIssueKey(result.issueKey);
      }
      if (result.issueTitle) {
        setIssueTitle(result.issueTitle);
      }
      if (result.description) {
        setIssueContent(result.description);
      }
    } catch (error) {
      console.error('Error loading Jira information:', error);
      setError('Failed to load Jira information. Make sure you are on a Jira issue page.');
    } finally {
      setLoadingStates(prev => ({ ...prev, loadJira: false }));
    }
  };

  const handleCopy = async (content: string) => {
    setLoadingStates(prev => ({ ...prev, apply: true }));
    setError(null);
    setSuccess(null);
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Error copying content:', error);
      setError('Failed to copy content to clipboard');
    } finally {
      setLoadingStates(prev => ({ ...prev, apply: false }));
    }
  };

  const handleCopyDescription = async () => {
    setLoadingStates(prev => ({ ...prev, apply: true }));
    setError(null);
    setSuccess(null);
    await handleCopy(generatedDescription);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('No active tab found');

      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'copyDescription', 
      });

      if (response.success) {
        setSuccess('Description copied and editor opened!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to copy content. Make sure you are on a Jira issue page.');
    } finally {
      setLoadingStates(prev => ({ ...prev, apply: false }));
    }
  };

  // Add function to clear state
  const handleClearState = async () => {
    setIssueContent('');
    setIssueKey('');
    setIssueTitle('');
    setGeneratedDescription('');
    setAnalysis(null);
    setSubTickets(null);
    await chrome.storage.local.remove('popupState');
  };

  return (
    <div className="ticket-assistant">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Ticket Assistant</h1>
        <div className="flex gap-2">
          <button
            className="clear-button px-2 py-1 rounded"
            onClick={handleClearState}
          >
            🗑️ Clear
          </button>
          <button
            className="settings-button px-2 py-1 rounded"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500 text-white rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500 text-white rounded">
          {success}
        </div>
      )}

      {showSettings ? (
        <div className="settings-panel mb-4 p-4 rounded bg-white">
          <h2 className="text-lg font-semibold mb-2">Settings</h2>
          
          <div className="mb-4">
            <label className="block mb-2">Model Provider:</label>
            <select
              className="w-full p-2 rounded bg-white"
              value={settings.modelProvider}
              onChange={(e) => setSettings({ ...settings, modelProvider: e.target.value as 'openai' | 'azure' })}
            >
              <option value="openai">OpenAI</option>
              <option value="azure">Azure OpenAI</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-2">GPT Model:</label>
            <select
              className="w-full p-2 rounded bg-white"
              value={settings.gptModel}
              onChange={(e) => setSettings({ ...settings, gptModel: e.target.value })}
            >
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
            </select>
          </div>

          {settings.modelProvider === 'openai' ? (
            <div className="mb-4">
              <label className="block mb-2">OpenAI API Key:</label>
              <input
                type="password"
                className="w-full p-2 rounded"
                value={settings.openaiApiKey}
                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                placeholder="Enter your OpenAI API key"
              />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block mb-2">Azure API Key:</label>
                <input
                  type="password"
                  className="w-full p-2 rounded"
                  value={settings.azureApiKey}
                  onChange={(e) => setSettings({ ...settings, azureApiKey: e.target.value })}
                  placeholder="Enter your Azure API key"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Azure API Version:</label>
                <input
                  type="text"
                  className="w-full p-2 rounded"
                  value={settings.azureApiVersion}
                  onChange={(e) => setSettings({ ...settings, azureApiVersion: e.target.value })}
                  placeholder="Enter Azure API version (e.g., 2023-05-15)"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Azure Endpoint:</label>
                <input
                  type="text"
                  className="w-full p-2 rounded"
                  value={settings.azureEndpoint}
                  onChange={(e) => setSettings({ ...settings, azureEndpoint: e.target.value })}
                  placeholder="Enter Azure endpoint URL"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Azure Deployment:</label>
                <input
                  type="text"
                  className="w-full p-2 rounded"
                  value={settings.azureDeployment}
                  onChange={(e) => setSettings({ ...settings, azureDeployment: e.target.value })}
                  placeholder="Enter Azure deployment name"
                />
              </div>
            </>
          )}

          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
              onClick={handleSaveSetings}
            >
              Save
            </button>
            <button
              className="px-4 py-2 bg-red-500 rounded hover:bg-red-600"
              onClick={handleClearSetings}
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-grow">
                <label className="block mb-2">Jira Issue Key:</label>
                <input
                  type="text"
                  className="w-full p-2 rounded"
                  value={issueKey}
                  onChange={(e) => setIssueKey(e.target.value)}
                  placeholder="Enter Jira issue key (e.g., PROJ-123)"
                />
              </div>
              <button
                className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
                onClick={loadJiraInformation}
                disabled={loadingStates.loadJira}
              >
                {loadingStates.loadJira ? 'Loading...' : 'Load from Jira'}
              </button>
            </div>

            <div>
              <label className="block mb-2">Issue Title:</label>
              <input
                type="text"
                className="w-full p-2 rounded"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="Enter issue title"
              />
            </div>

            <div>
              <label className="block mb-2">Additional Information:</label>
              <textarea 
                className="ticket-input w-full p-2 rounded"
                placeholder="Provide additional ticket content here..."
                value={issueContent}
                onChange={(e) => setIssueContent(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              className="analyze-button flex-1"
              onClick={() => handleAnalyzeIssue()}
              disabled={loadingStates.analyze || !issueTitle}
            >
              {loadingStates.analyze ? 'Analyzing...' : 'Generate Description'}
            </button>
            
            <button 
              className="analyze-button flex-1"
              onClick={() => handleCreateSubIssue()}
              disabled={loadingStates.subIssue || !issueTitle}
            >
              {loadingStates.subIssue ? 'Analyzing...' : 'Create Sub-Issues'}
            </button>
          </div>

          {generatedDescription && (
            <div className="mt-4 space-y-4">
              <div className="p-3 bg-white rounded">
                <h3 className="font-semibold mb-2">Generated Description:</h3>
                <pre className="whitespace-pre-wrap text-sm">
                  {generatedDescription}
                </pre>
                
                {analysis && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Estimated Effort:</span>
                      <span className="px-2 py-1 bg-blue-100 rounded">
                        {analysis.estimated_effort} points
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Breakdown Required:</span>
                      <span className={`px-2 py-1 rounded ${
                        analysis.breakdown_required 
                          ? 'bg-yellow-100' 
                          : 'bg-green-100'
                      }`}>
                        {analysis.breakdown_required ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button 
                  className="flex-1 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleCopyDescription}
                  disabled={loadingStates.apply}
                >
                  {loadingStates.apply ? 'Processing...' : 'Copy & Open Editor'}
                </button>
              </div>
            </div>
          )}

          {subTickets && (
            <div className="mt-4 space-y-4">
              <h3 className="font-semibold mb-2">Sub-Issues:</h3>
              <ul className="list-disc pl-5">
                {subTickets.map((ticket, index) => (
                  <li key={index}>
                    <span className="font-medium">{ticket.title}</span>
                    <span className="text-gray-500"> ({ticket.estimated_effort} points)</span>
                    <button
                      className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
                      onClick={() => handleCopy(ticket.title)}
                    >
                      Copy
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Popup;