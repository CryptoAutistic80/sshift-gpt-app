import React, { useState } from 'react';
import { Button } from './button';
import { Edit2, Check, X } from 'lucide-react';

interface UserButtonArrayProps {
  onEdit: (newContent: string) => void;
  content: string;
}

export function UserButtonArray({ onEdit, content }: UserButtonArrayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleEditClick = () => {
    if (isEditing) {
      onEdit(editedContent);
    }
    setIsEditing(!isEditing);
  };

  const handleCancelClick = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  return (
    <div className="flex justify-start mt-2">
      {isEditing ? (
        <>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <Button
            variant="ghost"
            size="icon"
            className="active:bg-blue-200 hover:bg-blue-100 hover:text-blue-900 transition-colors duration-200"
            onClick={handleEditClick}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="active:bg-blue-200 hover:bg-blue-100 hover:text-blue-900 transition-colors duration-200"
            onClick={handleCancelClick}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="active:bg-blue-200 hover:bg-blue-100 hover:text-blue-900 transition-colors duration-200"
          onClick={handleEditClick}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
