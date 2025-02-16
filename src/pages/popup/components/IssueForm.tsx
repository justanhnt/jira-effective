import React from 'react';

interface IssueFormProps {
  issueKey: string;
  issueTitle: string;
  issueContent: string;
  loadingStates: {
    loadJira: boolean;
    analyze: boolean;
    subIssue: boolean;
  };
  onIssueKeyChange: (value: string) => void;
  onIssueTitleChange: (value: string) => void;
  onIssueContentChange: (value: string) => void;
  onLoadJira: () => void;
  onAnalyze: () => void;
  onCreateSubIssue: () => void;
}

export const IssueForm: React.FC<IssueFormProps> = ({
  issueKey,
  issueTitle,
  issueContent,
  loadingStates,
  onIssueKeyChange,
  onIssueTitleChange,
  onIssueContentChange,
  onLoadJira,
  onAnalyze,
  onCreateSubIssue,
}) => {
  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-grow">
            <label className="block mb-2 text-sm font-medium text-gray-700">Jira Issue Key</label>
            <input
              type="text"
              className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={issueKey}
              onChange={(e) => onIssueKeyChange(e.target.value)}
              placeholder="e.g., PROJ-123"
            />
          </div>
          <button
            className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
              loadingStates.loadJira
                ? 'bg-gray-100 text-gray-500'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={onLoadJira}
            disabled={loadingStates.loadJira}
          >
            {loadingStates.loadJira ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Loading...
              </span>
            ) : (
              'Load from Jira'
            )}
          </button>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Issue Title</label>
          <input
            type="text"
            className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={issueTitle}
            onChange={(e) => onIssueTitleChange(e.target.value)}
            placeholder="Enter the title of your issue"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Additional Information</label>
          <textarea 
            className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[120px]"
            placeholder="Provide any additional context or requirements..."
            value={issueContent}
            onChange={(e) => onIssueContentChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button 
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
            loadingStates.analyze || !issueTitle
              ? 'bg-gray-100 text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          onClick={onAnalyze}
          disabled={loadingStates.analyze || !issueTitle}
        >
          {loadingStates.analyze ? 'Analyzing...' : 'Generate Description'}
        </button>
        
        <button 
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
            loadingStates.subIssue || !issueTitle
              ? 'bg-gray-100 text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          onClick={onCreateSubIssue}
          disabled={loadingStates.subIssue || !issueTitle}
        >
          {loadingStates.subIssue ? 'Creating...' : 'Create Sub-Issues'}
        </button>
      </div>
    </>
  );
}; 