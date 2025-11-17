import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getJob, updateJob } from "../../lib/api/jobs.api";
import { getAllSkills } from "../../lib/api/skills.api";
import { getStoredAuthToken, getAuthenticatedUserFromToken } from "../../lib/utils/auth.utils";

const EditJob = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    city: "",
    province: "",
    requiredSkills: [] as string[],
    deadline: "",
    jobType: "one-time",
    estimatedHours: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const skillsInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const user = getAuthenticatedUserFromToken<{ role: string }>();

  useEffect(() => {
    const loadJob = async () => {
      if (!jobId) return;
      
      const token = getStoredAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setFetching(true);
        const response = await getJob(Number(jobId));
        
        // Extract job data from various response structures
        let jobData: any = null;
        if (response?.data) {
          if (response.data.response && typeof response.data.response === 'object') {
            jobData = response.data.response;
          } else if (response.data.data && typeof response.data.data === 'object') {
            jobData = response.data.data;
          } else if (typeof response.data === 'object' && response.data.jobId) {
            jobData = response.data;
          }
        }

        if (jobData && jobData.jobId) {
          // Check if user is the owner
          const authUser = getAuthenticatedUserFromToken<{ userId: number }>();
          if (jobData.customerId !== authUser?.userId && user?.role !== "admin") {
            alert("You don't have permission to edit this job");
            navigate(`/jobs/${jobId}`);
            return;
          }

          // Populate form
          setFormData({
            title: jobData.title || "",
            description: jobData.description || "",
            budget: jobData.budget?.toString() || "",
            city: jobData.city || "",
            province: jobData.province || "",
            requiredSkills: Array.isArray(jobData.requiredSkills) 
              ? jobData.requiredSkills 
              : (jobData.requiredSkills ? jobData.requiredSkills.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0) : []),
            deadline: jobData.deadline 
              ? new Date(jobData.deadline).toISOString().split("T")[0] 
              : "",
            jobType: jobData.jobType || "one-time",
            estimatedHours: jobData.estimatedHours?.toString() || "",
          });
        } else {
          alert("Job not found");
          navigate("/jobs");
        }
      } catch (error: any) {
        console.error("Load job error:", error);
        alert(error.response?.data?.message || "Failed to load job");
        navigate("/jobs");
      } finally {
        setFetching(false);
      }
    };

    loadJob();
  }, [jobId, navigate, user?.role]);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await getAllSkills();
        let skillsData: string[] = [];
        if (response?.response?.skills && Array.isArray(response.response.skills)) {
          skillsData = response.response.skills;
        } else if (Array.isArray(response?.response)) {
          skillsData = response.response;
        } else if (Array.isArray(response?.skills)) {
          skillsData = response.skills;
        }
        setAllSkills(skillsData);
      } catch (error) {
        console.error("Load skills error:", error);
      }
    };
    loadSkills();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        skillsInputRef.current &&
        !skillsInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if user is customer
  if (user?.role !== "customer" && user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-200 via-white to-blue-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only customers can edit jobs.</p>
        </div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-200 via-white to-blue-200">
        <div className="text-lg">Loading job details...</div>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSkillInput(value);
    
    if (value.trim().length > 0) {
      const filtered = allSkills.filter((skill) =>
        skill.toLowerCase().includes(value.toLowerCase()) &&
        !formData.requiredSkills.includes(skill)
      );
      setSkillSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setSkillSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleAddSkill = () => {
    const trimmedSkill = skillInput.trim();
    if (trimmedSkill && !formData.requiredSkills.includes(trimmedSkill)) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, trimmedSkill],
      }));
      setSkillInput("");
      setShowSuggestions(false);
      setSkillSuggestions([]);
    }
  };

  const handleRemoveSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index),
    }));
  };

  const handleSkillSuggestionClick = (skill: string) => {
    if (!formData.requiredSkills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skill],
      }));
      setSkillInput("");
      setShowSuggestions(false);
      setSkillSuggestions([]);
      if (skillsInputRef.current) {
        skillsInputRef.current.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobId) return;
    
    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      
      const payload: any = {
        title: formData.title,
        description: formData.description,
        budget: Number(formData.budget),
        jobType: formData.jobType,
      };

      if (formData.city) payload.city = formData.city;
      if (formData.province) payload.province = formData.province;
      if (formData.requiredSkills && formData.requiredSkills.length > 0) {
        payload.requiredSkills = formData.requiredSkills;
      }
      if (formData.deadline) payload.deadline = formData.deadline;
      if (formData.estimatedHours) payload.estimatedHours = Number(formData.estimatedHours);

      await updateJob(Number(jobId), payload);
      alert("Job updated successfully!");
      navigate(`/jobs/${jobId}`);
    } catch (error: any) {
      console.error("Update job error:", error);
      alert(error.response?.data?.message || "Failed to update job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-4 sm:py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Edit Job</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Need a plumber for bathroom repair"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                required
                rows={6}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the job in detail..."
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget (PHP) *
              </label>
              <input
                type="number"
                name="budget"
                required
                min="0"
                value={formData.budget}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5000"
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Manila"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province
                </label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Metro Manila"
                />
              </div>
            </div>

            {/* Required Skills */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills
              </label>
              <div className="flex gap-2">
                <input
                  ref={skillsInputRef}
                  type="text"
                  value={skillInput}
                  onChange={handleSkillInputChange}
                  onFocus={() => {
                    if (skillSuggestions.length > 0) setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Add a skill (press Enter)"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              {showSuggestions && skillSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  {skillSuggestions.map((skill, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSkillSuggestionClick(skill)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
              {formData.requiredSkills && formData.requiredSkills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.requiredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(index)}
                        className="ml-1 text-blue-700 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Job Type & Estimated Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="one-time">One-time</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  name="estimatedHours"
                  min="1"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8"
                />
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {loading ? "Updating..." : "Update Job"}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/jobs/${jobId}`)}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditJob;

