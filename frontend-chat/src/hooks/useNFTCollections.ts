import { useEffect, useState } from 'react';
import { INFTCollection } from '@helpers';
import { useAuth } from '../../src/context/AuthProvider';

/**
 * React hook for UI components to fetch and display NFT collections
 * This is separate from the API route that the AI uses
 */
export const useNFTCollections = () => {
  const { walletAddress } = useAuth();
  const [collections, setCollections] = useState<INFTCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!walletAddress) {
        setCollections([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/tools/fetchUserNFTCollections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || 'Failed to fetch NFT collections'
          );
        }

        const { data } = await response.json();
        setCollections(data);
      } catch (err) {
        console.error('Error fetching NFT collections:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch NFT collections'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [walletAddress]);

  return { collections, loading, error };
};
