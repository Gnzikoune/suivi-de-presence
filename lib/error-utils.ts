/**
 * Mappe les codes d'erreur techniques vers des messages conviviaux en français.
 */
export function getErrorMessage(error: any): string {
  if (!error) return "Une erreur inattendue est survenue.";
  
  const message = error.message || "";
  const code = error.code || "";

  // Cas spécifiques Supabase Auth
  if (message.includes("Invalid login credentials") || code === "invalid_credentials") {
    return "Email ou mot de passe incorrect. Veuillez réessayer.";
  }
  
  if (message.includes("User already registered") || code === "user_already_exists") {
    return "Cet e-mail est déjà associé à un compte. Connectez-vous plutôt.";
  }

  if (message.includes("Email not confirmed")) {
    return "Votre adresse e-mail n'a pas encore été confirmée. Vérifiez vos messages.";
  }

  if (message.includes("Password should be at least")) {
    return "Le mot de passe est trop court (minimum 6 caractères).";
  }

  if (message.includes("rate limit") || code === "over_query_limit") {
    return "Trop de tentatives en peu de temps. Veuillez patienter quelques minutes.";
  }

  if (message.includes("Network request failed")) {
    return "Erreur de connexion. Vérifiez votre accès internet.";
  }

  // Traductions générales
  console.warn("Unhandled error code/message:", { code, message });
  return "Une erreur est survenue lors de l'opération. Veuillez réessayer plus tard.";
}
