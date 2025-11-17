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

      // Work Experience (includes both completed jobs and projects)
      if (resumeData.workExperience && resumeData.workExperience.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Work Experience", 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        resumeData.workExperience.forEach((exp: any) => {
          doc.setFont("helvetica", "bold");
          doc.text(exp.title, 20, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          doc.text(exp.company, 20, yPos);
          yPos += 5;
          if (exp.dateStarted || exp.dateEnd) {
            const startDate = exp.dateStarted ? new Date(exp.dateStarted).toLocaleDateString() : '';
            const endDate = exp.dateEnd ? new Date(exp.dateEnd).toLocaleDateString() : 'Present';
            doc.text(`${startDate} - ${endDate}`, 20, yPos);
            yPos += 5;
          } else if (exp.date) {
            doc.text(new Date(exp.date).toLocaleDateString(), 20, yPos);
            yPos += 5;
          }
          if (exp.description) {
            const descLines = doc.splitTextToSize(exp.description, 170);
            doc.text(descLines, 20, yPos);
            yPos += descLines.length * 5;
          }
          if (exp.skills && exp.skills.length > 0) {
            doc.text(`Skills: ${exp.skills.join(", ")}`, 20, yPos);
            yPos += 5;
          }
          yPos += 3;
        });
        yPos += 5;
      }

      // Education
      if (resumeData.education && resumeData.education.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Education", 20, yPos);
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        resumeData.education.forEach((edu: any) => {
          doc.setFont("helvetica", "bold");
          doc.text(edu.school || "School", 20, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          if (edu.degree) {
            doc.text(edu.degree, 20, yPos);
            yPos += 5;
          }
          if (edu.dateStarted || edu.dateEnded) {
            const startDate = edu.dateStarted ? new Date(edu.dateStarted).toLocaleDateString() : '';
            const endDate = edu.dateEnded ? new Date(edu.dateEnded).toLocaleDateString() : 'Present';
            doc.text(`${startDate} - ${endDate}`, 20, yPos);
            yPos += 5;
          }
          yPos += 3;
        });
        yPos += 5;
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

