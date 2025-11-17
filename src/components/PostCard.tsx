import { useState, useEffect } from "react";
import { FiHeart, FiMessageCircle, FiShare2, FiMoreVertical, FiEdit, FiTrash2, FiCheckCircle } from "react-icons/fi";
import { Link } from "react-router-dom";
import { getPostComments, createComment, deleteComment } from "../lib/api/comments.api";
import { createReaction, checkUserReaction, getTargetReactions } from "../lib/api/reactions.api";
import { deletePost } from "../lib/api/posts.api";
import { getAuthenticatedUserFromToken } from "../lib/utils/auth.utils";
import { GET } from "../lib/utils/fetch.utils";
import { getStoredAuthToken } from "../lib/utils/auth.utils";

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

type Comment = {
  commentId: number;
  postId: number;
  userId: number;
  content: string;
  likes: number;
  createdAt: string;
  replies?: Comment[];
};

type PostCardProps = {
  post: Post;
  author?: {
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    isLegit?: boolean;
  };
  onPostDeleted?: () => void;
  onPostUpdated?: () => void;
};

type CommentUser = {
  userId: number;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  isLegit?: boolean;
};

const PostCard = ({ post, author, onPostDeleted, onPostUpdated }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [userReaction, setUserReaction] = useState<any>(null);
  const [reactions, setReactions] = useState<any>({});
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentUsers, setCommentUsers] = useState<{ [key: number]: CommentUser }>({});

  const user = getAuthenticatedUserFromToken<{ userId: number }>();
  const isOwner = user?.userId === post.userId;

  useEffect(() => {
    checkReaction();
    if (showComments) {
      loadComments();
    }
  }, [showComments, post.postId]);

  const checkReaction = async () => {
    try {
      const response = await checkUserReaction("post", post.postId);
      // Extract reaction from various response structures
      let reaction = null;
      if (response?.data) {
        if (response.data.data?.reaction) {
          reaction = response.data.data.reaction;
        } else if (response.data.response?.reaction) {
          reaction = response.data.response.reaction;
        } else if (response.data.reaction) {
          reaction = response.data.reaction;
        } else if (response.data.data && typeof response.data.data === 'object' && response.data.data.reactionId) {
          reaction = response.data.data;
        }
      }
      setUserReaction(reaction);
    } catch (error) {
      console.error("Check reaction error:", error);
      setUserReaction(null);
    }
  };

  const loadReactions = async () => {
    try {
      const response = await getTargetReactions("post", post.postId);
      setReactions(response.data?.data || {});
    } catch (error) {
      console.error("Load reactions error:", error);
    }
  };

  const loadCommentUsers = async (userIds: number[]) => {
    if (userIds.length === 0) return;
    
    const token = getStoredAuthToken();
    if (!token) return;

    const usersMap: { [key: number]: CommentUser } = { ...commentUsers };

    for (const userId of userIds) {
      if (usersMap[userId]) continue; // Already loaded

      try {
        const response = await GET<any>(`/users/${userId}/public`, "", token);
        
        // GET() returns response.data from axios, which is: { status: 200, response: userData, message: '...' }
        let userData: any = null;
        
        if (response?.response && typeof response.response === 'object' && response.response.userId) {
          userData = response.response;
        } else if (response?.data && typeof response.data === 'object' && response.data.userId) {
          userData = response.data;
        } else if (response?.userId) {
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
        }
      } catch (error) {
        console.error(`Failed to fetch comment user ${userId}:`, error);
      }
    }

    setCommentUsers(usersMap);
  };

  const loadComments = async () => {
    try {
      const response = await getPostComments(post.postId);
      console.log("Comments API Response:", response?.data);
      
      // Try different response structures
      let commentsData: any[] = [];
      if (response?.data) {
        // Structure 1: { status, response: { data: [...] }, message }
        if (response.data.response) {
          commentsData = Array.isArray(response.data.response) 
            ? response.data.response 
            : response.data.response.data || [];
        }
        // Structure 2: { data: [...] }
        else if (response.data.data) {
          commentsData = Array.isArray(response.data.data) 
            ? response.data.data 
            : [];
        }
        // Structure 3: Array directly
        else if (Array.isArray(response.data)) {
          commentsData = response.data;
        }
      }
      
      console.log("Extracted comments:", commentsData);
      const commentsArray = Array.isArray(commentsData) ? commentsData : [];
      setComments(commentsArray);

      // Fetch user data for all comment authors (including replies)
      const userIds: number[] = [];
      commentsArray.forEach((comment: any) => {
        if (comment.userId) userIds.push(comment.userId);
        if (comment.replies && Array.isArray(comment.replies)) {
          comment.replies.forEach((reply: any) => {
            if (reply.userId) userIds.push(reply.userId);
          });
        }
      });
      
      const uniqueUserIds = [...new Set(userIds)];
      if (uniqueUserIds.length > 0) {
        await loadCommentUsers(uniqueUserIds);
      }
    } catch (error) {
      console.error("Load comments error:", error);
    }
  };

  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liking) return; // Prevent spam
    
    setLiking(true);
    try {
      const response = await createReaction({
        targetType: "post",
        targetId: post.postId,
        reactionType: "like",
      });

      // Extract response data
      let responseData: any = null;
      if (response?.data) {
        if (response.data.data) {
          responseData = response.data.data;
        } else if (response.data.response) {
          responseData = response.data.response;
        } else {
          responseData = response.data;
        }
      }

      if (responseData?.removed) {
        // Reaction was removed (unliked)
        setUserReaction(null);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else if (responseData?.reactionId) {
        // Reaction was created/updated
        setUserReaction(responseData);
        // Only increment if we didn't already have a reaction
        if (!userReaction) {
          setLikesCount((prev) => prev + 1);
        }
      }
      
      // Always refresh to get accurate state
      await checkReaction();
      loadReactions();
    } catch (error) {
      console.error("Like error:", error);
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setPostingComment(true);
    try {
      console.log("Posting comment on post:", post.postId, "Content:", commentText.trim());
      const response = await createComment({
        postId: post.postId,
        content: commentText.trim(),
      });
      console.log("Comment created successfully:", response?.data);
      setCommentText("");
      setCommentsCount((prev) => prev + 1);
      
      // Reload comments to get the new comment with user data
      await loadComments();
    } catch (error: any) {
      console.error("Comment error:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        "Failed to post comment";
      alert(errorMessage);
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setDeleting(true);
    try {
      await deletePost(post.postId);
      if (onPostDeleted) {
        onPostDeleted();
      }
    } catch (error: any) {
      console.error("Delete post error:", error);
      alert(error.response?.data?.message || "Failed to delete post");
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      setCommentsCount((prev) => Math.max(0, prev - 1));
      loadComments();
    } catch (error) {
      console.error("Delete comment error:", error);
    }
  };

  const authorName = author
    ? `${author.firstName} ${author.lastName}`
    : "Unknown User";

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden shrink-0">
            {author?.profilePictureUrl ? (
              <img
                src={author.profilePictureUrl}
                alt={authorName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-blue-700 font-semibold text-sm sm:text-base">
                {authorName.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              to={`/users/${post.userId}`}
              className="font-semibold text-gray-900 hover:underline text-sm sm:text-base inline-flex items-center gap-1.5"
            >
              <span className="truncate">{authorName}</span>
              {author?.isLegit && (
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white shrink-0"
                  title="Verified User"
                >
                  <FiCheckCircle className="w-3 h-3" />
                </span>
              )}
            </Link>
            <div className="text-xs sm:text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <FiMoreVertical />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={handleDeletePost}
                  disabled={deleting}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <FiTrash2 />
                  {deleting ? "Deleting..." : "Delete Post"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-3 sm:mb-4">
        <p className="text-gray-900 whitespace-pre-wrap text-sm sm:text-base">{post.content}</p>
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className={`grid gap-2 mb-3 sm:mb-4 ${
          post.images.length === 1 ? "grid-cols-1" :
          post.images.length === 2 ? "grid-cols-2" :
          "grid-cols-2"
        }`}>
          {post.images.slice(0, 4).map((url, index) => (
            <div key={index} className="relative w-full overflow-hidden rounded-lg bg-gray-100">
              <img
                src={url}
                alt={`Post image ${index + 1}`}
                className="w-full h-auto max-h-96 object-contain rounded-lg"
                style={{ maxWidth: '100%' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 sm:gap-4">
          {likesCount > 0 && (
            <span>{likesCount} like{likesCount !== 1 ? "s" : ""}</span>
          )}
          {commentsCount > 0 && (
            <span>{commentsCount} comment{commentsCount !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-4 pb-3 sm:pb-4 border-b border-gray-200">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm disabled:opacity-50 ${
            userReaction
              ? "text-blue-600 bg-blue-50"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FiHeart className={userReaction ? "fill-current" : ""} />
          <span className="hidden sm:inline">{userReaction ? "Liked" : "Like"}</span>
        </button>
        <button
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments) {
              loadComments();
            }
          }}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition text-xs sm:text-sm"
        >
          <FiMessageCircle />
          <span className="hidden sm:inline">Comment</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
          {/* Comment Input */}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
            <button
              type="submit"
              disabled={postingComment || !commentText.trim()}
              className="bg-blue-600 text-white px-3 sm:px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm sm:text-base"
            >
              {postingComment ? "Posting..." : "Post"}
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-2 sm:space-y-3">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-xs sm:text-sm text-center py-3 sm:py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment: any) => {
                const commentAuthor = commentUsers[comment.userId];
                const authorName = commentAuthor
                  ? `${commentAuthor.firstName} ${commentAuthor.lastName}`
                  : "Unknown User";
                const authorInitials = commentAuthor
                  ? `${commentAuthor.firstName?.charAt(0) || ""}${commentAuthor.lastName?.charAt(0) || ""}`.toUpperCase()
                  : "U";

                return (
                  <div key={comment.commentId} className="flex items-start gap-2 sm:gap-3">
                    <Link
                      to={`/users/${comment.userId}`}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-200 flex items-center justify-center shrink-0 overflow-hidden"
                    >
                      {commentAuthor?.profilePictureUrl ? (
                        <img
                          src={commentAuthor.profilePictureUrl}
                          alt={authorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-blue-700 font-semibold">{authorInitials}</span>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                        <Link
                          to={`/users/${comment.userId}`}
                          className="font-semibold text-gray-900 hover:underline text-xs sm:text-sm mb-1 inline-block"
                        >
                          {authorName}
                          {commentAuthor?.isLegit && (
                            <span
                              className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-blue-600 text-white ml-1"
                              title="Verified User"
                            >
                              <FiCheckCircle className="w-2 h-2" />
                            </span>
                          )}
                        </Link>
                        <p className="text-xs sm:text-sm text-gray-900 break-words">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 mt-1 text-xs text-gray-500">
                        <span>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                        {comment.userId === user?.userId && (
                          <button
                            onClick={() => handleDeleteComment(comment.commentId)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-2 sm:ml-4 mt-2 space-y-2">
                        {comment.replies.map((reply: Comment) => {
                          const replyAuthor = commentUsers[reply.userId];
                          const replyAuthorName = replyAuthor
                            ? `${replyAuthor.firstName} ${replyAuthor.lastName}`
                            : "Unknown User";
                          const replyAuthorInitials = replyAuthor
                            ? `${replyAuthor.firstName?.charAt(0) || ""}${replyAuthor.lastName?.charAt(0) || ""}`.toUpperCase()
                            : "U";

                          return (
                            <div key={reply.commentId} className="flex items-start gap-2">
                              <Link
                                to={`/users/${reply.userId}`}
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-200 flex items-center justify-center shrink-0 overflow-hidden"
                              >
                                {replyAuthor?.profilePictureUrl ? (
                                  <img
                                    src={replyAuthor.profilePictureUrl}
                                    alt={replyAuthorName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] text-blue-700 font-semibold">{replyAuthorInitials}</span>
                                )}
                              </Link>
                              <div className="flex-1 min-w-0">
                                <div className="bg-gray-50 rounded-lg p-1.5 sm:p-2">
                                  <Link
                                    to={`/users/${reply.userId}`}
                                    className="font-semibold text-gray-900 hover:underline text-xs mb-1 inline-block"
                                  >
                                    {replyAuthorName}
                                    {replyAuthor?.isLegit && (
                                      <span
                                        className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-blue-600 text-white ml-1"
                                        title="Verified User"
                                      >
                                        <FiCheckCircle className="w-1.5 h-1.5" />
                                      </span>
                                    )}
                                  </Link>
                                  <p className="text-xs sm:text-sm text-gray-900 break-words">{reply.content}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;

