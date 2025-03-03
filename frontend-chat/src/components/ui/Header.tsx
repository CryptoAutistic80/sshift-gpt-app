'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

export function IndexHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="w-full max-w-4xl mx-auto flex justify-center space-x-8 py-6">
        <Dialog>
          <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium">
            About SShift
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>About SShift</DialogTitle>
            </DialogHeader>
            <div className="text-gray-600">
              Content coming soon...
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium">
            How to Use
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>How to Use</DialogTitle>
            </DialogHeader>
            <div className="text-gray-600">
              Content coming soon...
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium">
            Custom Tools
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Custom Tools</DialogTitle>
            </DialogHeader>
            <div className="text-gray-600">
              Content coming soon...
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium">
            Contact Us
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Contact Us</DialogTitle>
            </DialogHeader>
            <div className="text-gray-600">
              Content coming soon...
            </div>
          </DialogContent>
        </Dialog>
      </nav>
    </header>
  );
} 