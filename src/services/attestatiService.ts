import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const API_BASE_URL = '/api'; // Prefix for backend API requests

interface Template {
  id: string;
  type: string;
  url: string;
  googleDocsUrl?: string;
  isDefault?: boolean;
}

interface GenerateAttestatiResponse {
  success: boolean;
  message: string;
  attestati: any[];
  errors?: any[];
}

interface CheckExistingAttesatoResult {
  exists: boolean;
  attestatoId?: string;
  name?: string;
}

/**
 * Attestati service for managing course certificates
 */
const attestatiService = {
  /**
   * Get all attestati documents
   */
  async getAllAttestati() {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.ATTESTATI}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching attestati:', error);
      throw error;
    }
  },
  
  /**
   * Check if attestato exists for a specific employee and course
   */
  async checkExistingAttestato(scheduledCourseId: string, employeeId: string): Promise<CheckExistingAttesatoResult> {
    try {
      const response = await axios.get<CheckExistingAttesatoResult>(
        `${API_BASE_URL}/attestati/check-existing?scheduledCourseId=${scheduledCourseId}&employeeId=${employeeId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error checking for existing attestato:', error);
      return { exists: false };
    }
  },
  
  /**
   * Generate attestati for a scheduled course
   */
  async generateAttestati(scheduledCourseId: string, options: { 
    templateId?: string, 
    templateUrl?: string,
    overwriteExisting?: boolean,
    employeeIds?: string[]
  } = {}) {
    try {
      console.log("generateAttestati called with options:", {
        scheduledCourseId,
        ...options
      });
      
      // Get default template if none specified
      let templateUrl = options.templateUrl;
      let templateId = options.templateId;
      
      if (!templateUrl && !templateId) {
        // Fetch available templates
        const templatesRes = await axios.get<Template[]>(`${API_BASE_URL}/template-links`);
        const attestatoTemplate = templatesRes.data.find((tpl) => tpl.type === 'attestato' && tpl.isDefault);
        
        if (!attestatoTemplate) {
          throw new Error('Nessun template attestato configurato nelle impostazioni.');
        }
        
        templateUrl = attestatoTemplate.url;
        templateId = attestatoTemplate.id;
      }
      
      // Build request data
      const requestData: Record<string, any> = {
        scheduledCourseId,
        overwriteExisting: options.overwriteExisting || false
      };
      
      // Add template info
      if (templateUrl) {
        requestData.templateUrl = templateUrl;
      }
      
      if (templateId) {
        requestData.templateId = templateId;
      }
      
      // Add specific employees if provided - IMPORTANT: backend expects participantIds, not employeeIds
      if (options.employeeIds && options.employeeIds.length > 0) {
        requestData.participantIds = options.employeeIds; // Fixed parameter name
        console.log(`Converting employeeIds to participantIds for ${options.employeeIds.length} employees`);
      } else {
        console.warn("No employeeIds provided in options - server will reject request");
      }
      
      // Make API request
      console.log("Sending attestati generation request:", requestData);
      
      // Try with multiple possible endpoints
      let lastError = null;
      const endpoints = [
        `${API_BASE_URL}/attestati/genera`, // Standard path with API_BASE_URL prefix
        `/api/attestati/genera`, // Absolute path with /api prefix
        `/attestati/genera`, // Absolute path without /api prefix
        `http://localhost:4003/api/attestati/genera`, // Direct backend port 4003
        `http://127.0.0.1:4003/api/attestati/genera` // Direct backend port 4003 (alternative localhost)
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to generate attestati with endpoint: ${endpoint}`);
          const response = await axios.post<GenerateAttestatiResponse>(
            endpoint, 
            requestData,
            { timeout: 15000 } // Longer timeout as attestati generation can take time
          );
          
          console.log("Server responded with:", {
            endpoint,
            success: response.data.success,
            message: response.data.message,
            attestatiCount: response.data.attestati?.length || 0
          });
          
          return response.data;
        } catch (error: any) {
          console.warn(`Error with endpoint ${endpoint}:`, error.message);
          lastError = error;
          // Continue to next endpoint
        }
      }
      
      // If all endpoints failed, throw the last error
      console.error('All attestati generation endpoints failed');
      throw lastError;
    } catch (error) {
      console.error('Error generating attestati:', error);
      throw error;
    }
  },
  
  /**
   * Delete an attestato
   */
  async deleteAttestato(id: string) {
    if (!id) {
      throw new Error('ID attestato non valido');
    }
    
    // Array di possibili endpoint da provare - more focused on valid endpoints
    const endpoints = [
      `${API_BASE_URL}${API_ENDPOINTS.ATTESTATI}/${id}`,
      `${API_ENDPOINTS.ATTESTATI}/${id}`,
      `/attestati/${id}`,
      `/api/attestati/${id}`,
      `http://localhost:4000/attestati/${id}`,
      `http://localhost:4001/attestati/${id}`,
      `http://localhost:4003/attestati/${id}`,
      `http://127.0.0.1:4000/attestati/${id}`,
      `http://127.0.0.1:4001/attestati/${id}`,
      `http://127.0.0.1:4003/attestati/${id}`
    ];
    
    let lastError = null;
    let errors = [];
    
    // Try both fetch and axios for better compatibility
    const methods = [
      // Method 1: fetch
      async (endpoint: string) => {
        const response = await fetch(endpoint, { 
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        return response.json().catch(() => ({}));
      },
      // Method 2: axios
      async (endpoint: string) => {
        const response = await axios.delete(endpoint, { timeout: 5000 });
        return response.data;
      },
      // Method 3: axios POST with _method=DELETE
      async (endpoint: string) => {
        const response = await axios.post(endpoint, { _method: 'DELETE' }, { timeout: 5000 });
        return response.data;
      }
    ];
    
    console.log(`Attempting to delete attestato ${id} with ${endpoints.length} endpoints and ${methods.length} methods`);
    
    // Try every combination of endpoint and method until one works
    for (const endpoint of endpoints) {
      for (const method of methods) {
        try {
          console.log(`Trying to delete attestato with endpoint: ${endpoint} and method: ${method.name || 'anonymous'}`);
          const result = await method(endpoint);
          console.log(`Successfully deleted attestato with endpoint: ${endpoint}`);
          return result;
        } catch (error: any) {
          lastError = error;
          errors.push({ endpoint, error: error.message || error });
          console.warn(`Error with endpoint ${endpoint}:`, error.message || error);
          // Continue to next method/endpoint
        }
      }
    }
    
    // If all endpoints failed, throw an error
    console.error('Error deleting attestato:', lastError);
    throw new Error(`Errore durante l'eliminazione dell'attestato. Tentati ${endpoints.length * methods.length} metodi.`);
  },
  
  /**
   * Delete multiple attestati at once
   */
  async deleteMultipleAttestati(ids: string[]) {
    if (!ids.length) {
      throw new Error('Nessun attestato selezionato');
    }
    
    try {
      console.log(`Deleting ${ids.length} attestati`);
      
      // Define possible endpoints
      const endpoints = [
        `/api/attestati/delete-multiple`,
        `/attestati/delete-multiple`,
        `http://localhost:4000/api/attestati/delete-multiple`,
        `http://localhost:4000/attestati/delete-multiple`,
        `http://localhost:4001/api/attestati/delete-multiple`,
        `http://localhost:4001/attestati/delete-multiple`,
        `http://localhost:4003/api/attestati/delete-multiple`,
        `http://localhost:4003/attestati/delete-multiple`,
        `http://127.0.0.1:4000/api/attestati/delete-multiple`,
        `http://127.0.0.1:4000/attestati/delete-multiple`,
        `http://127.0.0.1:4001/api/attestati/delete-multiple`,
        `http://127.0.0.1:4001/attestati/delete-multiple`,
        `http://127.0.0.1:4003/api/attestati/delete-multiple`,
        `http://127.0.0.1:4003/attestati/delete-multiple`
      ];
      
      // Define different formats for the request payload that servers might expect
      const payloadFormats = [
        { ids },
        { attestatoIds: ids },
        { id: ids }
      ];
      
      let lastError = null;
      
      // Try each endpoint with each payload format
      for (const endpoint of endpoints) {
        for (const payload of payloadFormats) {
          try {
            console.log(`Trying to delete multiple attestati with endpoint: ${endpoint} and payload:`, payload);
            const response = await axios.post(endpoint, payload, { 
              timeout: 8000,
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (response.status >= 200 && response.status < 300) {
              console.log(`Successfully deleted attestati with endpoint: ${endpoint}`);
              return response.data;
            }
          } catch (error: any) {
            lastError = error;
            console.warn(`Error with endpoint ${endpoint}:`, error.message || error);
          }
        }
      }
      
      // If all batch endpoints failed, try deleting one by one
      console.log('All batch deletion endpoints failed, trying to delete attestati one by one');
      const results = await Promise.allSettled(ids.map(id => this.deleteAttestato(id)));
      
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (succeeded > 0) {
        console.log(`Successfully deleted ${succeeded}/${ids.length} attestati individually`);
        return { 
          success: true,
          message: `Deleted ${succeeded}/${ids.length} attestati`,
          failedCount: failed
        };
      }
      
      // Se arriviamo qui, tutti gli endpoint hanno fallito
      console.error('Error deleting multiple attestati:', lastError);
      throw lastError || new Error('Failed to delete attestati with all available endpoints');
    } catch (error) {
      console.error('Error in deleteMultipleAttestati:', error);
      throw error;
    }
  }
};

export default attestatiService; 