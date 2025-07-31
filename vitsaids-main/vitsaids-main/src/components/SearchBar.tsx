// src/components/SearchBar.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
  onClear: () => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange, onClear, placeholder = "Search..." }) => {
  return (
    <div className="flex items-center space-x-2">
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      {searchTerm && (
        <Button variant="ghost" size="icon" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
      {/* The original AdminDashboard had an "Apply Filters" button; this searchbar handles dynamic search */}
      {/* If you still need a distinct "Search" button that triggers a separate action, you'd add it here. */}
    </div>
  );
};

export default SearchBar;
