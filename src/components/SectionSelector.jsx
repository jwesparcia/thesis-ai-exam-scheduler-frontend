import React, { useEffect, useState } from "react";

const SectionSelector = () => {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Load all sections on mount
  useEffect(() => {
    fetch("http://127.0.0.1:8000/sections/")
      .then((res) => res.json())
      .then((data) => setSections(data))
      .catch((err) => console.error("Error fetching sections:", err));
  }, []);

  // 🔹 Fetch subjects when a section is chosen
  const handleSectionChange = async (e) => {
    const sectionId = e.target.value;
    setSelectedSection(sectionId);
    setSchedule(null);

    if (sectionId) {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/sections/${sectionId}/subjects`
        );
        const data = await res.json();
        setSubjects(data);
      } catch (err) {
        console.error("Error fetching subjects:", err);
      }
    } else {
      setSubjects([]);
    }
  };

  // 🔹 Generate schedule using GA
  const generateSchedule = async () => {
    if (!selectedSection || subjects.length === 0) return;

    setLoading(true);

    const sectionName = sections.find(
      (s) => s.section_id == selectedSection
    )?.section_name;

    const reqBody = {
      courses: subjects.map((s) => s.subject_name),
      sections: [sectionName],
      rooms: ["Room 101", "Room 102", "Room 103"], // later fetch from backend
      dates: ["2025-09-15", "2025-09-16"],
      timeslots: ["8:00-10:00", "10:00-12:00", "1:00-3:00"],
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/schedule/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });

      const data = await res.json();
      setSchedule(data);
    } catch (err) {
      console.error("Error generating schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4"></h2>

      {/* Section Dropdown */}
      <label className="block mb-2 font-medium">Select a Section</label>
      <select
        value={selectedSection}
        onChange={handleSectionChange}
        className="border border-gray-300 rounded-lg p-2 w-full mb-4"
      >
        <option value="">-- Select Section --</option>
        {sections.map((s) => (
          <option key={s.section_id} value={s.section_id}>
            {s.section_name}
          </option>
        ))}
      </select>

      {/* Subjects Table */}
      {subjects.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">
            Subjects for{" "}
            {sections.find((s) => s.section_id == selectedSection)?.section_name}
          </h3>
          <table className="table-auto w-full border border-gray-300 rounded-lg shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Subject</th>
                <th className="px-4 py-2 text-left">Teacher</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subj) => (
                <tr key={subj.subject_id} className="border-t">
                  <td className="px-4 py-2">{subj.subject_name}</td>
                  <td className="px-4 py-2">{subj.teacher_name}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Generate Schedule Button */}
          <button
            onClick={generateSchedule}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Exam Schedule"}
          </button>
        </div>
      )}

      {/* Generated Schedule */}
      {schedule && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">Generated Schedule</h3>
          <p className="text-gray-600 mb-2">
            Fitness Score: {schedule.fitness_score} | Generation:{" "}
            {schedule.generation}
          </p>
          {Object.entries(schedule.sections).map(([section, exams]) => (
            <div key={section} className="mb-6">
              <h4 className="text-lg font-bold mb-2">{section}</h4>
              <table className="table-auto w-full border border-gray-300 rounded-lg shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Course</th>
                    <th className="px-4 py-2 text-left">Room</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Timeslot</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{exam.course}</td>
                      <td className="px-4 py-2">{exam.room}</td>
                      <td className="px-4 py-2">{exam.date}</td>
                      <td className="px-4 py-2">{exam.timeslot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SectionSelector;
