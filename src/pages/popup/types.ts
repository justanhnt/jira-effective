export type TicketAnalysis = {
  description: string;
  estimated_effort: number;
  breakdown_required: boolean;
};

export type SubTicket = {
  title: string;
  estimated_effort: number;
};

export interface PopupState {
  issueContent: string;
  issueKey: string;
  issueTitle: string;
  generatedDescription: string;
  analysis: TicketAnalysis | null;
  subTickets: SubTicket[] | null;
} 