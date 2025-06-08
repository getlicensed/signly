import React, { useRef, useState } from "react";

interface DraggableSignatureBoxProps {
  field: {
    x: number;
    y: number;
    page: number;
    id: string;
  };
  viewport: { width: number; height: number } | null;
  onMove: (x: number, y: number) => void;
  onRemove: () => void;
  onDragEnd?: () => void;
}

const BOX_SIZE = 64;

const DraggableSignatureBox: React.FC<DraggableSignatureBoxProps> = ({ field, viewport, onMove, onRemove, onDragEnd }) => {
  const [dragging, setDragging] = useState(false);
  const offset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragging(true);
    const box = e.currentTarget.getBoundingClientRect();
    offset.current = {
      x: e.clientX - box.left,
      y: e.clientY - box.top,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!viewport) return;
    const parent = (e.target as HTMLElement).closest('.relative');
    if (!parent) return;
    const parentRect = (parent as HTMLElement).getBoundingClientRect();
    let x = (e.clientX - parentRect.left - offset.current.x + BOX_SIZE / 2) / viewport.width;
    let y = (e.clientY - parentRect.top - offset.current.y + BOX_SIZE / 2) / viewport.height;
    // Clamp to [0,1]
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    onMove(x, y);
  };

  const handleMouseUp = () => {
    setDragging(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    if (typeof onDragEnd === 'function') onDragEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setDragging(true);
    const box = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    offset.current = {
      x: touch.clientX - box.left,
      y: touch.clientY - box.top,
    };
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!viewport) return;
    const parent = (e.target as HTMLElement).closest('.relative');
    if (!parent) return;
    const parentRect = (parent as HTMLElement).getBoundingClientRect();
    const touch = e.touches[0];
    let x = (touch.clientX - parentRect.left - offset.current.x + BOX_SIZE / 2) / viewport.width;
    let y = (touch.clientY - parentRect.top - offset.current.y + BOX_SIZE / 2) / viewport.height;
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    onMove(x, y);
  };

  const handleTouchEnd = () => {
    setDragging(false);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    if (typeof onDragEnd === 'function') onDragEnd();
  };


  let label: React.ReactNode = null;
  switch (field.type) {
    case "signature":
      label = <span className="text-blue-700 font-bold">Sign</span>;
      break;
    case "name":
      label = <span className="text-green-700 font-bold">Name</span>;
      break;
    case "date":
      label = <span className="text-purple-700 font-bold">Date</span>;
      break;
    case "initials":
      label = <span className="text-pink-700 font-bold">Init</span>;
      break;
    default:
      label = null;
  }

  return (
    <div
      className={`absolute border-2 border-blue-600 bg-blue-100 bg-opacity-50 rounded-md flex items-center justify-center group select-none ${dragging ? 'opacity-80' : ''}`}
      style={{
        left: `calc(${field.x * 100}% - ${BOX_SIZE / 2}px)` ,
        top: `calc(${field.y * 100}% - ${BOX_SIZE / 2}px)` ,
        width: BOX_SIZE,
        height: BOX_SIZE,
        zIndex: 2,
        cursor: dragging ? 'grabbing' : 'move',
        transition: dragging ? 'none' : 'box-shadow 0.2s',
        boxShadow: dragging ? '0 0 0 2px #2563eb' : undefined,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      tabIndex={0}
      role="button"
      aria-label="Drag signature field"
    >
      {label}
      <button
        className="ml-1 text-xs text-red-500 bg-white bg-opacity-80 rounded-full px-1 py-0.5 opacity-0 group-hover:opacity-100 transition"
        style={{ position: 'absolute', top: -10, right: -10 }}
        onClick={e => { e.stopPropagation(); onRemove(); }}
        title="Remove"
      >✕</button>
    </div>
  );
};

export default DraggableSignatureBox;
