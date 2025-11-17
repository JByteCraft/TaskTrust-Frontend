import React, { useState } from "react";
import { FiFileText, FiDownload, FiLoader } from "react-icons/fi";
import { generateResume } from "../../../lib/api/resume.api";
import jsPDF from "jspdf";

interface ResumeButtonProps {
  userId: number;
}

const ResumeButton: React.FC<ResumeButtonProps> = ({ userId }) => {
  const [generating, setGenerating] = useState(false);

  const handleGenerateResume = async () => {
    try {
      setGenerating(true);
      const response = await generateResume(userId);
      // fetch.utils returns: { status, response, message }
      // For resume: response.response = { resume: {...} }
      let resumeData: any = null;
      if (response?.response?.resume) {
        resumeData = response.response.resume;
      } else if (response?.data?.resume) {
        resumeData = response.data.resume;
      } else if (response?.response) {
        resumeData = response.response;
      } else if (response?.data) {
        resumeData = response.data;
      }

      if (!resumeData) {
        throw new Error("Failed to generate resume data");
      }

      // Generate PDF
      const doc = new jsPDF();
      let yPos = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(resumeData.personalInfo.name, 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(resumeData.personalInfo.email, 20, yPos);
      yPos += 5;
      if (resumeData.personalInfo.phone) {
        doc.text(resumeData.personalInfo.phone, 20, yPos);
        yPos += 5;
      }
      if (resumeData.personalInfo.address) {
        doc.text(resumeData.personalInfo.address, 20, yPos);
        yPos += 10;
      }

      // Professional Summary
      if (resumeData.personalInfo.bio) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Professional Summary", 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const bioLines = doc.splitTextToSize(resumeData.personalInfo.bio, 170);
        doc.text(bioLines, 20, yPos);
        yPos += bioLines.length * 5 + 5;
      }

      // Skills
      if (resumeData.skills && resumeData.skills.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Skills", 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(resumeData.skills.join(", "), 20, yPos);
        yPos += 10;
      }

      // Certifications
      if (resumeData.certifications && resumeData.certifications.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Certifications", 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        resumeData.certifications.forEach((cert: any) => {
          doc.setFont("helvetica", "bold");
          doc.text(cert.title, 20, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          if (cert.issuer) {
            doc.text(`Issued by: ${cert.issuer}`, 20, yPos);
            yPos += 5;
          }
          if (cert.date) {
            doc.text(`Date: ${new Date(cert.date).toLocaleDateString()}`, 20, yPos);
            yPos += 5;
          }
          yPos += 3;
        });
        yPos += 5;
      }

      // Projects
      if (resumeData.projects && resumeData.projects.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Projects", 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        resumeData.projects.forEach((project: any) => {
          doc.setFont("helvetica", "bold");
          doc.text(project.title, 20, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          if (project.company) {
            doc.text(`Client: ${project.company}`, 20, yPos);
            yPos += 5;
          }
          if (project.description) {
            const descLines = doc.splitTextToSize(project.description, 170);
            doc.text(descLines, 20, yPos);
            yPos += descLines.length * 5;
          }
          yPos += 3;
        });
        yPos += 5;
      }

      // Work Experience
      if (resumeData.workExperience && resumeData.workExperience.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Work Experience", 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        resumeData.workExperience.forEach((job: any) => {
          doc.setFont("helvetica", "bold");
          doc.text(job.title, 20, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          doc.text(job.company, 20, yPos);
          yPos += 5;
          if (job.description) {
            const descLines = doc.splitTextToSize(job.description, 170);
            doc.text(descLines, 20, yPos);
            yPos += descLines.length * 5;
          }
          yPos += 3;
        });
        yPos += 5;
      }

      // Reviews & Ratings
      if (resumeData.reviews && resumeData.reviews.totalReviews > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Reviews & Ratings", 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Average Rating: ${resumeData.reviews.averageRating}/5 (${resumeData.reviews.totalReviews} reviews)`,
          20,
          yPos
        );
      }

      // Save PDF
      doc.save(`${resumeData.personalInfo.name.replace(/\s+/g, "_")}_Resume.pdf`);
    } catch (error: any) {
      console.error("Generate resume error:", error);
      alert(error.response?.data?.message || "Failed to generate resume");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGenerateResume}
      disabled={generating}
      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
    >
      {generating ? (
        <>
          <FiLoader className="w-4 h-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FiFileText className="w-4 h-4" />
          Generate Resume
        </>
      )}
    </button>
  );
};

export default ResumeButton;

