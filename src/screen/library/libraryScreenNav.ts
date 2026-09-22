export type LibraryScreenState =
  | { status: 'list' }
  | { status: 'create' }
  | { status: 'view'; libraryId: string }
  | { status: 'update'; libraryId: string; from: 'list' | 'view' }
  | { status: 'play'; libraryId: string };

export const popLibraryScreen = (screen: LibraryScreenState): LibraryScreenState => {
  if (screen.status === 'play') {
    return { status: 'view', libraryId: screen.libraryId };
  }
  if (screen.status === 'update') {
    return screen.from === 'view'
      ? { status: 'view', libraryId: screen.libraryId }
      : { status: 'list' };
  }
  return { status: 'list' };
};

export const resetLibraryScreen = (): LibraryScreenState => ({ status: 'list' });
