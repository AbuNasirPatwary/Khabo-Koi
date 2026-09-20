import {
  AUTH_EXPIRED_EVENT,
  clearAuthentication,
  getProfileForProductRole,
  loginForProductRole,
} from './adminApi'


export const MANAGER_AUTH_EXPIRED_EVENT = AUTH_EXPIRED_EVENT


export function clearManagerAuthentication() {
  clearAuthentication()
}


export async function loginRestaurantManager(credentials) {
  return loginForProductRole(
    credentials,
    'RESTAURANT_MANAGER',
    'Restaurant Manager',
  )
}


export async function getRestaurantManagerProfile() {
  return getProfileForProductRole(
    'RESTAURANT_MANAGER',
    'Restaurant Manager',
  )
}
