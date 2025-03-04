import { FC } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";

export const ConfirmButton: FC<{
  title: string;
  variant?:
    | "link"
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "green"
    | "ghost"
    | "icon"
    | null
    | undefined;
  disabled?: boolean;
  onSubmit: () => void;
  confirmMessage: React.ReactNode;
}> = ({ onSubmit, disabled, title, confirmMessage, variant }) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          style={{
            color: "yellow",
            fontSize: 14,
            fontWeight: "bold",
          }}
          variant={variant}
          disabled={disabled}
        >
          {title}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="danger-text">Confirm</AlertDialogTitle>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            {confirmMessage}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="danger">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onSubmit}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
