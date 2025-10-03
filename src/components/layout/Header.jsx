import React from 'react';
import { Zap, Download, RotateCcw, LogOut, User } from 'lucide-react';
import { Button } from '../ui';
import { useAuth } from '../../auth/AuthContext';

export default function Header({ onSave, onReset, hasResults }) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-primary border-b border-primary/20 px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Logo removed from header */}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Action Buttons */}
          {hasResults && (
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                className="text-white border-white/30 hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Salva Piano
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="text-white border-white/30 hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Dati
              </Button>
            </div>
          )}

          {/* User Info and Logout */}
          {user && (
            <div className="flex items-center space-x-3 pl-4 border-l border-white/20">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-white text-sm font-medium">
                    {user.email}
                  </div>
                  <div className="text-white/70 text-xs">
                    Utente connesso
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="text-white border-white/30 hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Esci
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

