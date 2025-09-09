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
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helpers
  const handleListChange = (list, setList, idx, value) => {
    const updated = [...list];
    updated[idx] = value;
    setList(updated);
  };

  const addField = (list, setList) => setList([...list, ""]);
  const removeField = (list, setList, idx) =>
    list.length > 1 && setList(list.filter((_, i) => i !== idx));

  // Generate dates between startDate and endDate (skip Sundays)
  const generateDates = () => {
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      if (current.getDay() !== 0) {
        dates.push(current.toISOString().split("T")[0]);
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Generate 90-min timeslots
  const generateTimeslots = () => {
    const slots = [];
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    let current = new Date();
    current.setHours(sh, sm, 0, 0);

    const end = new Date();
    end.setHours(eh, em, 0, 0);

    while (current < end) {
      const slotStart = new Date(current);
      current.setMinutes(current.getMinutes() + 90);
      if (current > end) break;
      const slotEnd = new Date(current);

      const fmt = (d) =>
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
      slots.push(`${fmt(slotStart)} - ${fmt(slotEnd)}`);
    }

    return slots;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSchedule(null);
    setMeta(null);

    const filteredCourses = courses.filter((c) => c.trim() !== "");
    const filteredSections = sections.filter((s) => s.trim() !== "");
    const filteredRooms = rooms.filter((r) => r.trim() !== "");

    if (!filteredCourses.length || !filteredSections.length || !filteredRooms.length || !startDate || !endDate) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const dates = generateDates();
    const timeslots = generateTimeslots();

    try {
      const res = await fetch("http://127.0.0.1:8000/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courses: filteredCourses,
          sections: filteredSections,
          rooms: filteredRooms,
          dates,
          timeslots,
        }),
      });

      if (!res.ok) throw new Error("HTTP error " + res.status);
      const data = await res.json();

      // ✅ Store sections grouped schedule
      setSchedule(data.sections);

      setMeta({
        totalCourses: data.total_courses,
        unassignedCourses: data.unassigned_courses,
        fitness: data.fitness_score,
        generation: data.generation,
      });
    } catch (err) {
      console.error(err);
      setError("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  // Sort exams per section by date + timeslot
  const sortExams = (exams) => {
    return [...exams].sort((a, b) => {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      if (a.timeslot < b.timeslot) return -1;
      if (a.timeslot > b.timeslot) return 1;
      return 0;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">
        STI BULOK
      </h1>

      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-6 space-y-6">
        {/* Courses */}
        <InputList
          label="Subjects"
          list={courses}
          setList={setCourses}
          handleListChange={handleListChange}
          removeField={removeField}
          addField={addField}
        />

        {/* Sections */}
        <InputList
          label="Sections"
          list={sections}
          setList={setSections}
          handleListChange={handleListChange}
          removeField={removeField}
          addField={addField}
        />

        {/* Rooms */}
        <InputList
          label="Rooms"
          list={rooms}
          setList={setRooms}
          handleListChange={handleListChange}
          removeField={removeField}
          addField={addField}
        />

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Start Date" type="date" value={startDate} onChange={setStartDate} />
          <Field label="End Date" type="date" value={endDate} onChange={setEndDate} />
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Start Time (Range)" type="time" value={startTime} onChange={setStartTime} />
          <Field label="End Time (Range)" type="time" value={endTime} onChange={setEndTime} />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg"
        >
          {loading ? "Generating..." : "🚀 Generate Schedule"}
        </button>
      </div>

      {/* Schedule */}
      {schedule && (
        <div className="mt-10 max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📅 Generated Schedule</h2>
          {meta && (
            <div className="text-sm text-gray-600 mb-4">
              <p>✅ Fitness Score: <b>{meta.fitness}</b></p>
              <p>🔄 Generation: <b>{meta.generation}</b></p>
              <p>⚠️ Unassigned: <b>{meta.unassignedCourses}</b></p>
            </div>
          )}

          {Object.entries(schedule).map(([section, exams]) => (
            <div key={section} className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-700 mb-2">
                Section: {section}
              </h3>
              <table className="w-full border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-2">Course</th>
                    <th className="border px-3 py-2">Room</th>
                    <th className="border px-3 py-2">Date</th>
                    <th className="border px-3 py-2">Timeslot</th>
                  </tr>
                </thead>
                <tbody>
                  {sortExams(exams).map((exam, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">{exam.course}</td>
                      <td className="border px-3 py-2">{exam.room}</td>
                      <td className="border px-3 py-2">{exam.date}</td>
                      <td className="border px-3 py-2">{exam.timeslot}</td>
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
}

// --- Reusable components ---
function InputList({ label, list, setList, handleListChange, removeField, addField }) {
  return (
    <div>
      <label className="block text-lg font-semibold mb-2">{label} *</label>
      {list.map((val, idx) => (
        <div key={idx} className="flex gap-2 mb-2">
          <input
            type="text"
            value={val}
            onChange={(e) => handleListChange(list, setList, idx, e.target.value)}
            placeholder={`${label.slice(0, -1)} ${idx + 1}`}
            className="flex-1 border rounded px-3 py-2"
          />
          {list.length > 1 && (
            <button
              type="button"
              onClick={() => removeField(list, setList, idx)}
              className="text-red-500"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => addField(list, setList)}
        className="text-indigo-600 text-sm"
      >
        + Add another {label.slice(0, -1)}
      </button>
    </div>
  );
}

function Field({ label, type, value, onChange }) {
  return (
    <div>
      <label className="block text-lg font-semibold mb-1">{label} *</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />
    </div>
  );
}
