'use client';

import React, { useState, useEffect, useCallback } from 'react';

const getCellSize = () => {
  if (typeof window === 'undefined') return 20;
  return window.innerWidth < 768 ? 15 : 20;
};

function createEmptyGrid(width: number, height: number): boolean[][] {
  const cellSize = getCellSize();
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  // Reduce initial density on mobile
  const density = window.innerWidth < 768 ? 0.9 : 0.8;
  return Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null)
        .map(() => Math.random() > density)
    );
}

function runSimulation(grid: boolean[][]): boolean[][] {
  return grid.map((row, i) =>
    row.map((cell, j) => {
      const neighbors = [
        grid[i - 1]?.[j - 1],
        grid[i - 1]?.[j],
        grid[i - 1]?.[j + 1],
        grid[i]?.[j - 1],
        grid[i]?.[j + 1],
        grid[i + 1]?.[j - 1],
        grid[i + 1]?.[j],
        grid[i + 1]?.[j + 1],
      ].filter(Boolean).length;

      if (cell && (neighbors < 2 || neighbors > 3)) return false;
      if (!cell && neighbors === 3) return true;
      return cell;
    })
  );
}

export function GameOfLife() {
  const [dimensions, setDimensions] = useState({ width: 1000, height: 1000 });
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [cellSize, setCellSize] = useState(getCellSize());

  useEffect(() => {
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setCellSize(getCellSize());
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setGrid(createEmptyGrid(dimensions.width, dimensions.height));
  }, [dimensions]);

  const updateGrid = useCallback(() => {
    setGrid(runSimulation);
  }, []);

  useEffect(() => {
    // Slower update interval on mobile for better performance
    const interval = window.innerWidth < 768 ? 200 : 150;
    const intervalId = setInterval(updateGrid, interval);
    return () => clearInterval(intervalId);
  }, [updateGrid]);

  if (grid.length === 0) return null;

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: -1 }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.ceil(dimensions.width / cellSize)}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${Math.ceil(dimensions.height / cellSize)}, ${cellSize}px)`,
          height: '100vh',
          width: '100vw',
        }}
      >
        {grid.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: cell
                  ? 'rgba(200, 200, 200, 0.2)'
                  : 'transparent',
                transition: 'background-color 0.3s ease',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}