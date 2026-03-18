function isAdmin(member) {
  if (!member) return false;
  return member.permissions?.has?.("Administrator") ?? false;
}

module.exports = { isAdmin };
