export type TicketAnalysis = {
  description: string;
  estimated_effort: number;
  breakdown_required: boolean;
};

export interface SubTicket {
  title: string;
  estimated_effort: number;
  is_copied?: boolean;
}

export interface PopupState {
  issueContent: string;
  issueKey: string;
  issueTitle: string;
  generatedDescription: string;
  analysis: TicketAnalysis | null;
  subTickets: SubTicket[] | null;
} 