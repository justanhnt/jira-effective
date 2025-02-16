import React, { useState, useEffect } from 'react';
import { analyzeIssue, createSubIssue } from '../../services/openai';
import { loadSettings, saveSettings } from '../../config/settings';
import { Settings } from '../../config/types';
import { Settings as SettingsComponent } from './components/Settings';
import { IssueForm } from './components/IssueForm';
import { GeneratedContent } from './components/GeneratedContent';
import { PopupState, SubTicket } from './types';
import { TicketAnalysis } from './types';



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
    setLoadingStates(prev => ({ ...prev, subIssue: true }));
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
      setLoadingStates(prev => ({ ...prev, subIssue: false }));
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
      setSubTickets(null);

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

  const handleSubTicketCopied = (ticketTitle: string) => {
    if (!subTickets) return;
    
    const updatedSubTickets = subTickets.map(ticket => 
      ticket.title === ticketTitle 
        ? { ...ticket, is_copied: true }
        : ticket
    );
    
    setSubTickets(updatedSubTickets);
  };

  return (
    <div className="ticket-assistant p-4 max-w-4xl mx-auto bg-gray-50 min-h-[800px]">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Ticket Assistant</h1>
        <div className="flex gap-2">
          <button
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-200 p-2 rounded-full transition-colors"
            onClick={handleClearState}
            title="Clear all data"
          >
            🗑️
          </button>
          <button
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-200 p-2 rounded-full transition-colors"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
          </svg>
          {success}
        </div>
      )}

      {showSettings ? (
        <SettingsComponent
          settings={settings}
          setSettings={setSettings}
          onSave={handleSaveSetings}
          onClear={handleClearSetings}
        />
      ) : (
        <>
          <IssueForm
            issueKey={issueKey}
            issueTitle={issueTitle}
            issueContent={issueContent}
            loadingStates={loadingStates}
            onIssueKeyChange={setIssueKey}
            onIssueTitleChange={setIssueTitle}
            onIssueContentChange={setIssueContent}
            onLoadJira={loadJiraInformation}
            onAnalyze={handleAnalyzeIssue}
            onCreateSubIssue={handleCreateSubIssue}
          />
          
          <GeneratedContent
            generatedDescription={generatedDescription}
            analysis={analysis}
            subTickets={subTickets}
            loadingStates={loadingStates}
            onCopyDescription={handleCopyDescription}
            onCopy={handleCopy}
            onSubTicketCopied={handleSubTicketCopied}
          />
        </>
      )}
    </div>
  );
};

export default Popup;