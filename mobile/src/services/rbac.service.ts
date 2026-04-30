import api from './api';

export interface MenuItem {
  id?: number;
  title: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  order?: number;
  module?: string;
}

export const RbacService = {
  getMenu: async () => {
    try {
      const response = await api.get<MenuItem[]>('/api/rbac/menu');
      return response.data;
    } catch (error) {
      console.error('Error fetching menu:', error);
      return [];
    }
  },

  getMyPermissions: async () => {
    try {
      const response = await api.get<any>('/api/rbac/my-permissions');
      return response.data;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return { roles: [], permissions: [] };
    }
  }
};
