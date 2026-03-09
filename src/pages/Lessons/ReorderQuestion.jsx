import React, { useState, useEffect } from 'react';
import './ReorderQuestion.css';

const ReorderQuestion = ({ question, answerValue, onChange }) => {
  const items = Array.isArray(question.items) ? question.items : [];
  const [orderedItems, setOrderedItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);

  // Parse existing answer value to ordered items
  useEffect(() => {
    if (answerValue && answerValue.trim()) {
      const orderedIds = answerValue
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id !== '');
      
      // Reorder items based on answer
      const ordered = orderedIds
        .map((id) => {
          // Try to find by index (item0, item1, etc.)
          const indexMatch = id.match(/item(\d+)/i);
          if (indexMatch) {
            const index = parseInt(indexMatch[1], 10);
            if (index >= 0 && index < items.length) {
              return items[index];
            }
          }
          // Try to find by exact match
          const exactMatch = items.find((item) => item === id || String(item) === id);
          if (exactMatch !== undefined) {
            return exactMatch;
          }
          return null;
        })
        .filter((item) => item !== null);
      
      // Add any missing items at the end (preserve original order for missing items)
      const missingItems = items.filter((item) => !ordered.includes(item));
      setOrderedItems([...ordered, ...missingItems]);
    } else {
      // Default: use original order
      setOrderedItems([...items]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerValue, items.length, JSON.stringify(items)]); // Detect changes in items array

  // Update answer value when order changes
  useEffect(() => {
    if (orderedItems.length > 0) {
      const newValue = orderedItems
        .map((item, index) => {
          // Use index-based format: item0, item1, etc.
          const originalIndex = items.indexOf(item);
          return originalIndex >= 0 ? `item${originalIndex}` : String(item);
        })
        .join(',');
      
      if (onChange && newValue !== answerValue) {
        onChange(newValue);
      }
    }
  }, [orderedItems]);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDraggedOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverIndex(index);
  };

  const handleDragLeave = () => {
    setDraggedOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedOverIndex(null);
      return;
    }

    const newOrderedItems = [...orderedItems];
    const draggedItemValue = newOrderedItems[draggedItem];
    
    // Remove dragged item
    newOrderedItems.splice(draggedItem, 1);
    
    // Insert at new position
    const newIndex = draggedItem < dropIndex ? dropIndex - 1 : dropIndex;
    newOrderedItems.splice(newIndex, 0, draggedItemValue);
    
    setOrderedItems(newOrderedItems);
    setDraggedItem(null);
    setDraggedOverIndex(null);
  };

  const handleItemClick = (index) => {
    // Move item to end
    const newOrderedItems = [...orderedItems];
    const item = newOrderedItems.splice(index, 1)[0];
    newOrderedItems.push(item);
    setOrderedItems(newOrderedItems);
  };

  const handleReset = () => {
    setOrderedItems([...items]);
  };

  return (
    <div className="reorder-question-container">
      <div className="reorder-instructions">
        <p>Kéo thả các ô để sắp xếp lại thứ tự. Hoặc nhấp vào ô để di chuyển nó xuống cuối.</p>
      </div>
      
      <div className="reorder-items-container">
        {orderedItems.length === 0 ? (
          <div className="reorder-empty">Chưa có item nào để sắp xếp</div>
        ) : (
          orderedItems.map((item, index) => {
            const isDragging = draggedItem === index;
            const isDragOver = draggedOverIndex === index;
            
            return (
              <div
                key={`${item}-${index}`}
                draggable
                className={`reorder-item ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => handleItemClick(index)}
              >
                <div className="reorder-item-number">{index + 1}</div>
                <div className="reorder-item-content">{item}</div>
                <div className="reorder-item-drag-handle">⋮⋮</div>
              </div>
            );
          })
        )}
      </div>

      {orderedItems.length > 0 && (
        <div className="reorder-actions">
          <button
            type="button"
            className="reorder-reset-btn"
            onClick={handleReset}
          >
            Đặt lại thứ tự ban đầu
          </button>
        </div>
      )}

    </div>
  );
};

export default ReorderQuestion;
