export interface PreservedEditorText {
  draftId: string;
  text: string;
}

export function preserveDraftEditorText(
  draftId: string | null,
  text: string,
): PreservedEditorText | null {
  return draftId ? { draftId, text } : null;
}

export function resolveDraftEditorText(
  draftId: string | null,
  originalText: string,
  preservedText: PreservedEditorText | null,
): string {
  return preservedText?.draftId === draftId
    ? preservedText.text
    : originalText;
}

export function clearPreservedDraftEditorText(): null {
  return null;
}
