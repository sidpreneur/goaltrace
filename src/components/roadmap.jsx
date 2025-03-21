import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { motion } from "framer-motion";

export default function Roadmap() {
  const [nodes, setNodes] = useState([{ id: 1, subnodes: [] }]);
  const [lastAdded, setLastAdded] = useState("node-1");

  const addNode = () => {
    const newNode = {
      id: nodes.length + 1,
      subnodes: [],
    };
    setNodes([...nodes, newNode]);
    setLastAdded(`node-${newNode.id}`);
  };

  const addSubNode = (parentId) => {
    setNodes(
      nodes.map((node) =>
        node.id === parentId
          ? {
              ...node,
              subnodes: [
                ...node.subnodes,
                {
                  id: `${parentId}.${node.subnodes.length + 1}`,
                },
              ],
            }
          : node
      )
    );
    setLastAdded(`subnode-${parentId}.${nodes.find(n => n.id === parentId).subnodes.length + 1}`);
  };

  // A reusable vertical arrow
  const VerticalArrow = () => (
    <div className="flex justify-center py-6">
      <svg
        className="w-6 h-6 text-gray-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-5-5l5 5 5-5" />
      </svg>
    </div>
  );

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <div className="flex flex-col items-center">
        {nodes.map((node, nodeIndex) => {
          const isLastNode = nodeIndex === nodes.length - 1;

          return (
            <div key={node.id} className="flex flex-col items-center w-full">
              {/* Main Node Card (bigger) */}
              <Card className="w-64 text-center shadow-lg">
                <CardContent className="p-4 font-semibold"></CardContent>
              </Card>

              {(node.subnodes.length > 0 || !isLastNode) && <VerticalArrow />}

              {lastAdded === `node-${node.id}` && (
                <div className="flex gap-2 mb-6">
                  <Button onClick={addNode}>Add Node</Button>
                  <Button onClick={() => addSubNode(node.id)}>Add Subnode</Button>
                </div>
              )}

              {node.subnodes.length > 0 && (
                <div className="flex flex-col items-center w-full">
                  {node.subnodes.map((subnode, subIndex) => {
                    const isLastSubnode = subIndex === node.subnodes.length - 1;
                    return (
                      <motion.div
                        key={subnode.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center w-full"
                      >
                        <Card className="w-40 text-center shadow-md">
                          <CardContent className="p-2 text-sm text-gray-700"></CardContent>
                        </Card>

                        {(!isLastSubnode || !isLastNode) && <VerticalArrow />}

                        {lastAdded === `subnode-${subnode.id}` && (
                          <div className="flex gap-2 mb-6">
                            <Button onClick={addNode}>Add Node</Button>
                            <Button onClick={() => addSubNode(node.id)}>Add Subnode</Button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
