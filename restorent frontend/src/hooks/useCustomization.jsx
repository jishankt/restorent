import { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../Context/UserContext';

const useCustomization = (targetDocType) => {
  const [visibleFields, setVisibleFields] = useState({});
  const { baseUrl, getHeaders } = useContext(UserContext);
  
  const fetchCustomizations = useCallback(async () => {
    if (!targetDocType) return;
    try {
      const url = `${baseUrl || ""}/api/doctypes/${encodeURIComponent(targetDocType)}`;
      const response = await axios.get(url, { headers: getHeaders() });
      if (response.data && response.data.fields) {
        const visibleMap = {};
        response.data.fields.forEach(field => {
          // If 'hidden' is true, it is not visible. Otherwise, it is visible.
          // Fallback to is_visible property if hidden is not present (depending on how backend structures it)
          let isVisible = true;
          if (field.hidden === true) {
            isVisible = false;
          } else if (field.is_visible !== undefined && field.is_visible === 0) {
            isVisible = false;
          }
          
          // Use 'id' or 'fieldname' based on what the doctype provides
          const fieldKey = field.id || field.fieldname;
          if (fieldKey) {
            visibleMap[fieldKey] = isVisible;
          }
        });
        setVisibleFields(visibleMap);
      }
    } catch (error) {
      console.error(`Error fetching customizations for ${targetDocType}:`, error);
    }
  }, [targetDocType, baseUrl, getHeaders]);

  useEffect(() => {
    fetchCustomizations();
    
    // Listen for global doctype updates from CustomerCustomizationModal
    const handleDoctypesUpdated = () => {
      fetchCustomizations();
    };
    
    window.addEventListener('doctypes-updated', handleDoctypesUpdated);
    return () => {
      window.removeEventListener('doctypes-updated', handleDoctypesUpdated);
    };
  }, [fetchCustomizations]);

  const handleCustomizationRefresh = useCallback(() => {
    fetchCustomizations();
  }, [fetchCustomizations]);

  const isFieldVisible = useCallback((fieldName) => {
    if (Object.keys(visibleFields).length === 0) return true; // fallback, everything visible if no config loaded
    return visibleFields[fieldName] !== false;
  }, [visibleFields]);

  return { visibleFields, isFieldVisible, handleCustomizationRefresh };
};

export default useCustomization;
