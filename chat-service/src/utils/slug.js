/**
 * Transforme un nom de room en identifiant lisible :
 *   "Captain Meteor" -> "captain-meteor"
 *   "Crossovers rêvés" -> "crossovers-reves"
 */
function slugify(value, maxLength = 40) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/^-+|-+$/g, "");
}

module.exports = { slugify };
