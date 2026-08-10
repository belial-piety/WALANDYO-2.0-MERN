// Maps each role to its default landing page after login.
export const DEFAULT_ROUTES = {
  admin: '/reports',
  manager: '/reports',
  inventory: '/inventory',
  cashier: '/counter',
};

export const getDefaultRoute = (role) => DEFAULT_ROUTES[role] || '/counter';

export default getDefaultRoute;

