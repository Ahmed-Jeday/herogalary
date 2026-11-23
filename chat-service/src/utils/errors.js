/**
 * Erreur HTTP homogène avec le format de réponse de l'auth-service :
 *   { error: { code, message } }
 */
function createHttpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

module.exports = { createHttpError };
