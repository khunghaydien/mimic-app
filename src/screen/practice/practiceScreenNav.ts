export type PracticeScreenState =
  | { status: 'list' }
  | { status: 'play'; libraryId: string }
  | { status: 'result'; practiceId: string };

export const popPracticeScreen = (): PracticeScreenState => ({ status: 'list' });

export const resetPracticeScreen = (): PracticeScreenState => ({ status: 'list' });
