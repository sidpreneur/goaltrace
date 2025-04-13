import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../helper/supabaseClient";
import SavedTraceCard from "./SavedTraceCard";
import Navbar from "./Navbar";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";


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

// Modal component for displaying links, notes, and attachments
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-400">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const OpenTrace = () => {
  const { traceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [traceDetails, setTraceDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingNode, setEditingNode] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [traceInfo, setTraceInfo] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  const [showTraceModal, setShowTraceModal] = useState(false);
  const [nodeAttachments, setNodeAttachments] = useState({});

  // State for trace editing
  const [editingTrace, setEditingTrace] = useState(false);
  const [traceEditForm, setTraceEditForm] = useState({
    title: "",
    tags: "",
    visibilty: "private"
  });

  // State for links and notes
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [links, setLinks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // State for adding links and notes
  const [newLink, setNewLink] = useState("");
  const [newNote, setNewNote] = useState("");

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
          position,
          deadlines ( deadline )
        `)
        .eq("trace_id", trace_id)
        .order("position", { ascending: true }); // Changed to order by position ascending
      if (error) throw error;
      return data;
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load nodes.");
      return [];
    }
  };

  // Fetch attachments for a specific node
  const fetchAttachments = async (nodeId) => {
    setLoadingAttachments(true);
    try {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("node_id", nodeId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      
      setNodeAttachments(prev => ({
        ...prev,
        [nodeId]: data || []
      }));
      
      return data;
    } catch (err) {
      console.error("Failed to fetch attachments:", err);
      return [];
    } finally {
      setLoadingAttachments(false);
    }
  };
//handling addnode in exisitng
  const handleAddNode = async () => {
    try {
      const { data, error } = await supabase
        .from("nodes")
        .insert({
          trace_id: traceId,
          heading: "New Node",
          description: "Node description...",
          status: "red",
          position: traceDetails.length + 1, // next position
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
  
      if (error) throw error;
  
      const updated = await fetchTraceDetails(traceId);
      setTraceDetails(updated);
    } catch (err) {
      console.error("Failed to add node:", err);
      alert("Failed to add node. Please try again.");
    }
  };

  
  // Handle file upload for attachments
  const handleFileUpload = async (file, nodeId) => {
    if (!file || !nodeId) return;
    
    setUploadingFile(true);
    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${nodeId}/${fileName}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);
      
      // Add record to attachments table
      const { data, error } = await supabase
        .from("attachments")
        .insert({
          node_id: nodeId,
          file_url: publicUrl,
          uploaded_at: new Date().toISOString(),
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          // Assuming user_id is available in your app context
          user_id: "current_user_id" // Replace with actual user ID
        })
        .select();
        
      if (error) throw error;
      
      // Update state with new attachment
      setNodeAttachments(prev => ({
        ...prev,
        [nodeId]: [...(prev[nodeId] || []), data[0]]
      }));
      
      return data[0];
    } catch (err) {
      console.error("Failed to upload file:", err);
      alert("Failed to upload file. Please try again.");
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  // Delete an attachment
  const deleteAttachment = async (attachmentId, nodeId, filePath) => {
    if (!window.confirm("Delete this attachment?")) return;

    try {
      // Delete from Supabase Storage if filePath is provided
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('attachments')
          .remove([filePath]);
          
        if (storageError) console.error("Storage delete error:", storageError);
      }
      
      // Delete from attachments table
      const { error } = await supabase
        .from("attachments")
        .delete()
        .eq("attachment_id", attachmentId);

      if (error) throw error;
      
      // Update state
      setNodeAttachments(prev => ({
        ...prev,
        [nodeId]: prev[nodeId].filter(attachment => attachment.attachment_id !== attachmentId)
      }));
    } catch (err) {
      console.error("Failed to delete attachment:", err);
      alert("Failed to delete attachment. Please try again.");
    }
  };

  // Fetch links for a specific node
  const fetchLinks = async (nodeId) => {
    setLoadingLinks(true);
    try {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("node_id", nodeId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
      return data;
    } catch (err) {
      console.error("Failed to fetch links:", err);
      return [];
    } finally {
      setLoadingLinks(false);
    }
  };

  // Fetch notes for a specific node
  const fetchNotes = async (nodeId) => {
    setLoadingNotes(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("node_id", nodeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
      return data;
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      return [];
    } finally {
      setLoadingNotes(false);
    }
  };

  // Add a new link
  const addLink = async () => {
    if (!newLink.trim() || !currentNodeId) return;

    try {
      const { data, error } = await supabase
        .from("links")
        .insert({
          node_id: currentNodeId,
          file_url: newLink.trim(),
          uploaded_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      setLinks([data[0], ...links]);
      setNewLink("");
    } catch (err) {
      console.error("Failed to add link:", err);
      alert("Failed to add link. Please try again.");
    }
  };

  // Add a new note
  const addNote = async () => {
    if (!newNote.trim() || !currentNodeId) return;

    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          node_id: currentNodeId,
          content: newNote.trim(),
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      setNotes([data[0], ...notes]);
      setNewNote("");
    } catch (err) {
      console.error("Failed to add note:", err);
      alert("Failed to add note. Please try again.");
    }
  };

  // Delete a link
  const deleteLink = async (linkId) => {
    if (!window.confirm("Delete this link?")) return;

    try {
      const { error } = await supabase
        .from("links")
        .delete()
        .eq("links_id", linkId);

      if (error) throw error;
      setLinks(links.filter(link => link.links_id !== linkId));
    } catch (err) {
      console.error("Failed to delete link:", err);
      alert("Failed to delete link. Please try again.");
    }
  };

  // Delete a note
  const deleteNote = async (noteId) => {
    if (!window.confirm("Delete this note?")) return;

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("notes_id", noteId);

      if (error) throw error;
      setNotes(notes.filter(note => note.notes_id !== noteId));
    } catch (err) {
      console.error("Failed to delete note:", err);
      alert("Failed to delete note. Please try again.");
    }
  };

  // Handle opening links modal
  const handleOpenLinks = (nodeId) => {
    setCurrentNodeId(nodeId);
    fetchLinks(nodeId);
    setShowLinksModal(true);
  };

  // Handle opening notes modal
  const handleOpenNotes = (nodeId) => {
    setCurrentNodeId(nodeId);
    fetchNotes(nodeId);
    setShowNotesModal(true);
  };

  // Handle opening attachments modal
  const handleOpenAttachments = (nodeId) => {
    setCurrentNodeId(nodeId);
    fetchAttachments(nodeId);
    setShowAttachmentsModal(true);
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
    user_id,
    visibility,
    trace_tags (
      tag_id,
      tags (
        name,
        tag_id
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
        setIsOwner(trace.user_id === user?.id);
        setTraceInfo({ ...trace, tags: tagNames });
        // Initialize trace edit form
        setTraceEditForm({
          title: trace.title || "Untitled Trace",
          tags: tagNames.join(", "),
          visibility: trace.visibility || "private", // <- Add this
        });
      }

      setTraceDetails(details);
      setLoading(false);
    })();
  }, [traceId]);

  // Fetch initial attachments for all nodes
  useEffect(() => {
    if (traceDetails.length > 0) {
      traceDetails.forEach(node => {
        fetchAttachments(node.node_id);
      });
    }
  }, [traceDetails]);

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

  // Handle saving trace edits
  const handleSaveTraceEdit = async () => {
    try {
      // Update trace title
      await supabase
        .from("traces")
        .update({ title: traceEditForm.title })
        .eq("trace_id", traceId);

      // Fetch existing tags for this trace
      const { data: existingTraceTags } = await supabase
        .from("trace_tags")
        .select("tag_id")
        .eq("trace_id", traceId);

      // Remove existing tag associations
      await supabase
        .from("trace_tags")
        .delete()
        .eq("trace_id", traceId);

        await supabase
  .from("traces")
  .update({
    title: traceEditForm.title,
    visibility: traceEditForm.visibility,
  })
  .eq("trace_id", traceId);


      // Parse and add new tags
      const newTagNames = traceEditForm.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag);

      for (const tagName of newTagNames) {
        // Check if tag already exists
        let { data: existingTag } = await supabase
          .from("tags")
          .select("tag_id")
          .eq("name", tagName)
          .maybeSingle();

        let tagId;
        if (existingTag) {
          tagId = existingTag.tag_id;
        } else {
          // Create new tag
          const { data: newTag } = await supabase
            .from("tags")
            .insert({ name: tagName })
            .select("tag_id")
            .single();
          tagId = newTag.tag_id;
        }

        // Create association
        await supabase
          .from("trace_tags")
          .insert({ trace_id: traceId, tag_id: tagId });
      }

      // Refresh trace info
      const { data: updatedTrace } = await supabase
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

      const updatedTagNames = (updatedTrace.trace_tags || [])
        .map(tt => tt.tags?.name)
        .filter(Boolean);

      setTraceInfo({ ...updatedTrace, tags: updatedTagNames, visibility: traceEditForm.visibility, });
      setEditingTrace(false);
    } catch (err) {
      console.error("Failed to update trace:", err);
      setErrorMsg("Failed to save trace changes.");
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

  // Editable trace card component with clickable functionality
  const EditableTraceCard = () => {
    if (editingTrace) {
      return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-72">
          <div className="mb-2">
            <label className="block text-gray-400 text-sm mb-1">Title</label>
            <input
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 text-sm"
              type="text"
              value={traceEditForm.title}
              onChange={(e) => setTraceEditForm({ ...traceEditForm, title: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 mb-2">
  <button
    onClick={() =>
      setTraceEditForm((prev) => ({
        ...prev,
        visibility: prev.visibility === "public" ? "private" : "public",
      }))
    }
    className="flex items-center text-sm gap-1 text-white bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
  >
    {traceEditForm.visibility === "public" ? (
      <>
        <Eye className="w-4 h-4 text-green-400" />
        <span className="text-green-400 font-bold">Public</span>
      </>
    ) : (
      <>
        <EyeOff className="w-4 h-4 text-yellow-400" />
        <span className="text-yellow-400 font-bold">Private</span>
      </>
    )}
  </button>
</div>

          <div className="mb-2">
            <label className="block text-gray-400 text-sm mb-1">Tags (comma separated)</label>
            <input
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 text-sm"
              type="text"
              value={traceEditForm.tags}
              placeholder="tag1, tag2, tag3"
              onChange={(e) => setTraceEditForm({ ...traceEditForm, tags: e.target.value })}
            />
          </div>
          <div className="flex justify-end mt-2">
            <button
              className="bg-gray-600 text-white px-2 py-1 rounded text-xs mr-2 hover:bg-gray-700"
              onClick={() => setEditingTrace(false)}
            >
              Cancel
            </button>
            <button
              className="bg-[#8F79BE] text-white px-2 py-1 rounded text-xs hover:opacity-90"
              onClick={handleSaveTraceEdit}
            >
              Save
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="relative group w-64 cursor-pointer transition-transform duration-200 hover:scale-105"
        onClick={() => {
          if (isOwner) setEditingTrace(true);
        }}
              >
        <div className="w-full">
        <SavedTraceCard
  title={traceInfo?.title || "Untitled Trace"}
  tags={Array.isArray(traceInfo?.tags) ? traceInfo.tags : []}
  visibility={traceInfo?.visibility}
/>

        </div>
      </div>
    );
  };

  if (loading) return <p className="text-center text-gray-400">Loading...</p>;
  if (errorMsg) return <p className="text-center text-red-500">{errorMsg}</p>;

  return (
    
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 relative">
        
        {/* Trace info card with edit functionality */}
        {traceInfo && (
          <div className="hidden md:block md:fixed md:left-6 md:top-20 z-10">
            <EditableTraceCard />
          </div>
        )}

        {/* Mobile view for trace info */}
        {traceInfo && (
          <div className="md:hidden mb-6">
            <EditableTraceCard />
          </div>
        )}
        
        
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
                      <div className={`flex justify-center ${isOwner ? "gap-4 p-6" : "gap-8 p-6"}`}>
                      {isOwner && (
                        <button
                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                          onClick={() => handleDelete(node.node_id)}
                        >
                          Delete
                        </button>
                        )}

                        <button
                          className="bg-[#8F79BE] text-white px-3 py-2 rounded-lg hover:opacity-90"
                          onClick={() => handleOpenLinks(node.node_id)}
                        >
                          Links
                        </button>
                        
                        <button
                          className="bg-[#8F79BE] text-white px-3 py-2 rounded-lg hover:opacity-90"
                          onClick={() => handleOpenNotes(node.node_id)}
                        >
                          Notes
                        </button>
                        <button
                          className="bg-[#8F79BE] text-white px-3 py-2 rounded-lg hover:opacity-90"
                          onClick={() => handleOpenAttachments(node.node_id)}
                        >
                          Attachments
                        </button>
                        {isOwner && (
                        <button
                          className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600"
                          onClick={() => handleEdit(node)}
                        >
                          Edit
                        </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <>
  {idx < traceDetails.length - 1 ? (
    <VerticalArrow />
  ) : (
    // Only after last node, show the Add Node Button
    isOwner && (
      <div className="flex justify-center mt-8">
        <Button onClick={handleAddNode}>+ Add New Node</Button>
      </div>
    )
  )}
</>


            </React.Fragment>
          ))
        ) : (
          <p className="text-gray-400 text-center text-lg">
            No nodes found for this trace.
          </p>
        )}
      </div>

      {/* Links Modal */}
      <Modal
        isOpen={showLinksModal}
        onClose={() => setShowLinksModal(false)}
        title="Links"
      >
        {isOwner && (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add new link URL"
              className="flex-1 p-2 bg-gray-700 text-white rounded border border-gray-600"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
            />
            <button
              onClick={addLink}
              className="bg-[#8F79BE] text-white px-3 py-2 rounded hover:opacity-90"
            >
              Add
            </button>
          </div>
        </div>
        )}
        {loadingLinks ? (
          <p className="text-gray-400 text-center">Loading links...</p>
        ) : (
          <div className="space-y-2">
            {links.length > 0 ? (
              links.map((link) => (
                <div
                  key={link.links_id}
                  className="flex items-center justify-between bg-gray-700 p-2 rounded"
                >
                  <a
                    href={link.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline truncate"
                  >
                    {link.file_url}
                  </a>
                  
                  {isOwner && (
  <button
    onClick={() => deleteLink(link.links_id)}
    className="text-red-400 hover:text-red-500"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  </button>
)}

                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center">No links found.</p>
            )}
          </div>
        )}
      </Modal>

      {/* Notes Modal */}
      <Modal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        title="Notes"
      >
        {isOwner && (

        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <textarea
              placeholder="Add new note"
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
            />
            <button
              onClick={addNote}
              className="bg-[#8F79BE] text-white px-3 py-2 rounded hover:opacity-90"
            >
              Add Note
            </button>
          </div>
        </div>
        )}
        {loadingNotes ? (
          <p className="text-gray-400 text-center">Loading notes...</p>
        ) : (
          <div className="space-y-3">
            {notes.length > 0 ? (
              notes.map((note) => (
                <div
                  key={note.notes_id}
                  className="bg-gray-700 p-3 rounded"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-gray-400">
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                    {isOwner && (
  <button
    onClick={() => deleteNote(note.notes_id)}
    className="text-red-400 hover:text-red-500"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  </button>
)}

                  </div>
                  <p className="text-white whitespace-pre-wrap">{note.content}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center">No notes found.</p>
            )}
          </div>
        )}
      </Modal>

      {/* Attachments Modal */}
      <Modal
        isOpen={showAttachmentsModal}
        onClose={() => setShowAttachmentsModal(false)}
        title="Attachments"
      >
        {isOwner && (

        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0], currentNodeId);
                }
              }}
            />
            <label
              htmlFor="file-upload"
              className="bg-[#8F79BE] text-white px-3 py-2 rounded text-center cursor-pointer hover:opacity-90"
            >
              {uploadingFile ? "Uploading..." : "Upload File"}
            </label>
          </div>
        </div>
        )}
        {loadingAttachments ? (
          <p className="text-gray-400 text-center">Loading attachments...</p>
        ) : (
          <div className="space-y-2">
            {nodeAttachments[currentNodeId]?.length > 0 ? (
              nodeAttachments[currentNodeId].map((attachment) => (
                <div
                  key={attachment.attachment_id}
                  className="flex items-center justify-between bg-gray-700 p-2 rounded"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <a
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline truncate"
                    >
                      {attachment.file_name || "File"}
                      {attachment.file_size && (
                        <span className="text-xs text-gray-400 ml-2">
                          {(attachment.file_size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </a>
                  </div>
                  {isOwner && (
  <button
    onClick={() => deleteAttachment(attachment.attachment_id, currentNodeId, attachment.file_path)}
    className="text-red-400 hover:text-red-500 ml-2"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  </button>
)}

                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center">No attachments found.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OpenTrace;