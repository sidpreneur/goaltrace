import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../helper/supabaseClient";
import { motion } from "framer-motion";

const OpenTrace = () => {
    const { traceId } = useParams();
    const [traceDetails, setTraceDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingNode, setEditingNode] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Fetch nodes for the selected trace
    const fetchTraceDetails = async (trace_id) => {
        try {
            const { data, error } = await supabase
                .from("nodes")
                .select(`
                    node_id,
                    heading,
                    description,
                    position,
                    status,
                    created_at
                `)
                .eq("trace_id", trace_id)
                .order("created_at", { ascending: true }); // Sort by creation time

            if (error) {
                console.error("Error fetching trace details:", error);
                return [];
            }

            return data;
        } catch (err) {
            console.error("Unexpected error in fetchTraceDetails:", err);
            return [];
        }
    };

    // Fetch nodes when the component mounts
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const details = await fetchTraceDetails(traceId);
            setTraceDetails(details);
            setLoading(false);
        };

        fetchData();
    }, [traceId]);

    // Handle editing a node
    const handleEdit = (node) => {
        setEditingNode(node.node_id); // Set the node being edited
        setEditForm({
            heading: node.heading,
            description: node.description,
            position: node.position,
            status: node.status,
        }); // Populate the edit form with the node's current data
    };

    // Handle saving the edited node
    const handleSaveEdit = async () => {
        try {
            const { error } = await supabase
                .from("nodes")
                .update(editForm)
                .eq("node_id", editingNode);

            if (error) {
                console.error("Error updating node:", error);
                return;
            }

            const details = await fetchTraceDetails(traceId);
            setTraceDetails(details);
            setEditingNode(null); // Reset editing state
        } catch (err) {
            console.error("Unexpected error in handleSaveEdit:", err);
        }
    };

    // Handle deleting a node
    const handleDelete = async (node_id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this node?");
        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from("nodes")
                .delete()
                .eq("node_id", node_id);

            if (error) {
                console.error("Error deleting node:", error);
                return;
            }

            const details = await fetchTraceDetails(traceId);
            setTraceDetails(details);
        } catch (err) {
            console.error("Unexpected error in handleDelete:", err);
        }
    };

    // Render loading state
    if (loading) {
        return <p className="text-center text-gray-400">Loading...</p>;
    }

    // A simple vertical arrow component.
    const VerticalArrow = () => (
        <motion.div
            className="flex justify-center py-6 text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-5-5l5 5 5-5" />
            </svg>
        </motion.div>
    );

    // Render nodes
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
                                {/* Node Card */}
                                {editingNode === node.node_id ? (
                                    <div className="bg-gray-700 p-5 rounded-lg shadow-lg w-full max-w-md">
                                        {/* Edit Form */}
                                        <h3 className="text-2xl font-bold text-blue-400 mb-4">Edit Node</h3>
                                        <input
                                            type="text"
                                            value={editForm.heading}
                                            onChange={(e) => setEditForm({ ...editForm, heading: e.target.value })}
                                            placeholder="Heading"
                                            className="w-full p-2 mb-4 bg-gray-800 text-white rounded-lg border border-gray-600"
                                        />
                                        <textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            placeholder="Description"
                                            className="w-full p-2 mb-4 bg-gray-800 text-white rounded-lg border border-gray-600"
                                        />
                                        <input
                                            type="number"
                                            value={editForm.position}
                                            onChange={(e) => setEditForm({ ...editForm, position: parseInt(e.target.value, 10) })}
                                            placeholder="Position"
                                            className="w-full p-2 mb-4 bg-gray-800 text-white rounded-lg border border-gray-600"
                                        />
                                        {/* Status Dropdown */}
                                        <select
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            className="w-full p-2 mb-4 bg-gray-800 text-white rounded-lg border border-gray-600"
                                        >
                                            <option value="Not Started">Not Started</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
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
                                    </div>
                                ) : (
                                    <div className="bg-gray-800 p-5 rounded-lg shadow-lg w-full max-w-md">
                                        <h3 className="text-2xl font-bold text-blue-400">{node.heading}</h3>
                                        <p className="text-gray-400 mt-2">{node.description}</p>
                                        <p className="text-gray-400 mt-2">
                                            <strong>Position:</strong> {node.position}
                                        </p>
                                        <p className="text-gray-400 mt-2">
                                            <strong>Deadline:</strong> {node.deadline ? new Date(node.deadline).toLocaleDateString() : "No deadline set"}
                                        </p>
                                        <div className="flex items-center mt-2">
                                            <p className="text-gray-400">
                                                <strong>Status:</strong>
                                            </p>
                                            <div
                                                className={`w-4 h-4 ml-2 rounded-full ${
                                                    node.status === "Not Started"
                                                        ? "bg-red-500"
                                                        : node.status === "In Progress"
                                                        ? "bg-yellow-500"
                                                        : node.status === "Completed"
                                                        ? "bg-green-500"
                                                        : "bg-gray-500"
                                                }`}
                                                title={node.status}
                                            ></div>
                                        </div>
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
                                    </div>
                                )}
                                {/* Arrow Between Nodes */}
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