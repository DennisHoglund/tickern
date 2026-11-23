// Edge function i det delade Supabase-projektet (samma som Jaktvind och Svampkartan).
// Tickern rör inga tabeller – funktionen tickern-quote hämtar bara kurser.
window.TICKERN_CONFIG = {
  quoteUrl: 'https://sjdznlmnvubqscftdkoj.supabase.co/functions/v1/tickern-quote',
  uppdateraSek: 60,
  standardlista: ['VOLV-B', 'ERIC-B', 'INVE-B', 'ATCO-A', 'SAAB-B', 'HM-B', 'EVO']
};
