import React, { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { createClient } from "@supabase/supabase-js";
import "./global.css";

const supabaseUrl = "https://dnbgjzscuxrlbceqsrhz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuYmdqenNjdXhybGJjZXFzcmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NDU1MTksImV4cCI6MjA1ODQyMTUxOX0.ZJ496AtjazuXkppkpEy-DnChkUdsAme4DQXBC4sNTsg"; // Replace with your actual key or keep as env variable
const supabase = createClient(supabaseUrl, supabaseKey);

const ItemType = { TASK: "task" };

const KanbanColumn = ({ title, tasks, onDrop, stage }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemType.TASK,
    drop: (item) => onDrop(item.id, stage),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  const getIcon = () => {
    if (stage === "new")
      return <img src="/icons/new.png" alt="New" className="w-6 h-6" />;
    if (stage === "in-progress")
      return (
        <img
          src="/icons/in-progress.png"
          alt="In Progress"
          className="w-6 h-6"
        />
      );
    if (stage === "completed") return <span className="text-2xl">✅</span>;
    return null;
  };

  return (
    <div
      ref={drop}
      className={`bg-white rounded-3xl p-6 shadow-xl min-h-[400px] w-full transition-colors border-4
        ${
          isActive
            ? "border-indigo-700 bg-indigo-50 shadow-2xl"
            : "border-transparent hover:border-indigo-400 hover:bg-indigo-100"
        }`}
    >
      <div className="flex items-center gap-3 mb-5">
        {getIcon()}
        <h3 className="text-2xl font-semibold text-indigo-900">{title}</h3>
      </div>
      {tasks.length === 0 ? (
        <p className="text-gray-400 italic select-none empty-state-pulse">
          No tasks here yet!
        </p>
      ) : (
        tasks.map((task) => <KanbanCard key={task.id} task={task} />)
      )}
    </div>
  );
};

const KanbanCard = ({ task }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType.TASK,
    item: { id: task.id },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  });

  return (
    <div
      ref={drag}
      className={`p-5 rounded-3xl shadow-lg bg-gradient-to-tr from-indigo-100 via-purple-100 to-pink-100 mb-4 cursor-grab
        transition-transform duration-300 ease-in-out select-none
        ${
          isDragging
            ? "opacity-80 scale-110 shadow-2xl cursor-grabbing"
            : "opacity-100 hover:scale-[1.05] hover:shadow-xl"
        }`}
    >
      <span
        className={`text-xl font-semibold ${
          task.completed
            ? "line-through text-gray-400"
            : "text-indigo-900 drop-shadow-md"
        }`}
      >
        {task.name}
      </span>
    </div>
  );
};

export default function TodoApp() {
  const [taskName, setTaskName] = useState("");
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    const { data } = await supabase.from("tasks").select("*");
    setTasks(data || []);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    if (taskName.trim()) {
      const { data, error } = await supabase
        .from("tasks")
        .insert([{ name: taskName, stage: "new", completed: false }])
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        alert("Error adding task: " + error.message);
        return;
      }

      if (!Array.isArray(data)) {
        console.error("Unexpected response format:", data);
        return;
      }

      setTasks([...tasks, ...data]);
      setTaskName("");
    }
  };

  const handleStageChange = async (id, newStage) => {
    await supabase.from("tasks").update({ stage: newStage }).eq("id", id);
    setTasks(
      tasks.map((task) => (task.id === id ? { ...task, stage: newStage } : task))
    );
  };

  const filteredTasks = (stage) => tasks.filter((task) => task.stage === stage);

  return (
    <div className="flex min-h-screen bg-indigo-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white p-6 flex flex-col gap-10 overflow-y-auto rounded-r-3xl shadow-xl">
        <div className="text-3xl font-extrabold mb-8 tracking-wider drop-shadow-lg">
          TaskBoard
        </div>
        <nav className="flex flex-col gap-4 text-lg font-semibold select-none">
          {["Dashboard", "My Tasks", "Calendar", "Settings"].map((item) => (
            <button
              key={item}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl hover:bg-purple-700 transition ease-in-out duration-300 transform hover:scale-105 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
            >
              <span className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {item[0]}
              </span>
              {item}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-indigo-900">Welcome back!</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search..."
              className="p-2 px-4 rounded-full border-2 border-indigo-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-300 focus:outline-none transition duration-300 ease-in-out text-indigo-900 placeholder-indigo-400 w-64"
            />
            <div className="w-10 h-10 bg-indigo-700 text-white rounded-full flex items-center justify-center font-semibold drop-shadow-md cursor-pointer select-none">
              U
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto flex-1 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h1 className="text-4xl font-extrabold text-center mb-8 text-indigo-900 tracking-wide">
              Add Your Task
            </h1>
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Enter task name"
                className="flex-1 p-4 rounded-3xl border-2 border-purple-400 shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-300 transition duration-300 ease-in-out text-lg text-purple-900 placeholder-purple-400"
              />
              <button
                onClick={handleAddTask}
                className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 text-white font-bold px-10 py-4 rounded-3xl shadow-lg
                  hover:from-indigo-700 hover:via-purple-900 hover:to-purple-700 active:scale-95 active:shadow-inner transition-all duration-300 ease-in-out"
              >
                Submit
              </button>
            </div>

            <DndProvider backend={HTML5Backend}>
              <div className="flex gap-6">
                <div className="flex-1">
                  <KanbanColumn
                    title="New"
                    tasks={filteredTasks("new")}
                    onDrop={handleStageChange}
                    stage="new"
                  />
                </div>
                <div className="flex-1">
                  <KanbanColumn
                    title="In Progress"
                    tasks={filteredTasks("in-progress")}
                    onDrop={handleStageChange}
                    stage="in-progress"
                  />
                </div>
                <div className="flex-1">
                  <KanbanColumn
                    title="Completed"
                    tasks={filteredTasks("completed")}
                    onDrop={handleStageChange}
                    stage="completed"
                  />
                </div>
              </div>
            </DndProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
