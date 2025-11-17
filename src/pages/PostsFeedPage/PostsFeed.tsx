import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPosts } from "../../lib/api/posts.api";
import { getStoredAuthToken } from "../../lib/utils/auth.utils";
import { GET } from "../../lib/utils/fetch.utils";
import CreatePost from "../../components/CreatePost";
import PostCard from "../../components/PostCard";

type Post = {
  postId: number;
  userId: number;
  content: string;
  images?: string[];
  videos?: string[];
  likes: number;
  comments: number;
  shares: number;
  visibility: string;
  createdAt: string;
};

type User = {
  userId: number;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  isLegit?: boolean;
};

const PostsFeed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<{ [key: number]: User }>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    loadPosts();
  }, [navigate]);

  const loadPosts = async (pageNum = 0) => {
    const token = getStoredAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const response = await getPosts({
        limit: 10,
        skip: pageNum * 10,
        // Remove visibility filter to get all posts, or try without it
      });

      console.log("Posts API Response:", response?.data);

      // Backend returns: { status, response: { posts, total, limit, skip }, message }
      // Try different response structures
      let postsData: any[] = [];
      
      if (response?.data) {
        // Structure 1: { status, response: { posts, ... }, message }
        if (response.data.response?.posts) {
          postsData = response.data.response.posts;
        }
        // Structure 2: { data: { posts, ... } }
        else if (response.data.data?.posts) {
          postsData = response.data.data.posts;
        }
        // Structure 3: { posts, ... } directly
        else if (response.data.posts) {
          postsData = response.data.posts;
        }
        // Structure 4: Array directly
        else if (Array.isArray(response.data.response)) {
          postsData = response.data.response;
        }
        else if (Array.isArray(response.data.data)) {
          postsData = response.data.data;
        }
        else if (Array.isArray(response.data)) {
          postsData = response.data;
        }
      }
      
      console.log("Extracted posts:", postsData);
      const newPosts = Array.isArray(postsData) ? postsData : [];

      if (pageNum === 0) {
        setPosts(newPosts);
      } else {
        setPosts([...posts, ...newPosts]);
      }

      setHasMore(newPosts.length === 10);

      // Fetch user data for all posts
      const userIds = [...new Set(newPosts.map((post: Post) => post.userId).filter(Boolean))];
      console.log("User IDs to load:", userIds);
      if (userIds.length > 0) {
        await loadUsers(userIds);
      }
    } catch (error: any) {
      console.error("Load posts error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (userIds: number[]) => {
    if (userIds.length === 0) return;
    
    const token = getStoredAuthToken();
    if (!token) return;

    const usersMap: { [key: number]: User } = { ...users };

    for (const userId of userIds) {
      if (usersMap[userId]) continue; // Already loaded

      try {
        // Use public endpoint for basic user info
        const response = await GET<any>(`/users/${userId}/public`, "", token);
        console.log(`User ${userId} API Response:`, response);
        
        // GET() returns response.data from axios, which is: { status: 200, response: userData, message: '...' }
        // So the user data is in response.response
        let userData: any = null;
        
        // Structure 1: { status: 200, response: {...}, message: '...' } - This is the main structure
        if (response?.response && typeof response.response === 'object' && response.response.userId) {
          userData = response.response;
        }
        // Structure 2: { data: {...} } - Alternative structure
        else if (response?.data && typeof response.data === 'object' && response.data.userId) {
          userData = response.data;
        }
        // Structure 3: Direct user object (if backend returns user directly)
        else if (response?.userId) {
          userData = response;
        }
          
        if (userData && userData.userId) {
          usersMap[userId] = {
            userId: userData.userId,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            profilePictureUrl: userData.profilePictureUrl,
            isLegit: userData.isLegit,
          };
          console.log(`✅ Loaded user ${userId}:`, usersMap[userId]);
        } else {
          console.warn(`❌ Failed to extract user data for ${userId}`);
          console.warn(`Response:`, response);
          console.warn(`Response.response:`, response?.response);
          console.warn(`Response.data:`, response?.data);
        }
      } catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error);
      }
    }

    setUsers(usersMap);
  };

  const handlePostCreated = () => {
    loadPosts(0); // Reload from beginning
  };

  const handlePostDeleted = (postId: number) => {
    setPosts(posts.filter((p) => p.postId !== postId));
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-4 sm:py-8">
      <div className="w-full max-w-full sm:max-w-none mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Create Post */}
        <CreatePost onPostCreated={handlePostCreated} />

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <p className="text-gray-500 text-base sm:text-lg mb-4">No posts yet</p>
            <p className="text-gray-400 text-sm">
              Be the first to share something!
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.postId}
                post={post}
                author={users[post.userId]}
                onPostDeleted={() => handlePostDeleted(post.postId)}
              />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-4 sm:mt-6">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PostsFeed;

