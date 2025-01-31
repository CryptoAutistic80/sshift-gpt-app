import { useEffect, useState } from 'react';
import backend from '../../src/services/backend';
import { useAuth } from '@fn-chat/context/AuthProvider';

interface PromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

// Format the prompt for display by replacing escaped characters
const formatForDisplay = (prompt: string): string => {
  return prompt
    .replace(/\\n/g, '\n') // Replace \n with actual newlines
    .replace(/\\"/g, '"') // Replace \" with "
    .replace(/\\'/g, "'") // Replace \' with '
    .replace(/\\\\/g, '\\'); // Replace \\ with \
};

// Restore the prompt to its original format for saving
const formatForSaving = (prompt: string): string => {
  return prompt
    .replace(/\\/g, '\\\\') // Replace \ with \\
    .replace(/"/g, '\\"') // Replace " with \"
    .replace(/'/g, "\\'") // Replace ' with \'
    .replace(/\n/g, '\\n'); // Replace newlines with \n
};

const PromptEditor = ({ isOpen, onClose }: PromptEditorProps) => {
  const [promptContent, setPromptContent] = useState('');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { jwt } = useAuth();

  useEffect(() => {
    const fetchSystemPrompt = async () => {
      try {
        const response = await backend.get('/admin-config');
        setPromptContent(formatForDisplay(response.data.systemPrompt || ''));
      } catch (error) {
        console.error('Error fetching system prompt:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchSystemPrompt();
    }
  }, [isOpen]);

  useEffect(() => {
    const updateDimensions = () => {
      const maxHeight = window.innerHeight * 0.9;
      const maxWidth = window.innerWidth * 0.9;
      const width = maxWidth;
      const height = maxHeight;
      setDimensions({ width, height });
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await backend.get('/admin-config');
      const currentConfig = response.data;

      await backend.put(
        '/admin-config',
        {
          ...currentConfig,
          systemPrompt: formatForSaving(promptContent),
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      onClose();
    } catch (error) {
      console.error('Error saving system prompt:', error);
      alert('Failed to save system prompt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
        className="bg-white rounded-lg shadow-xl flex flex-col"
      >
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold">Edit System Prompt</h2>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <textarea
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              className="w-full h-full p-4 border rounded-lg resize-none font-mono text-sm"
              style={{
                minHeight: '100%',
                lineHeight: '1.6',
                fontSize: '14px',
                whiteSpace: 'pre-wrap',
                tabSize: '2',
                overflowY: 'auto',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                backgroundColor: '#f8f9fa',
                color: '#1a1a1a',
              }}
              spellCheck="false"
              disabled={isSaving}
            />
          )}
        </div>

        <div className="p-4 border-t flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
            disabled={isLoading || isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;
