import React, { useState } from 'react';
import { TicketAnalysis, SubTicket } from '../types';

interface GeneratedContentProps {
  generatedDescription: string;
  analysis: TicketAnalysis | null;
  subTickets: SubTicket[] | null;
  loadingStates: {
    apply: boolean;
  };
  onCopyDescription: () => void;
  onCopy: (content: string) => void;
  onSubTicketCopied: (ticketTitle: string) => void;
}

const SubTicketItem = ({ 
  ticket, 
  onCopy, 
  onCopied 
}: { 
  ticket: SubTicket; 
  onCopy: (content: string) => void;
  onCopied: () => void;
}) => {
  const [isRecentlyCopied, setIsRecentlyCopied] = useState(false);

  const handleCopy = () => {
    onCopy(ticket.title);
    onCopied();
    setIsRecentlyCopied(true);
    setTimeout(() => setIsRecentlyCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col gap-2 p-3 bg-white rounded-lg shadow-sm ${ticket.is_copied ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start">
        <span className="font-medium text-gray-800">{ticket.title}</span>
        <button
          onClick={handleCopy}
          className={`ml-2 px-4 py-1 rounded transition-colors flex items-center gap-1
            ${isRecentlyCopied 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-blue-500 hover:bg-blue-600'} 
            text-white`}
        >
          {isRecentlyCopied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            'Copy'
          )}
        </button>
      </div>
      <div className="text-sm text-blue-500">
        {ticket.estimated_effort} points
      </div>
    </div>
  );
};

export const GeneratedContent: React.FC<GeneratedContentProps> = ({
  generatedDescription,
  analysis,
  subTickets,
  loadingStates,
  onCopyDescription,
  onCopy,
  onSubTicketCopied,
}) => {
  if (!generatedDescription && !subTickets) return null;

  return (
    <>
      {generatedDescription && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Generated Description</h3>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
            {generatedDescription}
          </pre>
          
          {analysis && (
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Estimated Effort:</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {analysis.estimated_effort} points
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Breakdown Required:</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  analysis.breakdown_required 
                    ? 'bg-yellow-50 text-yellow-700' 
                    : 'bg-green-50 text-green-700'
                }`}>
                  {analysis.breakdown_required ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <button 
              className={`w-full px-4 py-2.5 rounded-lg font-medium transition-colors ${
                loadingStates.apply
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={onCopyDescription}
              disabled={loadingStates.apply}
            >
              {loadingStates.apply ? 'Processing...' : 'Copy & Open Editor'}
            </button>
          </div>
        </div>
      )}

      {subTickets && (
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Sub-Issues</h3>
          <ul className="space-y-3">
            {subTickets.map((ticket, index) => (
              <SubTicketItem 
                key={index} 
                ticket={ticket}
                onCopy={onCopy}
                onCopied={() => onSubTicketCopied(ticket.title)}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}; 