'use client'

import { useState } from 'react';
import { searchFitnessContent } from './rag-search';

export default function ExampleSearchComponent() {
  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Use the API function from utils
      const results = await searchFitnessContent(query, contentType, difficultyLevel);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        {/* Your form inputs here */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search query..."
        />
        
        {/* Submit button */}
        <button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {/* Display results */}
      {searchResults.length > 0 && (
        <div>
          <h2>Search Results</h2>
          {searchResults.map((result, index) => (
            <div key={index}>
              <h3>{result.metadata.title}</h3>
              <p>{result.metadata.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 