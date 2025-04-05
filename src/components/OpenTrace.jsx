import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../helper/supabaseClient";
import SavedTraceCard from "./SavedTraceCard";

const formatDisplayDate = (date) => {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear().toString().slice(-2)}`;
};

const formatForInput = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
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

const StatusSelector = ({ currentStatus, onSelect }) => {
  const statuses = ["red", "yellow", "green"];
  return (
    <div className="flex gap-4">
      {statuses.map((color) => (
        <div key={color} className="relative group">
          <button
            onClick={() => onSelect(color)}
            className={`w-6 h-6 rounded-full transition-all duration-150 flex items-center justify-center focus:outline-none ${getStatusStyle(
              color
            )} ${currentStatus === color ? "ring-2 ring-blue-300" : ""}`}
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
  const navigate = useNavigate();
  const [traceDetails, setTraceDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingNode, setEditingNode] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [traceInfo, setTraceInfo] = useState(null);
  const [showTraceModal, setShowTraceModal] = useState(false);

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
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load nodes.");
      return [];
    }
  };

  useEffect(() => {
    if (!traceId) return setErrorMsg("Invalid trace ID.");
    (async () => {
      setLoading(true);
      const details = await fetchTraceDetails(traceId);

      const { data: trace, error: traceError } = await supabase
        .from("traces")
        .select(`
          title,
          trace_id,
          trace_tags (
            tag_id,
            tags (
              name
            )
          )
        `)
        .eq("trace_id", traceId)
        .single();

      if (traceError) {
        console.error("Failed to fetch trace info", traceError);
      } else {
        const traceTags = trace.trace_tags || [];
        const tagNames = traceTags.map((tt) => tt.tags?.name).filter(Boolean);
        setTraceInfo({ ...trace, tags: tagNames });
      }

      setTraceDetails(details);
      setLoading(false);
    })();
  }, [traceId]);

  const handleEdit = (node) => {
    setEditingNode(node.node_id);
    setEditForm({
      heading: node.heading,
      description: node.description,
      status: node.status,
      deadline:
        node.deadlines?.[0]?.deadline
          ? formatForInput(node.deadlines[0].deadline)
          : "",
    });
  };

  const handleSaveEdit = async () => {
    try {
      await supabase
        .from("nodes")
        .update({
          heading: editForm.heading,
          description: editForm.description,
          status: editForm.status,
        })
        .eq("node_id", editingNode);

      const { data: existing } = await supabase
        .from("deadlines")
        .select()
        .eq("node_id", editingNode);

      if (existing.length) {
        await supabase
          .from("deadlines")
          .update({ deadline: editForm.deadline })
          .eq("node_id", editingNode);
      } else {
        await supabase
          .from("deadlines")
          .insert({ node_id: editingNode, deadline: editForm.deadline });
      }

      const updated = await fetchTraceDetails(traceId);
      setTraceDetails(updated);
      setEditingNode(null);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to save changes.");
    }
  };

  const handleDelete = async (node_id) => {
    if (!window.confirm("Delete this node?")) return;
    await supabase.from("nodes").delete().eq("node_id", node_id);
    const updated = await fetchTraceDetails(traceId);
    setTraceDetails(updated);
  };

  const VerticalArrow = () => (
    <div className="flex justify-center py-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 5v14m-5-5l5 5 5-5"
        />
      </svg>
    </div>
  );

  if (loading) return <p className="text-center text-gray-400">Loading...</p>;
  if (errorMsg) return <p className="text-center text-red-500">{errorMsg}</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6 relative">
        {/* Position trace info card in top left corner with increased size */}
        {traceInfo && (
  <div className="hidden md:block md:fixed md:left-6 md:top-10 z-10">
    <SavedTraceCard
      title={traceInfo.title || "Untitled Trace"}
      tags={Array.isArray(traceInfo.tags) ? traceInfo.tags : []}
    />
  </div>
)}


        <h1 className="text-5xl font-extrabold text-center mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          Nodes
        </h1>
        {traceDetails.length ? (
          traceDetails.map((node, idx) => (
            <React.Fragment key={node.node_id}>
              <div className="flex justify-center items-center">
                <div className="bg-gray-800 p-5 rounded-lg shadow-lg w-full max-w-md">
                  {editingNode === node.node_id ? (
                    <>
                      <h3 className="text-2xl font-bold text-blue-400 mb-4">
                        Edit Node
                      </h3>
                      <label className="block text-gray-400 mb-2">Heading</label>
                      <input
                        className="w-full p-2 mb-4 bg-gray-800 text-white rounded-lg border border-gray-600"
                        type="text"
                        value={editForm.heading}
                        onChange={(e) =>
                          setEditForm({ ...editForm, heading: e.target.value })
                        }
                      />
                      <label className="block text-gray-400 mb-2">
                        Description
                      </label>
                      <textarea
                        className="w-full p-2 mb-4 bg-gray-800 text-white rounded-lg border border-gray-600"
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                      />
                      <label className="block text-gray-400 mb-2">Status</label>
                      <StatusSelector
                        currentStatus={editForm.status}
                        onSelect={(c) =>
                          setEditForm({ ...editForm, status: c })
                        }
                      />
                      <label className="block text-gray-400 mb-2 mt-4">
                        Deadline
                      </label>
                      <input
                        className="w-full p-2 mb-4 bg-gray-800 text-white rounded-lg border border-gray-600"
                        type="date"
                        value={editForm.deadline}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            deadline: e.target.value,
                          })
                        }
                      />
                      <div className="flex justify-between">
                        <button
                          className="bg-[#8F79BE] text-white px-4 py-2 rounded-lg hover:opacity-90"
                          onClick={handleSaveEdit}
                        >
                          Save
                        </button>
                        <button
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                          onClick={() => setEditingNode(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-blue-400">
                        {node.heading}
                      </h3>
                      <p className="text-gray-400 mt-2">
                        <strong>Description:</strong> {node.description}
                      </p>
                      <div className="flex items-center mt-2">
                        <strong className="mr-2">Status:</strong>
                        <div className="relative group">
                          <div
                            className={`${getStatusStyle(
                              node.status
                            )} w-6 h-6 rounded-full`}
                          />
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {getStatusText(node.status)}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 mt-2">
                        <strong>Deadline:</strong>{" "}
                        {node.deadlines?.[0]?.deadline
                          ? formatDisplayDate(node.deadlines[0].deadline)
                          : "No deadline set"}
                      </p>
                      <p className="text-gray-400 mt-2">
                        <strong>Created At:</strong>{" "}
                        {new Date(node.created_at).toLocaleDateString()}{" "}
                        {new Date(node.created_at).toLocaleTimeString()}
                      </p>
                      <div className="flex justify-between flex-wrap gap-2 mt-4">
                        <button
                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                          onClick={() => handleDelete(node.node_id)}
                        >
                          Delete
                        </button>
                        <button
                          className="bg-[#8F79BE] text-white px-3 py-2 rounded-lg hover:opacity-90"
                          onClick={() => navigate(`/links/${node.node_id}`)}
                        >
                          Links
                        </button>
                        <button
                          className="bg-[#8F79BE] text-white px-3 py-2 rounded-lg hover:opacity-90"
                          onClick={() => navigate(`/notes/${node.node_id}`)}
                        >
                          Notes
                        </button>
                        <button
                          className="bg-[#8F79BE] text-white px-3 py-2 rounded-lg hover:opacity-90"
                          onClick={() =>
                            navigate(`/attachments/${node.node_id}`)
                          }
                        >
                          Attachments
                        </button>
                        <button
                          className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600"
                          onClick={() => handleEdit(node)}
                        >
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {idx < traceDetails.length - 1 && <VerticalArrow />}
            </React.Fragment>
          ))
        ) : (
          <p className="text-gray-400 text-center text-lg">
            No nodes found for this trace.
          </p>
        )}
      </div>
    </div>
  );
};

export default OpenTrace;