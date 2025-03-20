import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { motion } from "framer-motion";

export default function Roadmap() {
  const [nodes, setNodes] = useState([{ id: 1, text: "Start", subnodes: [] }]);
  const [lastAdded, setLastAdded] = useState("node-1");

  const addNode = () => {
    const newNode = {
      id: nodes.length + 1,
      text: `Node ${nodes.length + 1}`,
      subnodes: [],
    };
    setNodes([...nodes, newNode]);
    setLastAdded(`node-${newNode.id}`);
  };

  const addSubNode = (parentId) => {
    const parentNode = nodes.find((n) => n.id === parentId);
    const newSubnodeId = `${parentId}.${parentNode.subnodes.length + 1}`;

    setNodes(
      nodes.map((node) =>
        node.id === parentId
          ? {
              ...node,
              subnodes: [
                ...node.subnodes,
                {
                  id: newSubnodeId,
                  text: `Subnode ${parentNode.subnodes.length + 1}`,
                },
              ],
            }
          : node
      )
    );
    setLastAdded(`subnode-${newSubnodeId}`);
  };

  // A reusable vertical arrow
  const VerticalArrow = () => (
    <svg
      className="w-6 h-6 text-gray-500 my-2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-5-5l5 5 5-5" />
    </svg>
  );

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <div className="space-y-6">
        {nodes.map((node, nodeIndex) => {
          const isLastNode = nodeIndex === nodes.length - 1;

          return (
            <div key={node.id} className="flex flex-col items-center">
              {/* Main Node Card (bigger) */}
              <Card className="w-64 text-center shadow-lg">
                <CardContent className="p-4 font-semibold">{node.text}</CardContent>
              </Card>

              {/* Show arrow if there's at least one subnode OR another node below */}
              {(node.subnodes.length > 0 || !isLastNode) && <VerticalArrow />}

              {/* If this node is the last added, show node-level buttons */}
              {lastAdded === `node-${node.id}` && (
                <div className="flex gap-2 mb-2">
                  <Button onClick={addNode}>Add Node</Button>
                  <Button onClick={() => addSubNode(node.id)}>Add Subnode</Button>
                </div>
              )}

              {/* Subnodes (stacked vertically, smaller) */}
              {node.subnodes.length > 0 && (
                <div className="flex flex-col items-center">
                  {node.subnodes.map((subnode, subIndex) => {
                    const isLastSubnode = subIndex === node.subnodes.length - 1;
                    return (
                      <motion.div
                        key={subnode.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center"
                      >
                        {/* Subnode Card (smaller) */}
                        <Card className="w-48 text-center shadow-md">
                          <CardContent className="p-3 text-gray-700">
                            {subnode.text}
                          </CardContent>
                        </Card>

                        {/* If there's another subnode, show arrow */}
                        {!isLastSubnode && <VerticalArrow />}

                        {/* If this subnode is the last added, show subnode-level buttons */}
                        {lastAdded === `subnode-${subnode.id}` && (
                          <div className="flex gap-2 mb-2">
                            <Button onClick={addNode}>Add Node</Button>
                            <Button onClick={() => addSubNode(node.id)}>Add Subnode</Button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* If there's another main node below, show arrow after the last subnode */}
                  {!isLastNode && <VerticalArrow />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
