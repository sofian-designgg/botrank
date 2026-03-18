const { config } = require("../config");

function sortRanksAsc(ranks = config.ranks) {
  return [...ranks].sort((a, b) => a.hours - b.hours);
}

function getRankRoleIds() {
  return sortRanksAsc().map((r) => r.roleId);
}

function getAchievedRank(totalHours) {
  const ranks = sortRanksAsc();
  let achieved = null;
  for (const r of ranks) {
    if (totalHours >= r.hours) achieved = r;
  }
  return achieved; // {hours, roleId} or null
}

function getNextRank(totalHours) {
  const ranks = sortRanksAsc();
  for (const r of ranks) {
    if (totalHours < r.hours) return r;
  }
  return null;
}

module.exports = { getRankRoleIds, getAchievedRank, getNextRank, sortRanksAsc };
