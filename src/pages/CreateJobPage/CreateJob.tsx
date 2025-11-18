import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { createJob } from "../../lib/api/jobs.api";
import { getAllSkills } from "../../lib/api/skills.api";
import { getAllExpertise } from "../../lib/api/expertise.api";
import { getStoredAuthToken, getAuthenticatedUserFromToken } from "../../lib/utils/auth.utils";

const CreateJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    city: "",
    province: "",
    requiredSkills: [] as string[],
    requiredExpertise: [] as string[],
    deadline: "",
    jobType: "one-time",
    estimatedHours: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [expertiseInput, setExpertiseInput] = useState("");
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [allExpertise, setAllExpertise] = useState<string[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [expertiseSuggestions, setExpertiseSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showExpertiseSuggestions, setShowExpertiseSuggestions] = useState(false);
  const skillsInputRef = useRef<HTMLInputElement>(null);
  const expertiseInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const expertiseSuggestionsRef = useRef<HTMLDivElement>(null);

  const user = getAuthenticatedUserFromToken<{ role: string }>();

  useEffect(() => {
    const loadSkills = async () => {
      try {
        // GET from fetch.utils returns: { status, response, message }
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
    
    const loadExpertise = async () => {
      try {
        const response = await getAllExpertise();
        let expertiseData: string[] = [];
        if (response?.response?.expertise && Array.isArray(response.response.expertise)) {
          expertiseData = response.response.expertise;
        } else if (Array.isArray(response?.response)) {
          expertiseData = response.response;
        } else if (Array.isArray(response?.expertise)) {
          expertiseData = response.expertise;
        }
        setAllExpertise(expertiseData);
      } catch (error) {
        console.error("Load expertise error:", error);
      }
    };
    
    loadSkills();
    loadExpertise();
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
      if (
        expertiseSuggestionsRef.current &&
        !expertiseSuggestionsRef.current.contains(event.target as Node) &&
        expertiseInputRef.current &&
        !expertiseInputRef.current.contains(event.target as Node)
      ) {
        setShowExpertiseSuggestions(false);
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
          <p className="text-gray-600">Only customers can create jobs.</p>
        </div>
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

  const handleExpertiseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExpertiseInput(value);
    
    if (value.trim().length > 0) {
      const filtered = allExpertise.filter((exp) =>
        exp.toLowerCase().includes(value.toLowerCase()) &&
        !formData.requiredExpertise.includes(exp)
      );
      setExpertiseSuggestions(filtered.slice(0, 5));
      setShowExpertiseSuggestions(filtered.length > 0);
    } else {
      setExpertiseSuggestions([]);
      setShowExpertiseSuggestions(false);
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

  const handleAddExpertise = () => {
    const trimmedExpertise = expertiseInput.trim();
    if (trimmedExpertise && !formData.requiredExpertise.includes(trimmedExpertise)) {
      setFormData((prev) => ({
        ...prev,
        requiredExpertise: [...prev.requiredExpertise, trimmedExpertise],
      }));
      setExpertiseInput("");
      setShowExpertiseSuggestions(false);
      setExpertiseSuggestions([]);
    }
  };

  const handleRemoveExpertise = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requiredExpertise: prev.requiredExpertise.filter((_, i) => i !== index),
    }));
  };

  const handleExpertiseSuggestionClick = (expertise: string) => {
    if (!formData.requiredExpertise.includes(expertise)) {
      setFormData((prev) => ({
        ...prev,
        requiredExpertise: [...prev.requiredExpertise, expertise],
      }));
      setExpertiseInput("");
      setShowExpertiseSuggestions(false);
      setExpertiseSuggestions([]);
      if (expertiseInputRef.current) {
        expertiseInputRef.current.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      if (formData.requiredExpertise && formData.requiredExpertise.length > 0) {
        // Send as comma-separated string (backend expects string, not array)
        payload.requiredExpertise = formData.requiredExpertise.join(", ");
      }
      if (formData.deadline) payload.deadline = formData.deadline;
      if (formData.estimatedHours) payload.estimatedHours = Number(formData.estimatedHours);

      const response = await createJob(payload);
      
      // Backend returns: { status: 201, response: { jobId, ... }, message: '...' }
      let jobId: number | null = null;
      if (response.data?.statusCode === 201 || response.status === 201) {
        // Try different response structures
        jobId = response.data?.response?.jobId || 
                response.data?.data?.jobId || 
                response.data?.jobId ||
                response.data?.response?.job?.jobId;
      }
      
      if (jobId) {
        navigate(`/jobs/${jobId}`);
      } else {
        console.error("Could not extract jobId from response:", response.data);
        alert("Job created but could not redirect. Please check your jobs list.");
      }
    } catch (error: any) {
      console.error("Create job error:", error);
      alert(error.response?.data?.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-4 sm:py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Create New Job</h1>

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
                  City/Municipality
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

            {/* Required Expertise */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Expertise
              </label>
              <div className="flex gap-2">
                <input
                  ref={expertiseInputRef}
                  type="text"
                  value={expertiseInput}
                  onChange={handleExpertiseInputChange}
                  onFocus={() => {
                    if (expertiseSuggestions.length > 0) setShowExpertiseSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddExpertise();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Construction, Plumbing, Electrical"
                />
                <button
                  type="button"
                  onClick={handleAddExpertise}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Add
                </button>
              </div>
              {showExpertiseSuggestions && expertiseSuggestions.length > 0 && (
                <div
                  ref={expertiseSuggestionsRef}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  {expertiseSuggestions.map((expertise, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleExpertiseSuggestionClick(expertise)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition"
                    >
                      {expertise}
                    </button>
                  ))}
                </div>
              )}
              {formData.requiredExpertise.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.requiredExpertise.map((expertise, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"
                    >
                      {expertise}
                      <button
                        type="button"
                        onClick={() => handleRemoveExpertise(index)}
                        className="ml-1 rounded-full p-0.5 hover:bg-green-200"
                        aria-label={`Remove ${expertise}`}
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1 text-sm text-gray-500">
                The field or area of expertise required for this job
              </p>
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Plumbing, Electrical, Carpentry"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
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
              {formData.requiredSkills.length > 0 && (
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
                        className="ml-1 rounded-full p-0.5 hover:bg-blue-200"
                        aria-label={`Remove ${skill}`}
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Add skills one at a time using the Add button or press Enter
              </p>
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
                {loading ? "Creating..." : "Create Job"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/jobs")}
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

export default CreateJob;

