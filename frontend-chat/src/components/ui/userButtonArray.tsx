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
            className="w-full p-2 border rounded transition-colors duration-150 focus:outline-none"
          />
          <Button
            variant="ghost"
            size="icon"
            className="active:bg-blue-200 hover:scale-105 transition-transform duration-150 active:scale-95"
            onClick={handleEditClick}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="active:bg-blue-200 hover:scale-105 transition-transform duration-150 active:scale-95"
            onClick={handleCancelClick}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="active:bg-blue-200 hover:scale-105 transition-transform duration-150 active:scale-95"
          onClick={handleEditClick}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
