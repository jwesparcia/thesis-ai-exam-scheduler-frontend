import { useState } from "react";

export default function App() {
  const [courses, setCourses] = useState([""]);
  const [sections, setSections] = useState([""]);
  const [rooms, setRooms] = useState([""]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("20:00");
  const [schedule, setSchedule] = useState(null);
  const [meta, setMeta] = useState(null); // store fitness, unassigned, etc.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helpers for dynamic lists
  const handleListChange = (list, setList, index, value) => {
    const updated = [...list];
    updated[index] = value;
    setList(updated);
  };

  const addField = (list, setList) => {
    setList([...list, ""]);
  };

  const removeField = (list, setList, index) => {
    if (list.length > 1) {
      const updated = list.filter((_, i) => i !== index);
      setList(updated);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setSchedule(null);
    setError(null);
    setMeta(null);

    const filteredCourses = courses.filter((c) => c.trim() !== "");
    const filteredSections = sections.filter((s) => s.trim() !== "");
    const filteredRooms = rooms.filter((r) => r.trim() !== "");

    if (!filteredCourses.length || !filteredSections.length || !filteredRooms.length || !startDate || !endDate) {
      setError("Please fill in all required fields (at least one course, section, and room)");
      setLoading(false);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date must be before or equal to end date");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courses: filteredCourses,
          sections: filteredSections,
          rooms: filteredRooms,
          start_date: startDate,
          end_date: endDate,
          start_time: startTime,
          end_time: endTime,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // timetable + metadata
      setSchedule(data.timetable);
      setMeta({
        totalCourses: data.total_courses,
        unassignedCourses: data.unassigned_courses,
        fitness: data.fitness_score,
        generation: data.generation,
      });
    } catch (err) {
      console.error("Error:", err);
      setError("Error connecting to backend. Please make sure FastAPI is running on http://127.0.0.1:8000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold text-indigo-700 mb-8 text-center">
        🎓 AI Exam Scheduler
      </h1>

      <p className="text-gray-600 text-center mb-6 max-w-2xl">
        Generate optimized exam schedules across multiple days. The system automatically avoids Sundays and creates 90-minute time slots.
      </p>

      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-2xl space-y-8">
        {/* Courses */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Courses <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {courses.map((c, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Course ${idx + 1} (e.g., Mathematics, Physics)`}
                  value={c}
                  onChange={(e) => handleListChange(courses, setCourses, idx, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                {courses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeField(courses, setCourses, idx)}
                    className="text-red-500 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addField(courses, setCourses)}
            className="mt-3 text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1"
          >
            + Add another course
          </button>
        </div>

        {/* Sections */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Sections <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {sections.map((s, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Section ${idx + 1} (e.g., BSCS-1A, BSIT-2B)`}
                  value={s}
                  onChange={(e) => handleListChange(sections, setSections, idx, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeField(sections, setSections, idx)}
                    className="text-red-500 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addField(sections, setSections)}
            className="mt-3 text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1"
          >
            + Add another section
          </button>
        </div>

        {/* Rooms */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Rooms <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {rooms.map((r, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Room ${idx + 1} (e.g., Room 101, Lab A)`}
                  value={r}
                  onChange={(e) => handleListChange(rooms, setRooms, idx, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                {rooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeField(rooms, setRooms, idx)}
                    className="text-red-500 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addField(rooms, setRooms)}
            className="mt-3 text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1"
          >
            + Add another room
          </button>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:scale-100 shadow-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Generating Schedule...
            </span>
          ) : (
            "🚀 Generate Schedule"
          )}
        </button>
      </div>

      {/* Schedule Output */}
      {schedule && (
        <div className="mt-10 w-full max-w-6xl bg-white shadow-xl rounded-3xl p-8 overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📅 Generated Schedule</h2>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {meta?.totalCourses} courses
            </span>
          </div>

          {/* Metadata */}
          {meta && (
            <div className="mb-6 text-sm text-gray-600">
              <p>✅ Fitness Score: <strong>{meta.fitness.toFixed(2)}</strong></p>
              <p>🔄 Best Generation: <strong>{meta.generation}</strong></p>
              <p>⚠️ Unassigned Courses: <strong>{meta.unassignedCourses}</strong></p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Section</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Course</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Date</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Room</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Time Slot</th>
                </tr>
              </thead>
              <tbody>
                {schedule.flatMap((row) =>
                  Object.entries(row.time_slots).flatMap(([timeslot, exams]) =>
                    exams.flatMap((exam, examIdx) =>
                      exam.sections.map((section, secIdx) => (
                        <tr
                          key={`${row.date}-${timeslot}-${examIdx}-${secIdx}`}
                          className="hover:bg-indigo-50 transition-colors"
                        >
                          <td className="border border-gray-300 px-4 py-3 font-medium">{section}</td>
                          <td className="border border-gray-300 px-4 py-3">{exam.course}</td>
                          <td className="border border-gray-300 px-4 py-3">{row.formatted_date}</td>
                          <td className="border border-gray-300 px-4 py-3">
                            {exam.rooms[secIdx] || "NO ROOM"}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">{timeslot}</td>
                        </tr>
                      ))
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {meta?.unassignedCourses > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <strong>⚠️ Warning:</strong> Some courses could not be fully assigned due to limited slots or rooms. 
              Try extending the date range or adding more rooms.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
