// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getJiraInfo') {
    try {
      // Get issue key
      const issueKeyElement = document.querySelector('[data-testid="issue.views.issue-base.foundation.breadcrumbs.current-issue.item"]');
      const issueKey = issueKeyElement?.textContent?.trim() || '';

      const issueTitleElement = document.querySelector('[data-testid="issue.views.issue-base.foundation.summary.heading"]');
      const issueTitle = issueTitleElement?.textContent?.trim() || '';

      // Get description
      const descriptionElement = document.querySelector('[data-component-selector="jira-issue-view-rich-text-inline-edit-view-container"]');
      const description = descriptionElement?.textContent?.trim() || '';

      sendResponse({ issueKey, issueTitle, description });
    } catch (error) {
      console.error('Error getting Jira information:', error);
      sendResponse({ error: 'Failed to get Jira information' });
    }
  } 
  else if (request.action === 'copyDescription') {
    try {
      // Find and click the description area to open editor
      const descriptionElement = document.querySelector('[data-component-selector="jira-issue-view-rich-text-inline-edit-view-container"]') as HTMLElement;
      descriptionElement?.click();
      sendResponse({ success: true });
    } catch (error: any) {
      console.error('Error opening description editor:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  return true; // Required for async response
}); 