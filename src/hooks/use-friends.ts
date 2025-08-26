'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePicture?: string | null;
}

interface Friend extends User {
  friendshipId: string;
  friendsSince: string;
}

interface FriendRequest {
  id: string;
  user: User;
  createdAt: string;
}

interface SearchResult extends User {
  friendshipStatus: 'none' | 'sent' | 'received' | 'accepted' | 'rejected' | 'blocked';
  friendshipId: string | null;
}

interface FriendsData {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
}

export function useFriends() {
  const { data: session } = useSession();
  const [friendsData, setFriendsData] = useState<FriendsData>({
    friends: [],
    pendingRequests: [],
    sentRequests: []
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch friends data
  const fetchFriends = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/friends');
      if (!response.ok) {
        throw new Error('Failed to fetch friends');
      }

      const data = await response.json();
      setFriendsData(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Failed to load friends');
      toast.error('Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  };

  // Search users
  const searchUsers = async (query: string) => {
    if (!session?.user?.id || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Send friend request
  const sendFriendRequest = async (userId: string) => {
    if (!session?.user?.id) return false;

    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send friend request');
      }

      const data = await response.json();
      toast.success('Friend request sent successfully');
      
      // Update search results to reflect the new status
      setSearchResults(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, friendshipStatus: 'sent', friendshipId: data.friendship.id }
          : user
      ));
      
      // Refresh friends data
      await fetchFriends();
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send friend request');
      return false;
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (friendshipId: string) => {
    if (!session?.user?.id) return false;

    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'accept' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept friend request');
      }

      toast.success('Friend request accepted');
      await fetchFriends();
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept friend request');
      return false;
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (friendshipId: string) => {
    if (!session?.user?.id) return false;

    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'reject' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject friend request');
      }

      toast.success('Friend request rejected');
      await fetchFriends();
      return true;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject friend request');
      return false;
    }
  };

  // Remove friend
  const removeFriend = async (friendshipId: string) => {
    if (!session?.user?.id) return false;

    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'remove' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove friend');
      }

      toast.success('Friend removed successfully');
      await fetchFriends();
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove friend');
      return false;
    }
  };

  // Clear search results
  const clearSearch = () => {
    setSearchResults([]);
  };

  // Load friends data on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchFriends();
    }
  }, [session?.user?.id]);

  return {
    // Data
    friends: friendsData.friends,
    pendingRequests: friendsData.pendingRequests,
    sentRequests: friendsData.sentRequests,
    searchResults,
    
    // States
    isLoading,
    isSearching,
    error,
    
    // Actions
    fetchFriends,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    clearSearch
  };
}