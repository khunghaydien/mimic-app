const ROOT = '/libraries';
const item = (id: string) => `${ROOT}/${id}`;
const question = (id: string, questionId: string) =>
  `${item(id)}/questions/${questionId}`;

export const LIBRARIES_PATHS = {
  LIST: ROOT,
  CREATE: ROOT,
  GENERATE: `${ROOT}/generate`,
  GET: item,
  UPDATE: item,
  REMOVE: item,
  CREATE_QUESTION: (id: string) => `${item(id)}/questions`,
  UPDATE_QUESTION: question,
  REMOVE_QUESTION: question,
};
