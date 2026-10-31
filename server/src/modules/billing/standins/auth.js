// STAND-IN for Savio's sign-in module.
//
// The real module sets req.user = { id, role: 'admin' | 'staff' | 'customer', customerId } from a login session.
// Until it is merged, the demo role switcher sends an "X-Demo-User" header and we turn it into the same req.user,
// so billing code and tests only ever read req.user and never care who put it there.
// At merge time: delete this file and mount Savio's auth middleware in its place.

import { HttpError } from '../../../errors.js';

export const DEMO_USERS = {
  admin: { key: 'admin', id: 1, name: 'Asha Mehta (Admin)', role: 'admin', customerId: null },
  staff: { key: 'staff', id: 2, name: 'Sam Verma (Staff)', role: 'staff', customerId: null },
  customerA: { key: 'customerA', id: 101, name: 'Priya Sharma (Customer A)', role: 'customer', customerId: 1 },
  customerB: { key: 'customerB', id: 102, name: 'Rohan Iyer (Customer B)', role: 'customer', customerId: 2 },
};

/** Sets req.user from the X-Demo-User header, or null when there is none. An unknown key is rejected. */
export function demoAuth(req, _res, next) {
  const key = req.get('x-demo-user');
  if (!key) {
    req.user = null;
    return next();
  }
  const user = DEMO_USERS[key];
  if (!user) return next(new HttpError(401, 'unknown_demo_user', `Unknown demo user "${key}"`));
  req.user = user;
  return next();
}
