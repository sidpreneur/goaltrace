import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../helper/supabaseClient";

const formatDisplayDate = (date) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
};

const formatForInput = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStatusStyle = (status) => {
  switch (status) {
    case "red":
      return "bg-red-500 border-red-600 border-2";
    case "yellow":
      return "bg-yellow-500 border-yellow-600 border-2";
    case "green":
      return "bg-green-500 border-green-600 border-2";
    default:
      return "bg-gray-500 border-gray-600 border-2";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "red":
      return "Not Started";
    case "yellow":
      return "In Progress";
    case "green":
      return "Completed";
    default:
      return "Unknown";
  }
};

const StatusSelector = ({ currentStatus, originalStatus, onSelect }) => {
  const statuses = ["red", "yellow", "green"];
  return (
    <div className="flex gap-4">
      {statuses.map((color) => (
        <div key={color} className="relative group">
          <button
            onClick={() => onSelect(color)}
            className={`w-6 h-6 rounded-full transition-all duration-150 flex items-center justify-center focus:outline-none ${getStatusStyle(color)} ${
              currentStatus === color ? "ring-2 ring-blue-300" : ""
            }`}
          />
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {getStatusText(color)}
          </span>
        </div>
      ))}
    </div>
  );
};

const OpenTrace = () => {
  const { traceId } = useParams();
  const [traceDetails, setTraceDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingNode, setEditingNode] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [originalStatus, setOriginalStatus] = useState("");

  const fetchTraceDetails = async (trace_id) => {
    try {
      const { data, error } = await supabase
        .from("nodes")
        .select(`
          node_id,
          heading,
          description,
          status,
          created_at,
          deadlines ( deadline )
        `)
        .eq("trace_id", trace_id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error fetching trace details:", err.message);
      setErrorMsg("Failed to load nodes.");
      return [];
    }
  };

  useEffect(() => {
    if (!traceId) {
      setErrorMsg("Invalid trace ID.");
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      const details = await fetchTraceDetails(traceId);
      setTraceDetails(details);
      setLoading(false);
    };
    fetchData();
  }, [traceId]);

  const handleEdit = (node) => {
    setEditingNode(node.node_id);
    setEditForm({
      heading: node.heading,
      description: node.description,
      status: node.status,
      deadline:
        node.deadlines && node.deadlines.length > 0 && node.deadlines[0].deadline
          ? formatForInput(node.deadlines[0].deadline)
          : ""
    });
    setOriginalStatus(node.status);
  };

  const handleSaveEdit = async () => {
    try {
      const { error: nodeError } = await supabase
        .from("nodes")
        .update({
          heading: editForm.heading,
          description: editForm.description,
          status: editForm.status
        })
        .eq("node_id", editingNode);

      if (nodeError) throw nodeError;

      const { data: updatedDeadline, error: deadlineError } = await supabase
        .from("deadlines")
        .update({ deadline: editForm.deadline })
        .eq("node_id", editingNode);

      if (deadlineError || !updatedDeadline || updatedDeadline.length === 0) {
        const { error: insertError } = await supabase
          .from("deadlines")
          .insert({ node_id: editingNode, deadline: editForm.deadline });

        if (insertError) throw insertError;
      }

      const updatedDetails = await fetchTraceDetails(traceId);
      setTraceDetails(updatedDetails);
      setEditingNode(null);
    } catch (err) {
      console.error("Error saving node:", err.message);
      setErrorMsg("Failed to save changes.");
    }
  };

  const handleDelete = async (node_id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this node?");
    if (!confirmDelete) return;
    try {
      const { error } = await supabase.from("nodes").delete().eq("node_id", node_id);
      if (error) throw error;
      const updatedDetails = await fetchTraceDetails(traceId);
      setTraceDetails(updatedDetails);
    } catch (err) {
      console.error("Error deleting node:", err.message);
      setErrorMsg("Failed to delete node.");
    }
  };

  const VerticalArrow = () => (
    <div className="flex justify-center py-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-5-5l5 5 5-5" />
      </svg>
    </div>
  );

  if (loading) return <p className="text-center text-gray-400">Loading...</p>;
  if (errorMsg) return <p className="text-center text-red-500">{errorMsg}</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-5xl font-extrabold text-center mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          Nodes
        </h1>

        {traceDetails.length > 0 ? (
          <div className="flex flex-col items-center gap-6">
            {traceDetails.map((node, index) => (
              <React.Fragment key={node.node_id}>
                <div className="bg-gray-800 p-5 rounded-lg shadow-lg w-full max-w-md">
                  {editingNode === node.node_id ? (
                    <>
                      <h3 className="text-2xl font-bold text-blue-400 mb-4">Edit Node</h3>
                      <label className="block text-gray-400 mb-2">Heading</label>
                      <input
                        type="text"
                        value={editForm.heading}
                        onChange={(e) =>
                          setEditForm({ ...editForm, heading: e.target.value })
                        }
                        className="w-full p-2 mb-4 bg-gray-800 text-white rounded-lg border border-gray-600"
                      />
                      <label className="block text-gray-400 mb-2">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({ ...editForm, description: e.target.value })
                        }
                        className="w-full p-2 mb-4 bg-gray-800 text-white rounded-lg border border-gray-600"
                      />
                      <label className="block text-gray-400 mb-2">Status</label>
                      <StatusSelector
                        currentStatus={editForm.status}
                        originalStatus={originalStatus}
                        onSelect={(color) => setEditForm({ ...editForm, status: color })}
                      />
                      <label className="block text-gray-400 mb-2 mt-4">Deadline</label>
                      <input
                        type="date"
                        value={editForm.deadline || ""}
                        onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                        className="w-full p-2 mb-4 bg-gray-800 text-white rounded-lg border border-gray-600"
                      />
                      <div className="flex justify-between">
                        <button
                          onClick={handleSaveEdit}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingNode(null)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-blue-400">{node.heading}</h3>
                      <p className="text-gray-400 mt-2">
                        <strong>Description:</strong> {node.description}
                      </p>
                      <div className="flex items-center mt-2 group relative">
                        <strong className="mr-2">Status:</strong>
                        <div className={`${getStatusStyle(node.status)} w-6 h-6 rounded-full`} />
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {getStatusText(node.status)}
                        </span>
                      </div>
                      <p className="text-gray-400 mt-2">
                        <strong>Deadline:</strong>{" "}
                        {node.deadlines && node.deadlines[0]?.deadline
                          ? formatDisplayDate(node.deadlines[0].deadline)
                          : "No deadline set"}
                      </p>
                      <p className="text-gray-400 mt-2">
                        <strong>Created At:</strong>{" "}
                        {new Date(node.created_at).toLocaleDateString()}{" "}
                        {new Date(node.created_at).toLocaleTimeString()}
                      </p>
                      <div className="flex justify-between mt-4">
                        <button
                          onClick={() => handleDelete(node.node_id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleEdit(node)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                        >
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {index < traceDetails.length - 1 && <VerticalArrow />}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center text-lg">No nodes found for this trace.</p>
        )}
      </div>
    </div>
  );
};

export default OpenTrace;
