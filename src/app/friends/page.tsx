'use client';

import { useState } from 'react';
import { useFriends } from '@/hooks/use-friends';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, UserCheck, UserX, Users, Clock, Send } from 'lucide-react';
import Link from 'next/link';

export default function FriendsPage() {
  const { t } = useLanguage();
  const {
    friends,
    pendingRequests,
    sentRequests,
    searchResults,
    isLoading,
    isSearching,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    clearSearch
  } = useFriends();

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      searchUsers(query);
    } else {
      clearSearch();
    }
  };

  const getDisplayName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.firstName || user.lastName || 'Unknown User';
  };

  const getInitials = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    const name = user.username || user.firstName || user.lastName || 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const renderUserCard = (user: any, actions?: React.ReactNode) => (
    <Card key={user.id} className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.profilePicture || ''} alt={getDisplayName(user)} />
            <AvatarFallback>{getInitials(user)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{getDisplayName(user)}</h3>
            {user.username && (
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      </div>
    </Card>
  );

  const renderSearchResult = (user: any) => {
    let actionButton = null;
    
    switch (user.friendshipStatus) {
      case 'none':
        actionButton = (
          <Button
            size="sm"
            onClick={() => sendFriendRequest(user.id)}
            className="flex items-center space-x-1"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Friend</span>
          </Button>
        );
        break;
      case 'sent':
        actionButton = (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Send className="h-3 w-3" />
            <span>Request Sent</span>
          </Badge>
        );
        break;
      case 'received':
        actionButton = (
          <div className="flex space-x-1">
            <Button
              size="sm"
              onClick={() => acceptFriendRequest(user.friendshipId!)}
              className="flex items-center space-x-1"
            >
              <UserCheck className="h-4 w-4" />
              <span>Accept</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => rejectFriendRequest(user.friendshipId!)}
            >
              <UserX className="h-4 w-4" />
            </Button>
          </div>
        );
        break;
      case 'accepted':
        actionButton = (
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>Friends</span>
            </Badge>
            <Link href={`/friends/${user.id}`}>
              <Button size="sm" variant="outline">
                View Profile
              </Button>
            </Link>
          </div>
        );
        break;
    }

    return renderUserCard(user, actionButton);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Friends</h1>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{friends.length} friends</span>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Find Friends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search by username, name, or user ID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
            
            {isSearching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Searching...</p>
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Search Results</h3>
                {searchResults.map(renderSearchResult)}
              </div>
            )}
            
            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Friends Management Tabs */}
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Friends ({friends.length})</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Requests ({pendingRequests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span>Sent ({sentRequests.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading friends...</p>
            </div>
          ) : friends.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No friends yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by searching for users above to send friend requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) =>
                renderUserCard(friend, (
                  <div className="flex items-center space-x-2">
                    <Link href={`/friends/${friend.id}`}>
                      <Button size="sm" variant="outline">
                        View Profile
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeFriend(friend.friendshipId)}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No pending requests</h3>
                <p className="text-muted-foreground">
                  You don't have any pending friend requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) =>
                renderUserCard(request.user, (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => acceptFriendRequest(request.id)}
                      className="flex items-center space-x-1"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Accept</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectFriendRequest(request.id)}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No sent requests</h3>
                <p className="text-muted-foreground">
                  You haven't sent any friend requests yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sentRequests.map((request) =>
                renderUserCard(request.user, (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Pending</span>
                  </Badge>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}