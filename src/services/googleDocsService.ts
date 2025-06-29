import axios from 'axios';

const API_BASE_URL = 'http://localhost:4001';

interface GoogleDocsTemplate {
  id: string;
  name: string;
  type: string;
  googleDocsUrl: string;
  isDefault: boolean;
}

interface GoogleDocsTemplateResponse {
  success: boolean;
  template: GoogleDocsTemplate;
}

interface GenerateDocumentParams {
  type: string;
  data: Record<string, string>;
}

interface GenerateDocumentResult {
  success: boolean;
  message: string;
  fileName?: string;
  fileUrl?: string;
  fileFormat?: string;
  error?: string;
  details?: string;
  userMessage?: string;
}

/**
 * Google Docs API service for interacting with the backend Google Docs integration
 */
const googleDocsService = {
  /**
   * Get the default Google Docs template for a specific document type
   * @param type - Document type (e.g., 'attestato', 'lettera_incarico')
   * @returns The default template or null if not found
   */
  async getDefaultTemplate(type: string): Promise<GoogleDocsTemplate | null> {
    try {
      const response = await axios.get<GoogleDocsTemplateResponse>(`${API_BASE_URL}/api/google-docs/templates/${type}`);
      return response.data?.template || null;
    } catch (error) {
      console.error('Error getting default Google Docs template:', error);
      return null;
    }
  },

  /**
   * Generate a document using a Google Docs template
   * @param params - Generation parameters including type and placeholder data
   * @returns Generation result with file information
   */
  async generateDocument(params: GenerateDocumentParams): Promise<GenerateDocumentResult> {
    try {
      const response = await axios.post<GenerateDocumentResult>(`${API_BASE_URL}/api/google-docs/generate`, params);
      return response.data;
    } catch (error: any) {
      console.error('Error generating document from Google Docs template:', error);
      return {
        success: false,
        message: 'Error generating document',
        error: error.response?.data?.error || error.message,
        details: error.response?.data?.details
      };
    }
  },

  /**
   * Generate a certificate for a participant in a course
   * @param scheduledCourseId - ID of the scheduled course
   * @param employeeId - ID of the employee/participant
   * @returns Generation result with file information
   */
  async generateAttestato(scheduledCourseId: string, employeeId: string): Promise<GenerateDocumentResult> {
    try {
      const response = await axios.get<GenerateDocumentResult>(
        `${API_BASE_URL}/api/google-docs/attestati/${scheduledCourseId}/${employeeId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error generating attestato from Google Docs template:', error);
      
      // Extract more detailed error information if available
      const errorDetails = error.response?.data?.details;
      const errorMessage = error.response?.data?.error || error.message;
      
      return {
        success: false,
        message: 'Error generating attestato',
        error: errorMessage,
        details: errorDetails || error.response?.data || 'Check server logs for more information',
        userMessage: 'Impossibile generare l\'attestato. Verifica che le credenziali Google API siano configurate correttamente.'
      };
    }
  }
};

export default googleDocsService; 