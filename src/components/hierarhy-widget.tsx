import React from "react";
import * as THREE from "three";
import { ViewerContext } from "../hooks";

interface HierarchyNodeProps {
  object: THREE.Object3D;
  onSelect: (object: THREE.Object3D) => void;
  selectedObjectId: string | null;
}

const HierarchyNode: React.FC<HierarchyNodeProps> = ({
  object,
  onSelect,
  selectedObjectId,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const isSelected = object.uuid === selectedObjectId;

  const nodeStyle: React.CSSProperties = {
    cursor: "pointer",
    padding: "2px 4px",
    border: "1px solid #ccc",
    marginBottom: "2px",
    borderRadius: "4px",
    background: isSelected ? "#cceeff" : "#f9f9f9",
    color: "black",
  };

  return (
    <li>
      <div
        onClick={() => {
          onSelect(object);
          setExpanded((prev) => !prev);
        }}
        style={nodeStyle}
      >
        {object.name || object.type}
      </div>
      {expanded && object.children.length > 0 && (
        <ul
          style={{
            marginLeft: "12px",
            listStyleType: "none",
            padding: 0,
            color: "black",
          }}
        >
          {object.children.map((child) => (
            <HierarchyNode
              key={child.uuid}
              object={child}
              onSelect={onSelect}
              selectedObjectId={selectedObjectId}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const HierarchyWidget: React.FC = () => {
  const viewer = React.useContext(ViewerContext);
  const [selected, setSelected] = React.useState<THREE.Object3D | null>(null);

  const handleSelect = (object: THREE.Object3D) => {
    if (selected && selected instanceof THREE.Mesh && selected.material) {
      (selected.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
    }
    setSelected(object);
    if (object instanceof THREE.Mesh && object.material) {
      (object.material as THREE.MeshStandardMaterial).emissive.set(0x00ff00);
    }
  };

  if (!viewer || !viewer.model) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        background: "rgba(255,255,255,0.9)",
        padding: "10px",
        borderRadius: "4px",
        maxHeight: "90vh",
        overflowY: "auto",
        zIndex: 10,
      }}
    >
      <h4 style={{ color: "black" }}>Иерархия объектов</h4>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        <HierarchyNode
          object={viewer.model}
          onSelect={handleSelect}
          selectedObjectId={selected ? selected.uuid : null}
        />
      </ul>
    </div>
  );
};

export default HierarchyWidget;
