import React, { useState, useEffect } from "react";
import { FiStar, FiUser } from "react-icons/fi";
import { getTaskerReviews, getTaskerStats } from "../../../lib/api/reviews.api";
import { GET } from "../../../lib/utils/fetch.utils";
import { getStoredAuthToken } from "../../../lib/utils/auth.utils";

interface ReviewsSectionProps {
  taskerId: number;
  isViewingOwnProfile?: boolean;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  taskerId,
  isViewingOwnProfile = false,
}) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ [key: number]: any }>({});

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [taskerId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await getTaskerReviews(taskerId);
      // fetch.utils returns: { status, response, message }
      // For reviews: response.response = { reviews: [...] }
      let reviewsData: any[] = [];
      
      if (response?.response?.reviews) {
        reviewsData = response.response.reviews;
      } else if (response?.data?.reviews) {
        reviewsData = response.data.reviews;
      } else if (Array.isArray(response?.response)) {
        reviewsData = response.response;
      } else if (Array.isArray(response?.data)) {
        reviewsData = response.data;
      }

      setReviews(reviewsData);
      
      // Load user data for reviewers
      const userIds = new Set(reviewsData.map((r: any) => r.clientId));
      await loadUsers(Array.from(userIds));
    } catch (error) {
      console.error("Load reviews error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getTaskerStats(taskerId);
      // fetch.utils returns: { status, response, message }
      if (response?.response) {
        setStats(response.response);
      } else if (response?.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Load stats error:", error);
    }
  };

  const loadUsers = async (userIds: number[]) => {
    const token = getStoredAuthToken();
    if (!token) return;

    const usersMap: { [key: number]: any } = { ...users };
    for (const userId of userIds) {
      if (usersMap[userId]) continue;
      try {
        const response = await GET<any>(`/users/${userId}/public`, "", token);
        let userData: any = null;
        if (response?.response) {
          userData = response.response;
        } else if (response?.data) {
          userData = response.data;
        } else if (response?.userId) {
          userData = response;
        }
        if (userData?.userId) {
          usersMap[userId] = {
            userId: userData.userId,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            profilePictureUrl: userData.profilePictureUrl,
          };
        }
      } catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error);
      }
    }
    setUsers(usersMap);
  };

  const getUserName = (userId: number): string => {
    const user = users[userId];
    if (!user) return "Unknown User";
    return `${user.firstName} ${user.lastName}`.trim() || "Unknown User";
  };

  const getUserInitials = (userId: number): string => {
    const user = users[userId];
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <FiStar
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">Loading reviews...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {stats && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.averageRating?.toFixed(1) || "0.0"}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {renderStars(Math.round(stats.averageRating || 0))}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Based on {stats.totalReviews || 0} review{stats.totalReviews !== 1 ? "s" : ""}
              </div>
            </div>
            {stats.ratingDistribution && (
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].reverse().map((rating) => (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-8">{rating}</span>
                    <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${
                            stats.totalReviews > 0
                              ? (stats.ratingDistribution[rating] / stats.totalReviews) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-gray-600 w-8 text-right">
                      {stats.ratingDistribution[rating] || 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FiStar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => {
            const reviewer = users[review.clientId];
            return (
              <div key={review.reviewId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    {reviewer?.profilePictureUrl ? (
                      <img
                        src={reviewer.profilePictureUrl}
                        alt={getUserName(review.clientId)}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-600 font-semibold text-sm">
                        {getUserInitials(review.clientId)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {getUserName(review.clientId)}
                      </h4>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700">{review.comment}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;

