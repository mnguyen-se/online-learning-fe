import React, { useState, useRef, useEffect } from 'react';
import './MatchingQuestion.css';

const MatchingQuestion = ({ question, answerValue, onChange }) => {
  const [connections, setConnections] = useState([]);
  const [draggingFrom, setDraggingFrom] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);
  const containerRef = useRef(null);
  const columnARef = useRef(null);
  const columnBRef = useRef(null);

  const columnA = Array.isArray(question.columnA) ? question.columnA : [];
  const columnB = Array.isArray(question.columnB) ? question.columnB : [];

  // Parse existing answer value to connections
  useEffect(() => {
    if (answerValue) {
      const pairs = answerValue
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '')
        .map((line) => {
          const [aId, bId] = line.split(':').map((id) => id?.trim() ?? '');
          return { aId, bId };
        })
        .filter((pair) => pair.aId && pair.bId);
      setConnections(pairs);
    } else {
      setConnections([]);
    }
  }, [answerValue]);

  // Update answer value when connections change
  useEffect(() => {
    const newValue = connections
      .map((conn) => `${conn.aId}:${conn.bId}`)
      .join('\n');
    if (onChange && newValue !== answerValue) {
      onChange(newValue);
    }
  }, [connections]);

  const handleItemClick = (itemId, column) => {
    if (column === 'A') {
      // Click on column A item
      if (draggingFrom && draggingFrom.column === 'A' && draggingFrom.id === itemId) {
        // Cancel drag
        setDraggingFrom(null);
        return;
      }
      // Start drag from A
      setDraggingFrom({ column: 'A', id: itemId });
    } else if (column === 'B') {
      // Click on column B item
      if (draggingFrom && draggingFrom.column === 'A') {
        // Complete connection from A to B
        const existingIndex = connections.findIndex((conn) => conn.aId === draggingFrom.id);
        if (existingIndex >= 0) {
          // Update existing connection
          const newConnections = [...connections];
          newConnections[existingIndex] = { aId: draggingFrom.id, bId: itemId };
          setConnections(newConnections);
        } else {
          // Add new connection
          setConnections([...connections, { aId: draggingFrom.id, bId: itemId }]);
        }
        setDraggingFrom(null);
        setHoverTarget(null);
      } else if (draggingFrom && draggingFrom.column === 'B' && draggingFrom.id === itemId) {
        // Cancel drag
        setDraggingFrom(null);
      } else {
        // Start drag from B (to remove connection)
        setDraggingFrom({ column: 'B', id: itemId });
      }
    }
  };

  const handleItemHover = (itemId, column) => {
    if (draggingFrom && draggingFrom.column === 'A' && column === 'B') {
      setHoverTarget({ column: 'B', id: itemId });
    } else if (draggingFrom && draggingFrom.column === 'B') {
      setHoverTarget(null);
    }
  };

  const handleRemoveConnection = (aId) => {
    setConnections(connections.filter((conn) => conn.aId !== aId));
  };

  const [itemPositions, setItemPositions] = useState({});
  const arrowsContainerRef = useRef(null);

  // Update item positions when layout changes
  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current || !columnARef.current || !columnBRef.current || !arrowsContainerRef.current) return;

      const arrowsRect = arrowsContainerRef.current.getBoundingClientRect();
      const positions = {};

      // Get positions for column A (relative to arrows container)
      const itemsA = columnARef.current.querySelectorAll('.matching-item');
      itemsA.forEach((item) => {
        const itemId = item.dataset.itemId;
        if (itemId) {
          const rect = item.getBoundingClientRect();
          positions[`A-${itemId}`] = {
            x: rect.right - arrowsRect.left,
            y: rect.top + rect.height / 2 - arrowsRect.top,
          };
        }
      });

      // Get positions for column B (relative to arrows container)
      const itemsB = columnBRef.current.querySelectorAll('.matching-item');
      itemsB.forEach((item) => {
        const itemId = item.dataset.itemId;
        if (itemId) {
          const rect = item.getBoundingClientRect();
          positions[`B-${itemId}`] = {
            x: rect.left - arrowsRect.left,
            y: rect.top + rect.height / 2 - arrowsRect.top,
          };
        }
      });

      setItemPositions(positions);
    };

    // Delay to ensure DOM is ready
    const timeout = setTimeout(updatePositions, 50);
    updatePositions();
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, true);
    const interval = setInterval(updatePositions, 200);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions, true);
      clearInterval(interval);
    };
  }, [columnA, columnB, connections, draggingFrom]);

  const getItemPosition = (itemId, column) => {
    const key = `${column}-${itemId}`;
    return itemPositions[key] || null;
  };

  const getConnectionPath = (aId, bId) => {
    const posA = getItemPosition(aId, 'A');
    const posB = getItemPosition(bId, 'B');
    if (!posA || !posB) return null;

    const startX = posA.x;
    const startY = posA.y;
    const endX = posB.x;
    const endY = posB.y;

    // Create curved path with smooth bezier curve
    const controlPoint1X = startX + (endX - startX) * 0.5;
    const controlPoint1Y = startY;
    const controlPoint2X = endX - (endX - startX) * 0.5;
    const controlPoint2Y = endY;

    return `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
  };

  const [svgDimensions, setSvgDimensions] = useState({ width: 200, height: 100 });

  useEffect(() => {
    const updateSvgDimensions = () => {
      if (!arrowsContainerRef.current) return;
      const rect = arrowsContainerRef.current.getBoundingClientRect();
      setSvgDimensions({ 
        width: Math.max(rect.width || 200, 200), 
        height: Math.max(rect.height || 100, 100) 
      });
    };

    const timeout = setTimeout(updateSvgDimensions, 50);
    updateSvgDimensions();
    window.addEventListener('resize', updateSvgDimensions);
    const interval = setInterval(updateSvgDimensions, 200);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateSvgDimensions);
      clearInterval(interval);
    };
  }, [columnA, columnB]);

  const isItemConnected = (itemId, column) => {
    if (column === 'A') {
      return connections.some((conn) => conn.aId === itemId);
    }
    return connections.some((conn) => conn.bId === itemId);
  };

  const getConnectedItem = (itemId, column) => {
    if (column === 'A') {
      const conn = connections.find((c) => c.aId === itemId);
      return conn ? conn.bId : null;
    }
    const conn = connections.find((c) => c.bId === itemId);
    return conn ? conn.aId : null;
  };

  return (
    <div className="matching-question-container" ref={containerRef}>
      <div className="matching-columns">
        <div className="matching-column matching-column-a" ref={columnARef}>
          <div className="matching-column-header">Cột A</div>
          {columnA.map((item) => {
            const itemId = item.id || item.itemId || '';
            const itemText = item.text || item.itemText || '';
            const isConnected = isItemConnected(itemId, 'A');
            const isDragging = draggingFrom?.column === 'A' && draggingFrom.id === itemId;
            const connectedBId = getConnectedItem(itemId, 'A');

            return (
              <div
                key={itemId}
                data-item-id={itemId}
                className={`matching-item matching-item-a ${isConnected ? 'connected' : ''} ${isDragging ? 'dragging' : ''}`}
                onClick={() => handleItemClick(itemId, 'A')}
                onMouseEnter={() => handleItemHover(itemId, 'A')}
              >
                <div className="matching-item-content">
                  <span className="matching-item-id">{itemId}</span>
                  <span className="matching-item-text">{itemText}</span>
                </div>
                {isConnected && (
                  <button
                    className="matching-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveConnection(itemId);
                    }}
                    title="Xóa kết nối"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="matching-arrows-container" ref={arrowsContainerRef}>
          <svg
            className="matching-arrows-svg"
            width={svgDimensions.width}
            height={svgDimensions.height}
            viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <marker
                id={`arrowhead-${question.questionId || 'default'}`}
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#2563eb" />
              </marker>
            </defs>
            {connections.map((conn, index) => {
              const path = getConnectionPath(conn.aId, conn.bId);
              if (!path) return null;
              return (
                <path
                  key={`${conn.aId}-${conn.bId}-${index}`}
                  d={path}
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  fill="none"
                  markerEnd={`url(#arrowhead-${question.questionId || 'default'})`}
                  className="matching-arrow"
                />
              );
            })}
            {draggingFrom && draggingFrom.column === 'A' && hoverTarget && hoverTarget.column === 'B' && (
              (() => {
                const path = getConnectionPath(draggingFrom.id, hoverTarget.id);
                if (!path) return null;
                return (
                  <path
                    d={path}
                    stroke="#94a3b8"
                    strokeWidth="2.5"
                    strokeDasharray="5,5"
                    fill="none"
                    className="matching-arrow-preview"
                  />
                );
              })()
            )}
          </svg>
        </div>

        <div className="matching-column matching-column-b" ref={columnBRef}>
          <div className="matching-column-header">Cột B</div>
          {columnB.map((item) => {
            const itemId = item.id || item.itemId || '';
            const itemText = item.text || item.itemText || '';
            const isConnected = isItemConnected(itemId, 'B');
            const isDragging = draggingFrom?.column === 'B' && draggingFrom.id === itemId;
            const isHoverTarget = hoverTarget?.column === 'B' && hoverTarget.id === itemId;

            return (
              <div
                key={itemId}
                data-item-id={itemId}
                className={`matching-item matching-item-b ${isConnected ? 'connected' : ''} ${isDragging ? 'dragging' : ''} ${isHoverTarget ? 'hover-target' : ''}`}
                onClick={() => handleItemClick(itemId, 'B')}
                onMouseEnter={() => handleItemHover(itemId, 'B')}
                onMouseLeave={() => {
                  if (hoverTarget?.column === 'B' && hoverTarget.id === itemId) {
                    setHoverTarget(null);
                  }
                }}
              >
                <div className="matching-item-content">
                  <span className="matching-item-id">{itemId}</span>
                  <span className="matching-item-text">{itemText}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="matching-instructions">
        <p>Nhấp vào một item ở cột A, sau đó nhấp vào item tương ứng ở cột B để tạo kết nối.</p>
        <p>Nhấp vào nút × để xóa kết nối.</p>
        <p className="matching-format-hint">
          <strong>Lưu ý:</strong> Câu MATCHING cần nhập mỗi dòng theo định dạng aId:bId.
        </p>
      </div>
      
      {connections.length > 0 && (
        <div className="matching-results">
          <h4 className="matching-results-title">Kết quả nối của bạn:</h4>
          <div className="matching-results-list">
            {connections.map((conn, index) => {
              const itemA = columnA.find((item) => (item.id || item.itemId) === conn.aId);
              const itemB = columnB.find((item) => (item.id || item.itemId) === conn.bId);
              const textA = itemA?.text || itemA?.itemText || conn.aId;
              const textB = itemB?.text || itemB?.itemText || conn.bId;
              
              return (
                <div key={`${conn.aId}-${conn.bId}-${index}`} className="matching-result-item">
                  <span className="matching-result-pair">
                    <span className="matching-result-a">{conn.aId}: {textA}</span>
                    <span className="matching-result-arrow">→</span>
                    <span className="matching-result-b">{conn.bId}: {textB}</span>
                  </span>
                  <button
                    className="matching-result-remove"
                    onClick={() => handleRemoveConnection(conn.aId)}
                    title="Xóa kết nối này"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingQuestion;
