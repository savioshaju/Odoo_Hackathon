// STAND-IN for Savio's sign-in. The role switcher picks one of these; the server maps the same keys to req.user.

export const DEMO_USERS = [
  { key: 'admin', name: 'Asha Mehta', role: 'admin', label: 'Admin' },
  { key: 'staff', name: 'Sam Verma', role: 'staff', label: 'Staff' },
  { key: 'customerA', name: 'Priya Sharma', role: 'customer', label: 'Customer A' },
  { key: 'customerB', name: 'Rohan Iyer', role: 'customer', label: 'Customer B' },
];

export const userByKey = (key) => DEMO_USERS.find((u) => u.key === key) ?? DEMO_USERS[0];
