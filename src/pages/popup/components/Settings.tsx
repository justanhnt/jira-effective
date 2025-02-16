import React from 'react';
import { Settings as SettingsType } from '../../../config/types';

interface SettingsProps {
  settings: SettingsType;
  setSettings: (settings: SettingsType) => void;
  onSave: () => Promise<void>;
  onClear: () => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ settings, setSettings, onSave, onClear }) => {
  return (
    <div className="settings-panel mb-4 p-6 rounded-lg bg-white shadow-sm border border-gray-200">
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
          onClick={onSave}
        >
          Save
        </button>
        <button
          className="px-4 py-2 bg-red-500 rounded hover:bg-red-600"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}; 