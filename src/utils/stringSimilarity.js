const stringSimilarity = require('string-similarity');

const getClosestCommand = (input, validCommands) => {
  const matches = stringSimilarity.findBestMatch(input, validCommands);

  if (matches.bestMatch.rating >= 0.4) {
    return matches.bestMatch.target;
  }

  return null;
};

module.exports = { getClosestCommand };
