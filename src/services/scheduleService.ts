import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const API_BASE_URL = '/api'; // Prefix for backend API requests

/**
 * Schedule service for managing course schedules
 */
const scheduleService = {
  /**
   * Get all schedules
   */
  async getAllSchedules() {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.SCHEDULES}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  },
  
  /**
   * Get schedule by ID
   */
  async getScheduleById(id: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.SCHEDULE_BY_ID(id)}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching schedule ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new schedule
   */
  async createSchedule(scheduleData: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SCHEDULES}`, scheduleData);
      return response.data;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing schedule
   */
  async updateSchedule(id: string, scheduleData: any) {
    try {
      const response = await axios.put(`${API_BASE_URL}${API_ENDPOINTS.SCHEDULE_BY_ID(id)}`, scheduleData);
      return response.data;
    } catch (error) {
      console.error(`Error updating schedule ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a schedule
   */
  async deleteSchedule(id: string) {
    try {
      const response = await axios.delete(`${API_BASE_URL}${API_ENDPOINTS.SCHEDULE_BY_ID(id)}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting schedule ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get employees by company IDs
   */
  async getEmployeesByCompany(companyIds: string[]): Promise<any[]> {
    try {
      // Get all employees and filter client-side
      // This is more reliable than using a potentially missing endpoint
      console.log(`Getting all employees and filtering for companies: ${companyIds.join(', ')}`);
      const response = await axios.get<any[]>('/employees');
      
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Invalid response from employees endpoint:', response.data);
        return [];
      }
      
      // Filter employees by company ID
      const filteredEmployees = response.data.filter(emp => {
        // Convert IDs to string for comparison
        const employeeCompanyId = String(emp.companyId || emp.company_id || (emp.company && emp.company.id) || '');
        return companyIds.some(id => String(id) === employeeCompanyId);
      });
      
      console.log(`Found ${filteredEmployees.length} employees for the selected companies`);
      return filteredEmployees;
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }
};

export default scheduleService; 