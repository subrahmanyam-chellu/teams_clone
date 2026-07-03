const { RESOURCES, PERMS } = require("./constants");

function hasPermission(user, resource, perm) {
  if (!user) return false;
  const roles = user.roles && user.roles.length > 0 ? user.roles : ["GUEST"];

  const rolePermissions = {
    ADMIN: {
      [RESOURCES.USER]: [PERMS.ADD, PERMS.READ, PERMS.UPDATE, PERMS.DELETE],
      [RESOURCES.MESSAGE]: [PERMS.SEND, PERMS.READ, PERMS.DELETE],
      [RESOURCES.MEETING]: [PERMS.SCHEDULE, PERMS.READ, PERMS.UPDATE, PERMS.DELETE],
      [RESOURCES.TEAM]: [PERMS.ADD, PERMS.READ, PERMS.UPDATE, PERMS.DELETE],
    },
    MEMBER: {
      [RESOURCES.USER]: [PERMS.READ, PERMS.UPDATE],
      [RESOURCES.MESSAGE]: [PERMS.SEND, PERMS.READ],
      [RESOURCES.MEETING]: [PERMS.SCHEDULE, PERMS.READ],
      [RESOURCES.TEAM]: [PERMS.READ],
    },
    GUEST: {
      [RESOURCES.USER]: [PERMS.READ],
      [RESOURCES.MESSAGE]: [PERMS.READ],
    },
  };

  return roles.some((role) => {
    const permsForResource = rolePermissions[role]?.[resource] || [];
    return permsForResource.includes(perm);
  });
}

module.exports = { hasPermission };
